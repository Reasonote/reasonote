import {
  CoreMessage,
  generateObject,
  GenerateObjectResult,
  jsonSchema,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata,
} from 'ai';
import _ from 'lodash';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { trimAllLines } from '@lukebechtel/lab-ts-utils';
import { isZodLikeSchema } from '@reasonote/core';
import {
  GenObjectArgs,
  GenObjectResult,
} from '@reasonote/lib-ai-common';

import {
  consolidateMessages,
  resolveModelModels,
  toolCallDefaultMessages,
} from './genHelpers';
import { genText } from './genText';
import { convertToFinalSchema } from './thinkingSchema';
import { calculateCompletionTokenUsage } from './vendor/vercel/ai/token-usage';

////////////////////////////////////////////////////////////////////////////
// VENDORED CODE
////////////////////////////////////////////////////////////////////////////
export function prepareResponseHeaders(
    init: ResponseInit | undefined,
    { contentType }: { contentType: string },
  ) {
    const headers = new Headers(init?.headers ?? {});
  
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', contentType);
    }
  
    return headers;
  }

class DefaultGenerateObjectResult<T> implements GenerateObjectResult<T> {
    readonly object: GenerateObjectResult<T>['object'];
    readonly finishReason: GenerateObjectResult<T>['finishReason'];
    readonly usage: GenerateObjectResult<T>['usage'];
    readonly warnings: GenerateObjectResult<T>['warnings'];
    // readonly rawResponse: GenerateObjectResult<T>['rawResponse'];
    readonly logprobs: GenerateObjectResult<T>['logprobs'];
  
    constructor(options: {
      object: GenerateObjectResult<T>['object'];
      finishReason: GenerateObjectResult<T>['finishReason'];
      usage: GenerateObjectResult<T>['usage'];
      warnings: GenerateObjectResult<T>['warnings'];
      // rawResponse: GenerateObjectResult<T>['rawResponse'];
      logprobs: GenerateObjectResult<T>['logprobs'];
    }) {
      this.object = options.object;
      this.finishReason = options.finishReason;
      this.usage = options.usage;
      this.warnings = options.warnings;
      // this.rawResponse = options.rawResponse;
      this.logprobs = options.logprobs;
    }

    providerMetadata: any;

    // TODO: don't mock these
    request: LanguageModelRequestMetadata = {};
    response: LanguageModelResponseMetadata = {
      id: '',
      timestamp: new Date(),
      modelId: '',
    };
    experimental_providerMetadata: any;
  
    toJsonResponse(init?: ResponseInit): Response {
      return new Response(JSON.stringify(this.object), {
        status: init?.status ?? 200,
        headers: prepareResponseHeaders(init, {
          contentType: 'application/json; charset=utf-8',
        }),
      });
    }
  }

////////////////////////////////////////////////////////////////////////////
// END VENDORED CODE
////////////////////////////////////////////////////////////////////////////


