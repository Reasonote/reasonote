import {
  z,
  ZodType
} from 'zod'

import { jwtBearerify } from '@reasonote/lib-utils'

export interface ApiRouteModel<
  TReqZ extends ZodType<any>,
  TRespZ extends ZodType<any>
> {
  path: string;
  method: "get" | "post" | "put" | "delete";
  requestSchema: TReqZ;
  responseSchema: TRespZ;
}

export interface ApiRouteCallOptions {
  baseUrl?: string;
  headers?: Record<string, any>;
  errorOnParseFailure?: boolean;
}

export class ApiRoute<TReqZ extends ZodType<any> = any, TRespZ extends ZodType<any> = any>
  implements ApiRouteModel<TReqZ, TRespZ>
{
  path: string;
  method: "get" | "post" | "put" | "delete";
  requestSchema: TReqZ;
  responseSchema: TRespZ;

  constructor(params: ApiRouteModel<TReqZ, TRespZ>) {
    this.path = params.path;
    this.method = params.method;
    this.requestSchema = params.requestSchema;
    this.responseSchema = params.responseSchema;
  }

  /**
   * Makes a regular API call and returns a Promise with the response
   */
  call(
    req?: z.input<TReqZ>,
    opts?: ApiRouteCallOptions,
    formData?: FormData
  ): Promise<ResponseOfZod<TRespZ>> {
    return genericCall({ route: this, req, opts, formData });
  }

  /**
   * Makes a streaming API call that yields array items as they arrive
   */
  callArrayStream(
    req?: z.input<TReqZ>,
    opts?: ApiRouteCallOptions,
    formData?: FormData
  ): AsyncGenerator<z.infer<TRespZ>, void, unknown> {
    return genericCallArrayStream({ route: this, req, opts, formData });
  }
}

export async function genericCall<
  TReqZ extends ZodType<any>,
  TRespZ extends ZodType<any>
>({
  route,
  req,
  opts,
  formData
}: {
  route: ApiRoute<TReqZ, TRespZ>,
  req?: z.infer<TReqZ>,
  opts?: ApiRouteCallOptions,
  formData?: FormData
}): Promise<ResponseOf<typeof route>> {
  const { headers: additionalHeaders, baseUrl } = opts || {};
  let fetchArgs: Parameters<typeof fetch> | undefined;
  let response: Response | undefined;
  let respJson: any;

  const token = getAuthToken();

  try {
    const headers = createHeaders(token, additionalHeaders, formData);

    const url = baseUrl ? new URL(route.path, baseUrl).toString() : route.path;

    fetchArgs = [
      url,
      {
        method: route.method,
        headers,
        body: formData ? formData : req ? JSON.stringify(req) : undefined,
      },
    ];

    // TODO check if we're running in Next.js and fail out.
    const response = await fetch(fetchArgs[0], fetchArgs[1]);

    try {
      respJson = await response.json();
    } catch (e) {
      // Silently fail the json parsing piece -- check this after the error code.
    }

    if (!response.ok) {
      throw (
        respJson.error ? new Error(respJson.error) : new Error(`Request failed with status ${response.status}`)
      );
    }

    if (respJson === null || respJson === undefined) {
      throw new Error('No response data');
    }

    const parsedData = route.responseSchema.safeParse(respJson);
    if (!parsedData.success){
      if (opts?.errorOnParseFailure){
        throw new Error(`Failed to parse response: ${parsedData.error}`);
      }
      else {
        console.warn(`[api-sdk]: Failed to parse response`, parsedData.error);
        return { success: false, data: respJson, error: parsedData.error, rawResponse: { response, request: req, fetchArgs, respJson } };
      }
    }
    else {
      return { success: true, data: parsedData.data, error: undefined, rawResponse: { response, request: req, fetchArgs, respJson } };
    }
  } catch (error: any) {
    if (error instanceof Error){
      return { success: false, data: undefined, error, rawResponse: { response, request: req, fetchArgs, respJson } }
    }
    else {
      error = new Error(`Request failed with status ${error.status}`);
      return { success: false, data: undefined, error, rawResponse: { response, request: req, fetchArgs, respJson }}
    }
  }
}

