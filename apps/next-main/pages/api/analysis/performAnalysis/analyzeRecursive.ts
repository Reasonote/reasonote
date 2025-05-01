import {type TiktokenModel} from "js-tiktoken/lite";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {BaseChatMessage} from "langchain/schema";

import {trimLines} from "@lukebechtel/lab-ts-utils";

import {
  AnalysisDocument,
  Analyzer,
  AnalyzerResultAnalysis,
} from "../_route";

export const getModelNameForTiktoken = (modelName: string): TiktokenModel => {
  if (modelName.startsWith("gpt-3.5-turbo-")) {
    return "gpt-3.5-turbo";
  }

  if (modelName.startsWith("gpt-4-32k-")) {
    return "gpt-4-32k";
  }

  if (modelName.startsWith("gpt-4-")) {
    return "gpt-4";
  }

  return modelName as TiktokenModel;
};

export const getModelContextSize = (modelName: string): number => {
  switch (getModelNameForTiktoken(modelName)) {
    case "gpt-3.5-turbo":
      return 4096;
    case "gpt-4-32k":
      return 32768;
    case "gpt-4":
      return 8192;
    case "text-davinci-003":
      return 4097;
    case "text-curie-001":
      return 2048;
    case "text-babbage-001":
      return 2048;
    case "text-ada-001":
      return 2048;
    case "code-davinci-002":
      return 8000;
    case "code-cushman-001":
      return 2048;
    default:
      return 4097;
  }
};



function YourJobPrompt({analysisToPerform, existingAnalysis}: {analysisToPerform: string, existingAnalysis?: string}) {
  return trimLines(`
        # Your Job
        Your job is to analyze document(s) and produce a refined analysis.

        You will be given a set of documents to analyze.
        Your response should ONLY include your analysis / summary of these documents.

        ## Analysis to Perform
        '''
        ${analysisToPerform}
        '''

        ${
          existingAnalysis
            ? trimLines(`
            ## Existing Analysis
            You have already performed a partial analysis of previous documents.
            Your existing analysis is:
            '''
            ${existingAnalysis}
            '''
            `)
            : ""
        }

        # Final Notes

        - IF THE ANALYSIS DOES NOT NEED TO CHANGE, Simply return: "<|NO-CHANGE-NEEDED|>"
    `);
}

// function getTaskPrompt(isRefineStep: boolean) {
//     return trimLines(`
//         # Basic Task Outline
//         Your job is to produce a final analysis, focused around the prompt

//         ${isRefineStep ?
//             trimLines(`
//             We have provided an existing analysis up to a certain point.
//             You have the opportunity to refine the existing summary
//             (only if needed) with some more context below.
//             `)
//             :
//             ""
//         }

//         # Specific Analysis Prompt
//         ${analyzer?.prompt}

//         ${isRefineStep ?
//             trimLines(`
//             # Existing Analysis
//             ------------
//             "{existing_answer}"
//             ------------
//             `)
//             :
//             ""
//         }

//         # New Document(s)
//         ------------
//         "{text}"
//         ------------

//         # Final instructions

//         ${isRefineStep ?
//             trimLines(`
//                 Given the new document(s), refine the original analysis.

//                 If the new documents do NOT affect the analysis, return the original summary VERBATIM, without commentary.
//                 Your response should ONLY include your analysis of these documents, as it pertains to the Specific Analysis Prompt.
//                 `)
//             :
//             trimLines(`
//                 Given the document, produce a summary as it pertains to the Specific Analysis Prompt.
//                 If there is no relevant information, simply output an empty message.
//                 `)
//         }

//         ${
//         //     - DO NOT:
//         //     - DO NOT refer to the existing analysis. ALL you are doing is refining the existing analysis.
//         //     - DO NOT say things like "The New Document(s) do not affect the analysis..."
//         //     - DO NOT say things like "After analyzing the new document..."
//         //     - DO NOT refer to either the existing document, or the new document.... ONLY produce a refinement, or do nothing.
//         //         - BAD: "In the new document..."
//         //         - BAD: "The new document...."
//         // - DO:
//         //     - DO Either:
//         //         Option A. UPDATE the existing analysis
//         //         Option B. IGNORE and return the original analysis, VERBATIM.
//         ""
//         }

//         # Example
//         ## EXAMPLE INPUTS
//         ### Specific Analysis Prompt
//         "Write a summary of the company's performance, and what is expected in the future, including important metrics"

//         ### EXAMPLE Existing Analysis
//         ------------
//         "The company is doing well, and is expected to continue to do well in the future."
//         ------------

//         ### EXAMPLE New Document(s)
//         ------------
//         "The company had revenue of $100M in 2020, and is expected to have revenue of $200M in 2021."
//         ------------

