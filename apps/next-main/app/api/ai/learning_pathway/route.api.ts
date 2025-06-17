import {z} from "zod";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {
  LearningPathwayAI,
  LearningPathwayResponseSchema,
  UserProfileSchema,
} from "@reasonote/lib-ai/src/learningPathway/learningPathway";
import {ApiRoute} from "@reasonote/lib-api-sdk";

const LearningPathwayRequestSchema = z.object({
    message: z.string(),
    context: UserProfileSchema.partial()
});

const route = new ApiRoute({
    path: "/api/ai/learning_pathway",
    method: "post",
    requestSchema: LearningPathwayRequestSchema,
    responseSchema: LearningPathwayResponseSchema
});

export const { POST } = makeServerApiHandlerV3({
    route,
    handler: async (ctx) => {
        const { message, context } = ctx.parsedReq;

        // Create the learning pathway AI processor
        const learningPathwayAI = new LearningPathwayAI(ctx.ai);

        // Process the message and get the response
        const response = await learningPathwayAI.processMessage(message, context);

        return response;
    }
}); 