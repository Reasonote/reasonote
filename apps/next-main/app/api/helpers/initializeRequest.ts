import {generateText} from "ai";
import {NextRequest} from "next/server";
import {
  z,
  ZodError,
} from "zod";

import {
  getActivityTypeDefinition,
} from "@/components/activity/activity-type-definition/getActivityTypeDefinition";
import {getPosthogBackend} from "@/utils/posthog/getPosthogBackend";
import {anthropic} from "@ai-sdk/anthropic";
import {openai} from "@ai-sdk/openai";
import {jwtBearerify} from "@lukebechtel/lab-ts-utils";
import {
  AI,
  AIContext,
  ChatDriverOpenai,
  RNCtxInjector,
} from "@reasonote/lib-ai";
import {ChatDriverRequest} from "@reasonote/lib-ai-common";
import {ApiRoute} from "@reasonote/lib-api-sdk";
import {
  createReasonoteApolloClient,
  ReasonoteApolloClient,
} from "@reasonote/lib-sdk-apollo-client";
import {
  createSimpleLogger,
  jsonSchemaToZod,
  SimpleLogger,
} from "@reasonote/lib-utils";
import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  RsnClient,
  RsnClientCtx,
} from "../../../sdk-new";
import {oneShotAIServer} from "../_common/oneShotAIServer";
import {getApiEnv} from "./apiEnv";
import {
  ApiRouteContextBasic,
  ApiRouteContextFull,
  ApiRouteContextWithInternals,
} from "./ApiRouteContext";
import {
  ApiRouteRequestZodParseError,
  BasicApiError,
} from "./errors";

function randomString(
  length: number,
  chars: {
    /**
     * Choose what characters to include in the generated string.
     * lowercase: abcdefghijklmnopqrstuvwxyz
     * uppercase: ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * numbers: 0123456789
     * symbols: ~`!@#$%^&*()_+-={}[]:";'<>,.?/
     *
     *
     * Defaults to lowercase, uppercase, numbers, and symbols.
     */
    include: ("lowercase" | "uppercase" | "numbers" | "symbols")[];

    /**
     * Characters to ignore. This is applied after all other rules.
     */
    ignoreChars?: string[];
  }
) {
  var mask = "";

  // Includes
  if (chars.include.find((i) => i === "lowercase"))
    mask += "abcdefghijklmnopqrstuvwxyz";
  if (chars.include.find((i) => i === "uppercase"))
    mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (chars.include.find((i) => i === "numbers")) mask += "0123456789";
  if (chars.include.find((i) => i === "symbols"))
    mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";

  // Ignores
  if (chars.ignoreChars) {
    for (var i = 0; i < chars.ignoreChars.length; ++i) {
      mask = mask.replace(chars.ignoreChars[i], "");
    }
  }

  var result = "";
  for (var i = length; i > 0; --i)
    result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}

export async function initializeRequest<
  TApiRoute extends ApiRoute<
    z.ZodType<any, z.ZodTypeDef, any>,
    z.ZodType<any, z.ZodTypeDef, any>
  >
>({
  req,
  route,
}: {
  req: NextRequest;
  route: TApiRoute;
}): Promise<ApiRouteContextBasic<TApiRoute>> {
  ////////////////////////////////////////////////////////////////////////
  // GET TIMING
  const requestStartTime = new Date();
  const isoTime = requestStartTime.toISOString();
  const shortTime = isoTime.split("T")[1].split(".")[0];
  const USE_SHORT = true;

  const rsnReqId = USE_SHORT ? `RSNREQ-${shortTime}` : `RSNREQ-${isoTime}-${randomString(8, {
    include: ["lowercase", "uppercase", "numbers"],
  })}`;

  ////////////////////////////////////////////////////////////////////////
  // CREATE LOGGER
  const logger_ = createSimpleLogger(`${rsnReqId} | ${route.path}`, {
    prefixAllLines: true,
  });

  // TODO: move filteredRoutes to environment config.
  const filteredRoutes: string[] = [
    '/api/internal/revectorize_cron',
    '/api/internal/vectorize_chunks',
    '/api/internal/snip_extract_cron',
    '/api/internal/snip_extract_text_cron'
  ]

  const logger: SimpleLogger = {
    log: function (...args: any[]): void {
      if (filteredRoutes.includes(route.path)) {
        return;
      }
      logger_.log(...args);
    },
    debug: function (...args: any[]): void {
      if (filteredRoutes.includes(route.path)) {
        return;
      }
      logger_.debug(...args);
    },
    warn: function (...args: any[]): void {
      if (filteredRoutes.includes(route.path)) {
        return;
      }
      logger_.warn(...args);
    },
    error: function (...args: any[]): void {
      if (filteredRoutes.includes(route.path)) {
        return;
      }
      logger_.error(...args);
    },
    info: function (...args: any[]): void {
      if (filteredRoutes.includes(route.path)) {
        return;
      }
      logger_.info(...args);
    }
  }

  if (req.nextUrl.pathname !== route.path) {
    throw new BasicApiError(
      `ApiRoute path "${route.path}" does not match Request Route "${req.nextUrl.pathname}"`,
      500
    );
  }

  return {
    req,
    route,
    logger,
    rsnReqId,
    pathHelpers: {
      baseUrl: `${req.nextUrl.protocol}//${req.nextUrl.host}`,
    },
    apiEnv: getApiEnv(),
    requestStartTime,
  };
}