//         ## EXAMPLE OUTPUT
//         ------------
//         "The company is doing well, and is expected to continue to do well in the future. The company had revenue of $100M in 2020, and is expected to have revenue of $200M in 2021."
//         ------------

//         ${failedAttempts.length > 0 ?
//             `
//             # Previous Attempts
//             You have failed this task ${tries} times before.
//             You have ${maxTries - tries} tries remaining.
//             Your previous attempts:
//             ${failedAttempts.map((f, idx) => `
//                 ## FAILED RESPONSE ${idx}
//                 ### Your Response
//                 ${f.message}
//                 ### Error
//                 ${f.error}
//             `)}
//             `
//             :
//             ``}
//     `)
// }



/**
 * Get the number of tokens used by the context of the model.
 * @param modelName The name of the model to use.
 * @param messages The messages to use to calculate the number of tokens.
 * @returns {
 * // The total number of tokens used by the context.
 * totalTokensUsed: number,
 * // The total number of tokens remaining in the context.
 * totalTokensRemaining: number,
 * // The number of tokens used by each message.
 * tokensPerMessage: number[],
 * }
 */
async function evaluateTokensRemaining(
  modelName: string,
  messages: BaseChatMessage[]
): Promise<{
  totalTokensUsed: number;
  totalTokensRemaining: number;
  tokensPerMessage: number[];
}> {
  const dummyOpenAI = new ChatOpenAI();
  dummyOpenAI.modelName = modelName;

  const analysis = await dummyOpenAI.getNumTokensFromMessages(messages);

  const totalTokensUsed = analysis.totalCount;
  const totalTokensRemaining = getModelContextSize(modelName) - totalTokensUsed;

  return {
    totalTokensUsed,
    totalTokensRemaining,
    tokensPerMessage: analysis.countPerMessage,
  };
}



/**
 *
 * @param CTX
 */