export type RawRespData  = {
  response?: Response;
  request?: Request;
  fetchArgs?: Parameters<typeof fetch>;
  respJson?: any;
}

export type RequestOf<T> = T extends ApiRoute<infer TReqZ, any>
  ? z.infer<TReqZ>
  : never;

export type ResponseOfZod<T extends ZodType<any>> = {
  success: true;
  data: z.infer<T>;
  error?: Error;
  rawResponse: RawRespData;
} | {
  success: false;
  data?: undefined;
  error: Error | any;
  rawResponse: RawRespData;
}

export type ResponseOf<T> = T extends ApiRoute<any, infer TRespZ>
  ? (
    { success: true, data: z.infer<TRespZ>; error?: Error; rawResponse: RawRespData } | 
    { success: false, data?: undefined; error: Error | any; rawResponse: RawRespData }
  )
  : never;

/**
 * Processes a streaming response that emits array items
 */
async function* genericCallArrayStream<
  TReqZ extends ZodType<any>,
  TRespZ extends ZodType<any>
>({
  route,
  req,
  opts,
  formData
}: {
  route: ApiRoute<TReqZ, TRespZ>,
  req?: z.infer<TReqZ>,
  opts?: ApiRouteCallOptions,
  formData?: FormData
}): AsyncGenerator<z.infer<TRespZ>, void, unknown> {
  // Validate request payload against schema
  if (req) {
    route.requestSchema.parse(req);
  }

  const { headers: additionalHeaders, baseUrl } = opts || {};
  const token = getAuthToken();
  const headers = createHeaders(token, additionalHeaders, formData);
  const url = baseUrl ? new URL(route.path, baseUrl).toString() : route.path;
  
  const response = await fetch(url, {
    method: route.method,
    headers,
    body: formData ? formData : req ? JSON.stringify(req) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText ?? `Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('The response body is empty.');
  }

  let accumulatedText = '';
  const decoder = new TextDecoder();
  const reader = response.body.getReader();

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      accumulatedText += decoder.decode(value, {stream: true});
      const events = accumulatedText.split('\n\n');
      
      // Process all complete events except the last one
      for (const event of events.slice(0, -1)) {
        const trimmedEvent = event.trim();
        if (trimmedEvent.startsWith('item: ')) {
          try {
            const jsonStr = trimmedEvent.slice(6); // Remove 'item: ' prefix
            const item = JSON.parse(jsonStr);
            const validatedItem = route.responseSchema.parse(item);
            yield validatedItem;
          } catch (e) {
            console.warn(`Error parsing item: ${e}`);
          }
        }
      }
      
      accumulatedText = events[events.length - 1];
    }

    // Process any remaining data
    if (accumulatedText.trim()) {
      const event = accumulatedText.trim();
      if (event.startsWith('item: ')) {
        try {
          const jsonStr = event.slice(6);
          const item = JSON.parse(jsonStr);
          const validatedItem = route.responseSchema.parse(item);
          yield validatedItem;
        } catch (e) {
          console.warn(`Error parsing item: ${e}`);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Helper functions extracted from genericCall
function getAuthToken(): string | undefined {
  if (typeof window === 'undefined' || !window.document) return undefined;

  const cookieToken = window.document.cookie
    .split('; ')
    .find(row => row.startsWith('supabase-auth-token'))
    ?.split('=')?.[1];

  if (!cookieToken) return undefined;

  // Parse token from cookie format: '["token",...]'
  return decodeURI(cookieToken).match(/"([^"]+)"/)?.[1];
}

function createHeaders(
  token: string | undefined,
  additionalHeaders?: Record<string, any>,
  formData?: FormData
): HeadersInit {
  return {
    ...(formData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: jwtBearerify(token) } : {}),
    ...additionalHeaders,
  };
}
