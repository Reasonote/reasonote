import {BasicRequestContext} from "@/utils/apiUtils/BasicRequestContext";

import {
  AnalysisResult,
  AnalysisRoute,
  AnalyzerResultAnalysis,
} from "../_route";
import {analyzeRecursive} from "./analyzeRecursive";

export async function PerformAnalysis(
    CTX: BasicRequestContext<typeof AnalysisRoute>,
    analyzerId: string
  ): Promise<AnalysisResult | undefined> {
    // Construct basic objects.
    const { logger } = CTX;

  
    const documents = CTX.parsedReq.documents;
    const analyzer = CTX.parsedReq.analyzers.find(
      (analyzer) => analyzer.id === analyzerId
    );
  
    if (!analyzer) return undefined;
  
    console.log("Running analyzer:", analyzer.name);
  
    // Setup retry.
    let resultCompletionContent: AnalyzerResultAnalysis = await analyzeRecursive(
      documents,
      analyzer,
    );
  
    if (!resultCompletionContent) {
      console.log(
        "ERROR FOUND!!!\n\n\n\n\n: resultCompletionContent",
        resultCompletionContent
      );
      throw new Error("Could not get a good result from OpenAI");
    }
  
    console.log("Analyzer name: ", analyzer.name);
    console.log("Result: ", resultCompletionContent);
  
    //////////////////////////////////////////////////////////
    // CONSTRUCT THE RESPONSE
    const ret: AnalysisResult = {
      analyzer,
      analysis: resultCompletionContent,
    };
  
    //////////////////////////////////////////////////////////
    // RETURN THE RESPONSE
    return ret;
  }
  