export async function analyzeRecursive(
    documents: AnalysisDocument[],
    analyzer: Analyzer,
    strategy: "refine" | "mapReduce" = "mapReduce"
  ): Promise<AnalyzerResultAnalysis> {

    throw new Error("Not implemented");
    // if (analyzer.type !== "simple-prompt") {
    //   const result = await analyzeRecursiveSchemaOutput(
    //     documents,
    //     analyzer,
    //     strategy
    //   );
  
    //   if (!result) {
    //     throw new Error("Could not get a good result from OpenAI");
    //   }
  
    //   return {
    //     type: "schema-output",
    //     resultObject: result,
    //   };
    // }
  
    // // TODO: do a clever token based splitting strategy.
    // // 1. Get a chunk that is correctly sized to maximize the context window.
    // // based on the model types available.
    // // const systemMessage = {
    // //     role: "system" as const,
    // //     content: trimLines(`
    // //         ${YourJobPrompt(analyzer.prompt)}
    // //     `)
    // // };
  
    // // const { totalTokensRemaining } = await evaluateTokensRemaining(lcOpenai.modelName, [new SystemChatMessage(systemMessage.content)]);
  
    // // const remainingContextSize = getModelContextSize(lcOpenai.modelName) - (await lcOpenai.getNumTokensFromMessages([new SystemChatMessage(systemMessage.content)])).totalCount;
  
    // // const maxTokensLeft = await calculateMaxTokens({
    // //     prompt: initialSystemPrompt,
    // //     modelName: 'gpt-3.5-turbo',
    // // })
  
    // // const { totalCount: systemTokenCount } = await lcOpenai.getNumTokensFromMessages([
    // //     new SystemChatMessage(systemMessage.content),
    // // ])
  
    // // .....
  
    // const mapModel = "gpt-4-0125-preview";
    // const refineModel = "gpt-4-0125-preview";
  
    // if (strategy === "mapReduce") {
    //   // TODO: make chunks that are appropriately sized given the system prompt.
    //   const docChunks = documents.map((doc) => doc);
  
    //   // 1. First, we run the original prompt to perform the analysis on all the chunks in parallel.
    //   const parallelResults = (
    //     await Promise.all(
    //       docChunks.map(async (doc) => {
    //         const messages = [
    //           {
    //             role: "system" as const,
    //             content: trimLines(`
    //                 ${YourJobPrompt({
    //                   analysisToPerform: analyzer.prompt,
    //                 })}
    //             `),
    //           },
    //           {
    //             role: "user" as const,
    //             content: formatDocument(doc),
    //           },
    //         ];
  
    //         const result = await rsnOpen.createChatCompletion({
    //           createChatCompletionRequest: {
    //             model: mapModel,
    //             messages,
    //             temperature: 0.5,
    //           },
    //           verbose: true,
    //         });
  
    //         return result.data.choices[0].message?.content;
    //       })
    //     )
    //   )
    //     .filter(notEmpty)
    //     .filter((res) => res.trim() !== "<|NO-CHANGE-NEEDED|>");
  
    //   console.log("!!!!!! Parallel results complete. Performing refinement...");
    //   // 2. Then, we run the refinement prompt which is responsible for simply combining two lists into a cohesive list.
    //   const refinementMessages = [
    //     {
    //       role: "system" as const,
    //       content: trimLines(`
    //                   # Context
    //                   The user will give you similar-looking analyses, which were generated by performing this analysis on the data: 
                      
    //                   '''
    //                   ${analyzer.prompt}
    //                   '''
  
    //                   # Your Task
    //                   Your job is to combine all the analyses into a final analysis matching the same shape, with ALL of the data included.
                      
    //                   All analyses should be combined into a single cohesive grouping that matches the individual group structures.
  
    //                   Your final output should contain all the information from the original groups, but in a single cohesive grouping.
  
    //                   ## ⚠️ IMPORTANT DETAILS ⚠️
    //                   1. Remember, ALL of the original data should be provided.
    //                   2. DO NOT add any commentary. Simply combine the data.
  
    //                   # Example
    //                   ## EXAMPLE INPUTS
    //                   '''
    //                   <ANALYSIS-1>
    //                   Animals
    //                   - cat
    //                   - dog
    //                   - bird
    //                   Minerals
    //                   - rock
    //                   </ANALYSIS-1>
  
    //                   <ANALYSIS-2>
    //                   Animals
    //                   - porcupine
    //                   - cat
    //                   Minerals
    //                   - diamond
    //                   - rock
    //                   </ANALYSIS-2>
  
    //                   ## EXAMPLE OUTPUT
    //                   '''
    //                   <FINAL-COMBINED-ANALYSIS>
    //                   Animals
    //                   - cat
    //                   - dog
    //                   - bird
    //                   - porcupine
    //                   Minerals
    //                   - diamond
    //                   - rock
    //                   </FINAL-COMBINED-ANALYSIS>
    //                   '''
    //               `),
    //     },
    //     ...parallelResults.map((res, idx) => ({
    //       role: "user" as const,
    //       content: `<ANALYSIS-${idx}>${res}</ANALYSIS-${idx}>`,
    //     })),
    //   ];
  
    //   const result = await rsnOpen.createChatCompletion({
    //     createChatCompletionRequest: {
    //       model: refineModel,
    //       messages: refinementMessages,
    //       temperature: 0.1,
    //     },
    //     verbose: true,
    //   });
  
    //   const resultCompletionContent = result.data.choices[0].message?.content;
  
    //   if (!resultCompletionContent) {
    //     throw new Error("Could not get a good result from OpenAI");
    //   }
  
    //   return {
    //     type: "simple-prompt",
    //     result: resultCompletionContent,
    //   };
    // } else {
    //   // FOR NOW, our chunks are just full documents...
    //   const docChunks = documents.map((doc) => doc);
  
    //   // 2. Ask for an initial analysis, using the `system` and `user` prompts correctly.
    //   var existingAnalysis: string | undefined = undefined;
    //   while (docChunks.length > 0) {
    //     const doc = docChunks.shift()!;
    //     const messages: any = [
    //       {
    //         role: "system" as const,
    //         content: trimLines(`
    //                       ${YourJobPrompt({
    //                         analysisToPerform: analyzer.prompt,
    //                         existingAnalysis
    //                       })}
    //                   `),
    //       },
    //       {
    //         role: "user" as const,
    //         content: formatDocument(doc),
    //       },
    //     ];
  
    //     const result = await rsnOpen.createChatCompletion({
    //       createChatCompletionRequest: {
    //         model: mapModel,
    //         messages,
    //         temperature: 0.5,
    //       },
    //       verbose: true,
    //     });
  
    //     const resultCompletionContent = result.data.choices[0].message?.content;
  
    //     if (!resultCompletionContent) {
    //       throw new Error("Could not get a good result from OpenAI");
    //     }
  
    //     // TODO: parse the result for the "NO CHANGE". If so, we just keep our analysis.
    //     if (resultCompletionContent.trim() !== "<|NO-CHANGE-NEEDED|>") {
    //       existingAnalysis = resultCompletionContent;
    //     }
    //     console.log("Existing analysis: ", existingAnalysis);
    //   }
  
    //   console.log("RETURNING Existing analysis: ", existingAnalysis);
    //   // 3. Recursively ask for refinement, using the `system` and `user` prompts correctly.
    //   return {
    //     type: "simple-prompt",
    //     result: existingAnalysis ?? "",
    //   };
    // }
  }