async function genObjectSingle<T>(params: GenObjectArgs<T>): Promise<GenObjectResult<T>> {
    // console.log('genObjectSingle', JSON.stringify(params, null, 2));
    
    const messages = consolidateMessages({
      prompt: params.prompt,
      system: params.system,
      messages: params.messages as CoreMessage[],
      requiresUserMessage: params.model?.provider.startsWith('anthropic') ?? false,
      ctxMessages: params.ctxMessages,
    });

    // Check if thinking is enabled and modify the schema accordingly
    const isThinking = params.thinking !== undefined;
    const thinkingSchema = isThinking ? params.thinking?.schema : undefined;

    const finalSchema = jsonSchema(convertToFinalSchema(params.schema, thinkingSchema));

    // IF we received functionName or functionDescription, we use genText.
    // Otherwise, just use generateObject.
    if (params.functionName || params.functionDescription) { 
      const res = await genText({
          ...params,
          // We consolidate prompt and system into messages,
          // So we remove them from the params.
          prompt: undefined,
          system: undefined,
          messages,
          tools: {
              [params.functionName ?? 'writeOutput']: {
                  description: params.functionDescription ?? 'Output a response.',
                  parameters: finalSchema,
              }
          },
          toolChoice: 'required',
          experimental_telemetry: { isEnabled: true },
      });

      const firstChoice = res?.toolCalls?.[0]?.args;

      if (!firstChoice) {
          throw new Error("No valid response from AI");
      }

      // console.log('genObjectSingle result', JSON.stringify(firstChoice, null, 2));

      // Process the result to extract thinking if necessary
      let resultObject: any = firstChoice;
      let thinkingData: any = undefined;

      if (isThinking && resultObject && 'thinking' in resultObject && 'result' in resultObject) {
          thinkingData = resultObject.thinking;
          resultObject = resultObject.result;
      }

      const result = new DefaultGenerateObjectResult({
          object: resultObject,
          finishReason: res.finishReason,
          usage: calculateCompletionTokenUsage(res.usage),
          warnings: res.warnings,
          // rawResponse: res.response,
          logprobs: res.logprobs,
      }) as GenObjectResult<T>;

      if (isThinking && thinkingData) {
          (result as any).thinking = thinkingData;
      }

      return result;
  }
  else {
      if (!params.model && !params.models) {
          throw new Error("Must specify either 'model' or 'models'");
      }
  
      if (params.model && params.models) {
          throw new Error("Cannot specify both 'model' and 'models'");
      }

      const allModels = params.models ? params.models : [params.model!];
      
      const errors: any[] = [];
      
      for (let i = 0; i < allModels.length; i++) {
          const model = allModels[i];
          try {
            const res = await generateObject({
              ...params,
              // We consolidate prompt and system into messages,
              // So we remove them from the params.
              prompt: undefined,
              system: undefined,
              messages,
              // Have to set the model we determined.
              model,
              // Use the adjusted schema with thinking if necessary
              schema: finalSchema,
              experimental_telemetry: { 
                isEnabled: true,
              },
            } as any);

            // console.log('genObjectSingle result', JSON.stringify(res.object, null, 2));
            
            // Process the result to extract thinking if necessary
            let resultObject: any = res.object;
            let thinkingData: any = undefined;

            if (isThinking && resultObject && typeof resultObject === 'object' && 
                'thinking' in resultObject && 'result' in resultObject) {
                thinkingData = resultObject.thinking;
                resultObject = resultObject.result;
            }

            const result = {
                ...res,
                object: resultObject,
            } as GenObjectResult<T>;

            if (isThinking && thinkingData) {
                (result as any).thinking = thinkingData;
            }

            return result;
          } catch (error: any) {
              errors.push(error);
              console.error(`Model ${JSON.stringify(model)} failed:`, error);
              
              if (i === allModels.length - 1) {
                  console.error("All attempts failed");
                  throw new Error("All genObject attempts failed (failures: " + errors.map(e => `'${e.message}'`).join(", ") + ")");
              }
          }
      }
  
      throw new Error("Unreachable code -- all genText attempts failed");
  }
}

type CoreMessageWithFeedback = CoreMessage & {
  isFeedback?: boolean;
}

