import _ from 'lodash';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import {
  jwtBearerify,
  notEmpty,
} from '@lukebechtel/lab-ts-utils';
import {
  ChatDriverOpenaiRequest,
  ResiChatDriver,
  ResiChatDriverChoiceResponse,
  ResiChatDriverResponse,
} from '@reasonote/lib-ai-common';
import { JSONSafeParse } from '@reasonote/lib-utils';

export class ChatDriverOpenaiJsonParseError extends Error {
  constructor(readonly rawResponse: Response) {
    super("Could not parse JSON response from OpenAI");
  }
}

export class ChatDriverOpenaiBadStatusError extends Error {
  constructor(readonly rawResponse: Response, readonly responseJson?: any) {
    super(
      responseJson
        ? `OpenAI returned an error status code: ${
            rawResponse.status
          }, with error: ${JSON.stringify(responseJson)}`
        : `OpenAI returned an error status code: ${rawResponse.status}`
    );
  }
}

export class ChatDriverOpenai extends ResiChatDriver<
  ChatDriverOpenaiRequest,
  ResiChatDriverResponse
> {

  canHandleRun(req: ChatDriverOpenaiRequest): boolean {
    return req.driverConfig.type === "openai";
  }

  async _run(req: ChatDriverOpenaiRequest): Promise<ResiChatDriverResponse> {
    console.log("REQ", JSON.stringify({req}, null, 2));
    
    const functions = req.functions
      ? req.functions.map((f) => ({
          name: f.name,
          description: f.description,
          parameters:
            f.parameters.type === "zodschema"
              ? zodToJsonSchema(f.parameters.zodschema)
              : {
                  type: f.parameters.jsonschema.type,
                  required: f.parameters.jsonschema.required,
                  properties: f.parameters.jsonschema.properties,
                },
        }))
      : undefined;

    /////////////////////////////////////////////////////////
    // Run a chat completion request.
    const chatCompletionOptions = {
      messages: req.messages.map((m) => ({
        name: m.name,
        role: m.role,
        content: m.content ?? "",
        function_call:
          m.role === "assistant" && m.function_call
            ? {
                name: m.function_call.name,
                arguments: m.function_call.arguments.raw ?? m.function_call.arguments,
              }
            : undefined,
      })),
      function_call: req.functionCall
        ? {
            name: req.functionCall,
          }
        : undefined,
      functions: functions && functions.length > 0 ? functions : undefined,
      ...{
        ...req.driverConfig.config,
        model: req.driverConfig.config.model,
        apiKey: undefined,
        stream: false,
      },
    };

    // For debugging, useful to see the Raw request sent to OpenAI.
    // console.log(JSON.stringify({ chatCompletionOptions }, null, 2))
    const baseURL = "https://api.openai.com/v1/chat/completions";
    const apiKey = req.driverConfig.config.apiKey;

    const fetchArgs = [
      baseURL,
      {
        headers: {
          Authorization: jwtBearerify(apiKey),
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(chatCompletionOptions),
      },
    ] as const;


    var response: Response | null = null;

    try {
      response = await fetch(fetchArgs[0], fetchArgs[1]);
    }
    catch(err: any){
      console.log("ERROR")
      console.log(err)
      throw err;
    }

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Get JSON response.
    let rspJson: any;
    try {
      rspJson = await response.json();
    } catch (err: any) {
      throw new ChatDriverOpenaiJsonParseError(response);
    }

    // Check if openai returned an error.
    if (!response.ok) {
      throw new ChatDriverOpenaiBadStatusError(response, rspJson);
    }

    // Now try to parse it into the known correct format.
    let parsed = CreateChatCompletionResponse.safeParse(rspJson);

    if (!parsed.success) {
      // throw new Error(`Could not parse response from OpenAI (${parsed.error})`);
      console.warn(
        `Could not parse response from OpenAI (${parsed.error}) -- not failing out, but this likely indicates a critical error.`
      );
    }

    // This is checked above, but we're going to be risky and try to do this without failing.
    let completion = rspJson as CreateChatCompletionResponse;


    const choices: ResiChatDriverChoiceResponse[] = completion.choices
      .map((c) => {
        if (c.message && c.message.role === "assistant") {
          if (c.message?.function_call) {
            if (c.message.function_call.name) {
              const parsedRes = JSONSafeParse(c.message.function_call.arguments);

              return {
                index: c.index,
                message: {
                  role: "assistant" as const,
                  functionCall: {
                    name: c.message.function_call.name,
                    arguments: {
                      parsed: parsedRes.data ?? undefined,
                      parseErrors: [parsedRes.error?.message ?? ""],
                      raw: c.message.function_call.arguments,
                    },
                  },
                  content: null,
                },
                finish_reason: c.finish_reason,
              };
            } else {
              return null;
            }
          } else {
            if (c.message.content) {
              return {
                index: c.index,
                message: {
                  role: "assistant" as const,
                  functionCall: null,
                  content: c.message.content,
                },
                finish_reason: c.finish_reason,
              };
            } else {
              // This should never happen...
              return null;
            }
          }
        } else {
          // This should never happen...
          return null;
        }
      })
      .filter(notEmpty);

    const ret: ResiChatDriverResponse = {
      choices,
      driverResponse: {
        id: completion.id,
        model: completion.model,
        usage: completion.usage,
        created: completion.created,
        raw: {
          response,
          request: req,
          zodSafeParseResult: parsed,
        },
      },
    };

    return ret;
  }
}

// ChatCompletionRequestMessageFunctionCall
export const ChatCompletionRequestMessageFunctionCall = z
  .object({
    name: z.string().optional(),
    arguments: z.string().optional(),
  })
  .passthrough();

// ChatCompletionResponseMessageRoleEnum
export const ChatCompletionResponseMessageRoleEnum = z.union([
  z.literal("system"),
  z.literal("user"),
  z.literal("assistant"),
]);

// ChatCompletionResponseMessage
export const ChatCompletionResponseMessage = z
  .object({
    role: ChatCompletionResponseMessageRoleEnum,
    content: z.string().optional().nullable(),
    function_call: ChatCompletionRequestMessageFunctionCall.optional(),
  })
  .passthrough();

// CreateChatCompletionResponseChoicesInner
export const CreateChatCompletionResponseChoicesInner = z
  .object({
    index: z.number().optional(),
    message: ChatCompletionResponseMessage.optional(),
    finish_reason: z.string().optional(),
  })
  .passthrough();
export type CreateChatCompletionResponseChoicesInner = z.infer<
  typeof CreateChatCompletionResponseChoicesInner
>;

// CreateCompletionResponseUsage
export const CreateCompletionResponseUsage = z
  .object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  })
  .passthrough();

// CreateChatCompletionResponse
export const CreateChatCompletionResponse = z
  .object({
    id: z.string(),
    object: z.string(),
    created: z.number(),
    model: z.string(),
    choices: z.array(CreateChatCompletionResponseChoicesInner),
    usage: CreateCompletionResponseUsage.optional(),
  })
  .passthrough();
export type CreateChatCompletionResponse = z.infer<
  typeof CreateChatCompletionResponse
>;
