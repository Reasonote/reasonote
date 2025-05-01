import {
  AnalysisDocument,
  AnalyzerJSONSchemaOutput,
} from "../_route";

export async function analyzeRecursiveSchemaOutput(
    documents: AnalysisDocument[],
    analyzer: AnalyzerJSONSchemaOutput,
    strategy: "refine" | "mapReduce" = "mapReduce"
  ) {
    // const mapModel = "gpt-4-turbo";
    // const refineModel = "gpt-4-turbo";
    // // const mapModel = 'gpt-3.5-turbo-0613';
    // // const refineModel = 'gpt-3.5-turbo-0613';
    // const max_retries = 5;

    // if (strategy === "mapReduce") {
    //   // TODO: make chunks that are appropriately sized given the system prompt.
    //   const docChunks = documents.map((doc) => doc);
  
  
    //   const OUTPUT_FORMAT: "yaml" | "json" = "json" as "yaml" | "json";
  

    //   const zodSchema = parseToZod(analyzer.jsonSchema);
  
    //   // 1. First, we run the original prompt to perform the analysis on all the chunks in parallel.
    //   const parallelResults = (
    //     await Promise.all(
    //       docChunks.map(async (doc) => {
    //         for (var i = 0; i < max_retries; i++) {
    //           try {
    //             const messages = [
    //               {
    //                 role: "system" as const,
    //                 content: trimLines(`
    //                     # Task
    //                     You are responsible for carrying out an analysis of the documents the user gives you.
                        
    //                     You will be given a set of documents to analyze and extract data from.
  
    //                     Your job is to analyze the document(s) and produce a items formatted to match the above schema.
  
    //                     # Analysis
    //                     The schema provided is included below for your reference.
                        
    //                     ${analyzer.prompt ? 
    //                         `
    //                         ## Prompt
    //                         \`\`\`
    //                         ${analyzer.prompt}
    //                         \`\`\`
    //                         `:
    //                         ""
    //                     }
    //                 `),
    //               },
    //               {
    //                 role: "user" as const,
    //                 content: formatDocument(doc),
    //               },
    //             ];
  
    //             const result = await rsnOpen.createChatCompletion({
    //               createChatCompletionRequest: {
    //                 model: mapModel,
    //                 messages,
    //                 temperature: 0.5,
    //                 // Create a "function" description which is really just the schema.
    //                 functions: [
    //                   {
    //                     name: "set_extracted_data",
    //                     parameters: {
    //                       type: "object",
    //                       properties: {
    //                         extracted_data: analyzer.jsonSchema,
    //                       },
    //                     },
    //                   },
    //                 ],
    //                 // Force the output to be a list of objects matching the schema.
    //                 function_call: {
    //                   name: "set_extracted_data",
    //                 },
    //               },
    //               verbose: true,
    //             });
  
    //             const resultCompletionContent =
    //               result.data.choices[0].message?.function_call?.arguments;
  
    //             if (!resultCompletionContent) {
    //               throw new Error("Could not get a good result from OpenAI");
    //             }
  
    //             // This should throw if it cannot be parsed as JSON.
    //             const jsonParsedContent = JSON.parse(resultCompletionContent);
  
    //             if (!jsonParsedContent) {
    //               throw new Error("did not receive valid json");
    //             }
  
    //             console.log("jsonParsedContent", jsonParsedContent);
  
    //             // This will throw if it does not match the zod schema.
    //             const zodParsedContent = zodSchema.parse(
    //               jsonParsedContent.extracted_data
    //             );
  
    //             return {
    //               rawTextResult: resultCompletionContent,
    //               parsedResult: zodParsedContent,
    //             };
    //           } catch (err: any) {
    //             console.log(
    //               `Error with OpenAI API request: ${err.message}, retry: ${i}/${max_retries}`
    //             );
    //           }
    //         }
    //       })
    //     )
    //   ).filter(notEmpty);
  
    //   console.log("!!!!!! Parallel results complete. Performing refinement...");
  
    //   const jsonExampleRefineOutputList = trimLines(`
    //       [
    //           {
    //               "name": "Michael",
    //               "exactAge": 28,
    //               "approximateAge": null,
    //               "occupation": null,
    //               "relationships": [
    //                   {
    //                       "name": "Emily Raines",
    //                       "relationship": "acquaintance"
    //                   }
    //               ],
    //           },
    //           {
    //               "name": "Emily Raines",
    //               "exactAge": null,
    //               "approximateAge": "20s",
    //               "occupation": "acute care nurse",
    //               "relationships": [
    //                   {
    //                       "name": "Michael",
    //                       "relationship": "acquaintance"
    //                   }
    //               ]
    //           }
    //       ]`);
  
    //   const ymlExampleRefineOutputList = trimLines(`
    //           - name: "Michael"
    //             exactAge: 28
    //             approximateAge: null
    //             occupation: null
    //             relationships:
    //               - name: "Emily Raines"
    //                 relationship: "acquaintance"
    //           - name: "Emily Raines"
    //             exactAge: null
    //             approximateAge: "20s"
    //             occupation: "acute care nurse"
    //             relationships:
    //               - name: "Michael"
    //                 relationship: "acquaintance"
    //       `);
  
    //   const originalRefineExample = `
    //       3. DO NOT add any commentary. Simply combine the data.
  
    //       # Example
    //       ## EXAMPLE INPUTS
    //       ### EXAMPLE INPUT ANALYSES
    //       <ANALYSIS-0>
    //       - name: "Michael"
    //         exactAge: 28
    //         approximateAge: null
    //         occupation: null
    //         relationships: null
    //       </ANALYSIS-0>
    //       <ANALYSIS-1>
    //       - name: "Emily Raines"
    //         exactAge: null
    //         approximateAge: "20s"
    //         occupation: "acute care nurse"
    //         relationships:
    //           - name: "Michael"
    //             relationship: "acquaintance"
    //       </ANALYSIS-1>
    //       ### EXAMPLE INPUT SCHEMA
    //       {
    //           "type": "object",
    //           "name": "Person",
    //           "description": "A person",
    //           "properties": {
    //               "name": {
    //                   "type": "string",
    //                   "description": "The name of the person"
    //               },
    //               "exactAge": {
    //                   "type": "number",
    //                   "description": "The exact age of the person (null if unknown)"
    //               },
    //               "approximateAge": {
    //                   "type": "number",
    //                   "description": "The approximate age of the person (null if unknown)"
    //               },
    //               "occupation": {
    //                   "type": "string",
    //                   "description": "The occupation of the person (null if unknown)"
    //               },
    //               "relationships": {
    //                   "type": "array",
    // //                   "description": "The relationships of the person (null if unknown)",
    // //                   "items": {
    // //                       "type": "object",
    // //                       "properties": {
    // //                           "name": {
    // //                               "type": "string",
    // //                               "description": "The name of the person"
    // //                           },
    // //                           "relationship": {
    // //                               "type": "string",
    // //                               "description": "The relationship of the OTHER person to this person"
    // //                           }
    // //                       }
    // //                   }
    // //               }
    // //           }
    // //       }
  
    // //       ## EXAMPLE OUTPUT MATCHING INPUT SCHEMA
    // //       <FINAL-COMBINED-ANALYSIS>
    // //       ${
    // //         OUTPUT_FORMAT === "yaml"
    // //           ? ymlExampleRefineOutputList
    // //           : jsonExampleRefineOutputList
    // //       }
    // //       </FINAL-COMBINED-ANALYSIS>
    // //       `;
  
    // //   // 2. Then, we run the refinement prompt which is responsible for simply combining two lists into a cohesive list.
    // //   const refinementMessages = [
    // //     {
    // //       role: "system" as const,
    // //       content: trimLines(`
    // //                   # Task
    // //                   ## Your Job
    // //                   You will be given a set of analyses to combine.
    // //                   Your job is to combine all the analyses into a final analysis, with ALL of the data included.
    // //                   All analyses should be combined into a single cohesive grouping that matches the individual group structures.
    // //                   Your final output should contain all the information from the original groups, but in a single cohesive grouping.
  
    // //                   ## ⚠️ IMPORTANT DETAILS ⚠️
    // //                   1. Remember, ALL of the original data should be provided.
    // //                   2. If there are entries that are clearly duplicates, combine them.
    // //               `),
    // //     },
    // //     ...parallelResults.map((res, idx) => ({
    // //       role: "user" as const,
    // //       content: `<ANALYSIS-${idx}>${JSON.stringify(
    // //         res.parsedResult,
    // //         null,
    // //         2
    // //       )}</ANALYSIS-${idx}>`,
    // //     })),
    // //   ];
  
    // //   for (var i = 0; i < max_retries; i++) {
    // //     try {
    // //       const result = await rsnOpen.createChatCompletion({
    // //         createChatCompletionRequest: {
    // //           model: refineModel,
    // //           messages: refinementMessages,
    // //           temperature: 0.1,
    // //           // Create a "function" description which is really just the schema.
    // //           functions: [
    // //             {
    // //               name: "set_combined_extracted_data",
    // //               parameters: {
    // //                 type: "object",
    // //                 properties: {
    // //                   combined_extracted_data: analyzer.jsonSchema,
    // //                 },
    // //               },
    // //             },
    // //           ],
    // //           // Force the output to be a list of objects matching the schema.
    // //           function_call: {
    // //             name: "set_combined_extracted_data",
    // //           },
    // //         },
    // //         verbose: true,
    // //       });
  
    // //       const resultCompletionContent =
    // //         result.data.choices[0].message?.function_call?.arguments;
  
    // //       if (!resultCompletionContent) {
    // //         throw new Error("Could not get a good result from OpenAI");
    // //       }
  
    // //       // This should throw if it cannot be parsed as JSON.
    // //       const jsonParsedContent = JSON.parse(resultCompletionContent);
  
    // //       if (!jsonParsedContent) {
    // //         throw new Error("did not receive valid json");
    // //       }
  
    // //       // This will throw if it does not match the zod schema.
    // //       const zodParsedContent = zodSchema.parse(
    // //         jsonParsedContent.combined_extracted_data
    // //       );
  
    // //       return {
    // //         rawTextResult: resultCompletionContent,
    // //         parsedResult: zodParsedContent,
    // //       };
    // //     } catch (err: any) {
    // //       console.log(
    // //         `Error with OpenAI API request: ${err.message}, retry: ${i}/${max_retries}`
    // //       );
    // //     }
    // //   }
    // // } else {
    // //   throw new Error("Not implemented");
    // // }

    throw new Error("Not implemented");
  }