const FeedbackSchema = z.object({
    feedback: z.string().nullable().describe('The feedback to provide to the AI.'),
    feedbackNeeded: z.boolean().describe('Whether feedback is necessary.'),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

function coreMessageToXmlString(message: CoreMessage): string {
  const msgTag = `${message.role.toUpperCase()}-MSG`;
  return `
    <${msgTag}>
      ${_.isString(message.content) ? 
        `
        <TEXT>${message.content}</TEXT>
        `
        : message.content.map((content) => `
          ${content.type === 'tool-call' ? `
            <TOOL_CALL>
              <TOOL_NAME>${content.toolName}</TOOL_NAME>
              <ARGS>${JSON.stringify(content.args)}</ARGS>
            </TOOL_CALL>
          ` : content.type === 'text' ? `
            <TEXT>${content.text}</TEXT>
          ` : ''}
        `).join('')}
    </${msgTag}>
  `;
}

/**
 * Creates a new message history containing feedback for the AI.
 */
async function genFeedbackForGenObject<T>(params: GenObjectArgs<T>, feedbackHistory: CoreMessage[]): Promise<{newFeedbackHistory: CoreMessage[], feedbackObj: Feedback}> {
  const feedbackModels = resolveModelModels('feedbackModel', 'feedbackModels', params.feedbackModel, params.feedbackModels);

  const feedbackResult = await genObjectSingle({
      models: feedbackModels,
      system: params.feedbackPrompt ?? trimAllLines(`
      <YOUR_ROLE>
      You are a critical-thinker and feedback-provider, trying to help another AI improve its responses.

      You should provide clear, concise, and actionable feedback to help the AI improve its answers.


      IF THERE IS NO FEEDBACK NEEDED, JUST set 'feedbackNeeded' to false and leave 'feedback' empty or set it to null / undefined.

      <CRITICAL_NOTES>
        <TOOL_USE>
        THE AI IS FORCED TO USE A TOOL.
        YOUR FEEDBACK SHOULD NOT REGARD WHETHER THE AI SHOULD USE A TOOL OR NOT -- THEY ARE REQUIRED TO.
        </TOOL_USE>
      </CRITICAL_NOTES>

      
      </YOUR_ROLE>

      --------------------------------------------------------------------------------------


      <THE_AI_TASK>
        <THE_AI_PROMPT>
          ${params.system}
          --------
          ${params.prompt}
        </THE_AI_PROMPT>
        <THE_MESSAGE_HISTORY description="The message history the AI saw to produce this result.">
          ${feedbackHistory.map((message) => coreMessageToXmlString(message)).join('')}
        </THE_MESSAGE_HISTORY>
        <TOOL isRequired="true">
          <TOOL_NAME>${params.functionName ?? 'writeOutput'}</TOOL_NAME>
          <TOOL_DESCRIPTION>${params.functionDescription ?? 'Output a response.'}</TOOL_DESCRIPTION>
          <TOOL_PARAMETERS>${isZodLikeSchema(params.schema) ? zodToJsonSchema(params.schema as any) : JSON.stringify(params.schema, null, 2)}</TOOL_PARAMETERS>
        </TOOLS>
      </THE_AI_TASK>

      <FINAL_NOTES>
      REMEMBER: The AI *has* to use a tool!!, even if it doesn't seem to make sense.
      Therefore, you should NOT give feedback like: "The answer is fine but you should just write the answer rather than using a tool"
      </FINAL_NOTES>
      `),
      messages: feedbackHistory,
      functionName: 'giveFeedback',
      functionDescription: 'Provide feedback to the AI.',
      schema: FeedbackSchema,
      mode: 'json',
  });

  return {
    newFeedbackHistory: [
      ...feedbackHistory,
      ...toolCallDefaultMessages({
        args: feedbackResult.object,
        toolName: 'giveFeedback'
      })
    ],
    feedbackObj: feedbackResult.object
  } 
}

/**
 * Similar to Vercel AI SDK, but with some custom logic for the following:
 * (1) Has `fallbacks` which can be specified in the `rsn` object to try multiple models in order.
 * (2) Supports thinking functionality which allows the model to provide its thinking process in addition to the result.
 * 
 * @remarks
 * IMPORTANT: When using this function with structured outputs, certain schema constraints
 * will be removed and NOT enforced:
 * - default values (these would be ignored anyway)
 * - min/max constraints (minimum, maximum)
 * - array length constraints (minItems, maxItems)
 * - string length constraints (minLength, maxLength)
 * 
 * Additionally, all properties will be marked as required. If you need validation
 * with these constraints, you should validate the output after generation.
 *
 * @param params - The parameters for generating the object
 * @returns A promise that resolves to a GenObjectResult
 */
export async function genObject<T>(params: GenObjectArgs<T>): Promise<GenObjectResult<T>> {    
    // This runs the genObjectSingle function, but with the fallbacks logic, when applicable.

    if (params.maxFeedbackLoops && params.maxFeedbackLoops > 0) {
      // TODO: fix for uimessages
      var messages = (params.messages ?? []) as CoreMessage[];
      var result: GenObjectResult<T>;
      result = await genObjectSingle(params);
      
      for (let i = 0; i < params.maxFeedbackLoops; i++) {
        messages = [
          ...messages, 
          ...toolCallDefaultMessages({
            args: result.object,
            toolName: params.functionName ?? 'writeOutput',
          })
        ];

        // Run feedback loop.
        const feedbackRes = await genFeedbackForGenObject(params, messages);

        if (feedbackRes.feedbackObj.feedbackNeeded === false) {
          console.log(`Feedback loop ${i+1}/${params.maxFeedbackLoops} not needed.`);
          break
        }
        else {
          console.log(`Feedback loop ${i+1}/${params.maxFeedbackLoops} needed. Feedback: "${feedbackRes.feedbackObj.feedback}"`);
          messages = feedbackRes.newFeedbackHistory;
        }

        // Run genObjectSingle again, appending the feedback to the messages.
        result = await genObjectSingle({
          ...params,
          messages,
        });
      }

      return result;
    }
    else {
        return genObjectSingle(params);
    }
}