export async function createInternals<
  TApiRoute extends ApiRoute<
    z.ZodType<any, z.ZodTypeDef, any>,
    z.ZodType<any, z.ZodTypeDef, any>
  >
>({
  ctx,
}: {
  ctx: ApiRouteContextBasic<TApiRoute>;
}): Promise<ApiRouteContextWithInternals<TApiRoute>> {
  const { req } = ctx;
 

  let SUPERUSER_supabase: SupabaseClient | undefined;
  try {
    SUPERUSER_supabase = createClient(
      ctx.apiEnv.NEXT_PUBLIC_SUPABASE_URL,
      ctx.apiEnv.SUPABASE_SERVICE_KEY
    );
  } catch (err: any) {
    throw new BasicApiError(`Failed to initialize SUPERUSER_supabase.`, 500, {
      err,
    });
  }

  return {
    ...ctx,
    SUPERUSER_supabase,
  };
}

export async function parseRequest<
  TApiRoute extends ApiRoute<
    z.ZodType<any, z.ZodTypeDef, any>,
    z.ZodType<any, z.ZodTypeDef, any>
  >
>({
  ctx,
}: {
  ctx: ApiRouteContextWithInternals<TApiRoute>;
}): Promise<ApiRouteContextFull<TApiRoute>> {
  ////////////////////////////////////////////////////////////////////////
  // Expect JSON request, or multipart/form-data request.
  let _jsonBody: any;
  let formData: FormData | undefined;
  const contentType = ctx.req.headers.get('content-type');
  if (contentType && contentType.includes('multipart/form-data')) {
    formData = await ctx.req.formData();
  } else {
    _jsonBody = await ctx.req.json();
  }

  // print all headers
  // ctx.req.headers.forEach((value, key) => {
  //     ctx.logger.debug(`Header: ${key}: ${value}`);
  // })

  // If we have authorization, use it.
  // TODO: should we really default to anon here?
  const headerAuthToken = ctx.req.headers.get("authorization") ?? ctx.req.headers.get("Authorization");
  const authToken = headerAuthToken ?? ctx.apiEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const tokenNoBearer = authToken.replace("Bearer", "").trim();

  ////////////////////////////////////////////////////////////////////////
  // Create supabase with this client's token, if provided.
  let supabase: SupabaseClient | undefined;
  try {
    supabase = createClient(
      ctx.apiEnv.NEXT_PUBLIC_SUPABASE_URL,
      ctx.apiEnv.REASONOTE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: jwtBearerify(tokenNoBearer),
          },
        },
      }
    );
  } catch (err: any) {
    throw new BasicApiError(`Failed to initialize SupabaseClient.`, 500, {
      err,
    });
  }

  const supabaseUserRet = await supabase.auth.getUser();
  const supabaseUser = supabaseUserRet.data.user;
  const rsnUserId = supabaseUser ? `rsnusr_${supabaseUser.id}` : undefined;

  let ac: ReasonoteApolloClient | undefined;
  try {
    ac = createReasonoteApolloClient({
      uri: `${ctx.apiEnv.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
      async getApiKey() {
        return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      },
      async getToken() {
        // TODO: This should be the user's token, if they are logged in.
        return jwtBearerify(tokenNoBearer);
      },
    });

  } catch (err: any) {
    throw new BasicApiError(`Failed to initialize ReasonoteApolloClient.`, 500, {
      err,
    });
  }

  ////////////////////////////////////////////////////////////////////////
  // Log User information.
  if (supabaseUser && rsnUserId) {
    ctx.logger.debug(
      `USER: ${JSON.stringify({
        role: supabaseUser.role,
        rsnUserId,
        email: supabaseUser.email,
      })}`
    );
  } else {
    ctx.logger.debug(
      `USER: ${JSON.stringify({
        role: "anon",
        rsnUserId: undefined,
        email: undefined,
      })}`
    );
  }

  ////////////////////////////////////////////////////////////////////////
  // Parse request and return.
  const aiDriver = {
    oneShotAI: oneShotAIServer,
    chat: {
      complete: async (req: ChatDriverRequest) => {
        const driverConfig = req.driverConfig ?? {
          type: "openai",
          config: {
            model: "gpt-4o-mini",
          },
        };

        const driver = new ChatDriverOpenai();

        const openaiKey = process.env.OPENAI_API_KEY;

        if (!openaiKey) {
            throw new Error("OPENAI_API_KEY not set");
        }

        if (driverConfig.type === 'anthropic') {
          // TODO: all system messages should be filtered, & concatenated into a single system messages,
          // because anthropic doesn't support multiple system messages.
          const systemMessages = req.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
          const nonSystemMessages = req.messages.filter(m => m.role !== 'system');

          // TODO: add anthropic chat driver if the model is claude.
          const { text, toolCalls } = await generateText({
            model: anthropic(driverConfig.config.model),
            tools: {
              // Convert function calls to tool calls
              ...(req.functions?.reduce((acc, f) => {
                acc[f.name] = {
                  description: f.description,
                  parameters: f.parameters.type === 'jsonschema' ? jsonSchemaToZod(f.parameters.jsonschema) : f.parameters.zodschema,
                };
                return acc;
              }, {}) ?? {}),
            },
            system: systemMessages,
            messages: nonSystemMessages.map((m) => ({
              name: m.name,
              role: (m.role === 'function' ? 'tool' : m.role) as any,
              content: m.content ?? '',
              toolCalls: m.role === 'assistant' ? m.function_call : undefined,
            })),
          });

          return {
            choices: [{
              message: {
                role: 'assistant' as const,
                content: text,
                // TODO: multiples
                functionCall: toolCalls?.[0] ?? null,
              },
            }],
          };
        }



        if (driverConfig.type !== "openai") {
          throw new Error("Unsupported driver type");
        } 

        return await driver.run({
          ...req,
          driverConfig: {
            ...driverConfig,
            config: {
              ...driverConfig.config,
              apiKey: openaiKey,
            },
          }
        });
      }
    }
  }

  const transformersPkg = await import('@xenova/transformers');

  const ai = new AI(new AIContext({
    sb: supabase,
    ac,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    aiDriver: aiDriver as any,
    defaultGenObjectModels: [
      'openai:gpt-4o-mini',
      // groq('llama3-groq-70b-8192-tool-use-preview'),
    ],
    defaultGenTextModels: [
      'openai:gpt-4o-mini',
      // groq('llama3-groq-70b-8192-tool-use-preview'),
    ],
    ctxInjectors: [
      ...RNCtxInjector.getNewImplementations()
    ],
    modelProps: { 
      'openai:gpt-4o-mini': {
        quality: 88,
        speed: 103,
        contextLength: 128_000,
        toolOptimized: true,
        altTags: ['fastest']
      },
      'openai:gpt-4o': {
        quality: 99,
        speed: 82,
        contextLength: 128_000,
        toolOptimized: true,
        altTags: []
      },
      'openai:gpt-4o-2024-08-06': {
        quality: 100,
        speed: 82,
        contextLength: 128_000,
        toolOptimized: true,
        altTags: ['best']
      },
      'anthropic:claude-3-5-sonnet-20240620': {
        quality: 99,
        speed: 79,
        contextLength: 200_000,
        toolOptimized: true,
        altTags: ['best']
      },
      'anthropic:claude-3-haiku-20240307': {
        quality: 74,
        speed: 128,
        contextLength: 200_000,
        toolOptimized: true,
        altTags: ['fastest']
      }
    },
    aiProviders: {
      openai,
      // groq,

      //@ts-ignore
      anthropic
    },
    transformersPkg,
    logger: ctx.logger,
    getActivityTypeDefinition: getActivityTypeDefinition,
  }));

  const rsn = new RsnClient({
    ctx: new RsnClientCtx({
      ac,
      sb: supabase,
      posthog: getPosthogBackend()
    })
  })

  try {
    const isFormData = ctx.req.headers.get('content-type')?.includes('multipart/form-data');

    // If the request is a form data request, then we don't want to parse the request body.
    // We'll just return the form data.
    const parsedReq = isFormData ? undefined : ctx.route.requestSchema.parse(_jsonBody);

    return {
      ...ctx,
      ac,
      ai,
      rsn,
      parsedReq: parsedReq,
      formData,
      supabase,
      userAuthType: supabaseUser
        ? supabaseUser.role === "service"
          ? "service"
          : "authenticated"
        : "anon",
      user:
        supabaseUser && rsnUserId
          ? {
              rsnUserId,
              supabaseUser: {
                ...supabaseUser,
              },
            }
          : undefined,
    };
  } catch (err: any) {
    console.log('ERROR', err);
    if (err instanceof ZodError) {
      throw new ApiRouteRequestZodParseError(ctx.route, err);
    } else {
      throw new BasicApiError(
        `Failed to parse request body., ${JSON.stringify(err)}`,
        400,
        {
          err,
        }
      );
    }
  }
}
