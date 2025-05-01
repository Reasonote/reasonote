import {z} from "zod";

import {ApiRoute} from "@reasonote/lib-api-sdk";

export const ActivitySubmitRoute = new ApiRoute({
  path: "/api/activity/submit",
  method: "post",
  requestSchema: z.object({
    activityId: z.string().describe("The ID of the activity to submit"),
    userAnswer: z.any().describe("The user's answer to the activity"),
    lessonSessionId: z.string().optional().describe("The ID of the lesson session, if applicable"),
    skipped: z.boolean().optional().describe("Whether this submission is a skip"),
  }),
  responseSchema: z.object({
    resultId: z.string().describe("The ID of the user_activity_result that was created"),
    resultData: z.any().describe("The row from the user_activity_result table that was created"),
    xpEarned: z.number().describe("The amount of XP earned for this activity submission"),
  }),
}); 