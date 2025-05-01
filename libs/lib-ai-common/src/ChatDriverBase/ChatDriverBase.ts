import Ajv from 'ajv';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { notEmpty } from '@lukebechtel/lab-ts-utils';
import {
  RESIChatMessageAssistantSchema,
  RESIChatMessageFunctionSchema,
  RESIChatMessageSystemSchema,
  RESIChatMessageUserSchema,
} from '@reasonote/lib-ai-common';

//////////////////////////////////////////////////////////////////////////
// REQUEST
export const RESIChatDriverBaseRequestSchema = z.object({
  messages: z
    .array(
      z.union([
        RESIChatMessageAssistantSchema,
        RESIChatMessageUserSchema,
        RESIChatMessageSystemSchema,
        RESIChatMessageFunctionSchema,
      ])
    )
    .describe("The history of messages in the chat."),
  functions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.union([
          z.object({
            type: z.literal("jsonschema"),
            jsonschema: z.object({
              type: z.literal("object"),
              required: z.array(z.string()),
              properties: z.any(),
            }),
          }),
          z.object({
            type: z.literal("zodschema"),
            zodschema: z.any(),
          }),
        ]),
      })
    )
    .optional()
    .describe("The tools that the assistant can use to respond to the user."),
  numChoices: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("The number of choices to generate."),
  functionCall: z
    .union([
      z.literal("none").describe("Do not call any functions."),
      z
        .literal("auto")
        .describe(
          "Assistant will call functions if they think it is appropriate."
        ),
      z.string().describe("The name of the function to call."),
    ])
    .optional(),
  stream: z
    .boolean()
    .optional()
    .describe("Whether or not to stream the response."),
});
export type RESIChatDriverBaseRequest = z.infer<
  typeof RESIChatDriverBaseRequestSchema
>;

//////////////////////////////////////////////////////////////////////////
// RESPONSE

export const BaseResiChatDriverMessageResponseSchema = z.object({
  role: z.enum(["user", "system", "assistant", "function"]),
});

export const AssistantContentChatDriverMessageResponseSchema =
  BaseResiChatDriverMessageResponseSchema.extend({
    role: z.literal("assistant"),
    content: z
      .string()
      .describe(
        "The content of the message. If a function call was made, this will always be null.."
      ),
    functionCall: z.null(),
  });

export const AssistantFunctionCallChatDriverMessageResponseSchema =
  BaseResiChatDriverMessageResponseSchema.extend({
    role: z.literal("assistant"),
    content: z.null().optional(),
    functionCall: z
      .object({
        name: z.string(),
        arguments: z
          .object({
            raw: z
              .string()
              .optional()
              .describe("The raw arguments to the function call."),
            parseErrors: z
              .array(z.string())
              .optional()
              .describe(
                "Any errors that occurred while parsing the raw arguments."
              ),
            parsed: z
              .union([z.any(), z.array(z.any())])
              .optional()
              .describe(
                "The parsed arguments to the function call. This is the result of parsing the raw arguments."
              ),
          })
          .optional(),
      })
      .optional()
      .describe("A function call that the AI Responseed be executed."),
  });

export const AssistantResiChatDriverMessageResponseSchema = z.union([
  AssistantContentChatDriverMessageResponseSchema,
  AssistantFunctionCallChatDriverMessageResponseSchema,
]);
export const ResiChatDriverMessageResponseSchema =
  AssistantResiChatDriverMessageResponseSchema;
export type ResiChatDriverMessageResponse = z.infer<
  typeof ResiChatDriverMessageResponseSchema
>;

export const ResiChatDriverChoiceResponseSchema = z.object({
  index: z.number().optional(),
  message: ResiChatDriverMessageResponseSchema.optional(),
  finish_reason: z.string().nullable().optional(),
});
export type ResiChatDriverChoiceResponse = z.infer<
  typeof ResiChatDriverChoiceResponseSchema
>;

export const ResiChatDriverResponseSchema = z.object({
  choices: z.array(ResiChatDriverChoiceResponseSchema),
  driverResponse: z.any().optional(),
});

const ResiChatDriverPartialResponseSchema = z.object({
  // TODO: this represents what we'll allow as our partial responses.
  // - Type 1: Raw -- nothing parseable yet, just a string.
  // - Type 2: ParsedPartial -- a parseable initial response, that could be mutated as time goes on.
  // ULTIMATELY: ParsedPartial should be the same as the full version, but for each choice instead of `message` it should read `delta`.
  // Simply mirror the OpenAI api here.
});

export type ResiChatDriverResponse = z.infer<
  typeof ResiChatDriverResponseSchema
>;

interface ResiChatDriverSystemRequest {
  callbacks: {
    partialResultReceived: (partialResult: string) => void;
  };
}

///////////////////////////////////////////////////////////////////////////
// CLASS
export abstract class ResiChatDriver<
  TReq extends RESIChatDriverBaseRequest,
  TRes extends ResiChatDriverResponse
> {
  abstract _run(req: TReq, sysReq?: ResiChatDriverSystemRequest): Promise<TRes>;

  abstract canHandleRun(req: TReq): boolean;

  async run(req: TReq, sysReq?: ResiChatDriverSystemRequest): Promise<TRes> {
    const innerResult = await this._run(req, sysReq);

    const mappedChoices = (
      await Promise.all(
        innerResult.choices.map(async (c, idx) => {
          try {
            const functionCall = c.message?.functionCall;
            if (functionCall) {
              if (!req.functions || req.functions.length === 0) {
                throw new Error(
                  "Agent requested function call, but no functions were provided."
                );
              }

              if (!functionCall.name) {
                throw new Error("Function call did not provide a name.");
              }

              const matchingFunction = req.functions.find(
                (f) => f.name === functionCall.name
              );

              if (!matchingFunction) {
                throw new Error(
                  `Function ${functionCall.name} was not found in provided functions.`
                );
              }

              const args = functionCall.arguments;

              if (!args) {
                throw new Error(
                  `Function call ${functionCall.name} did not provide arguments.`
                );
              }

              if (!args.parsed) {
                throw new Error(
                  `Function call ${functionCall.name} did not provide parsed arguments. (${JSON.stringify({raw: args.raw, parseErrors: args.parseErrors})})`
                );
              }

              // Then, validate it against the schema
              const ajv = new Ajv();

              // console.log(matchingFunction.parameters);

              let jsonschema =
                matchingFunction.parameters.type === "jsonschema"
                  ? matchingFunction.parameters.jsonschema
                  : zodToJsonSchema(matchingFunction.parameters.zodschema);
              const validate = ajv.compile(jsonschema);
              const valid = validate(args.parsed);

              if (!valid) {
                throw new Error(
                  `Function call did not match schema: ${JSON.stringify(
                    validate.errors
                  )}, (args: ${JSON.stringify(args.parsed)}))`
                );
              }

              return c;
            } else {
              return c;
            }
          } catch (err: any) {
            console.log("ERR", err);
            return null;
          }
        })
      )
    ).filter(notEmpty);

    //@ts-ignore
    return {
      choices: mappedChoices,
      driverResponse: innerResult.driverResponse,
    };
  }
}
