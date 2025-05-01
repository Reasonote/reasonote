import {z} from "zod";

import {
  ActivityTypesPublic,
} from "@reasonote/core";
import {ApiRoute} from "@reasonote/lib-api-sdk";

export const PracticeGetNextActivityRouteRequestSchema = z.object({
    practiceMode: z.enum(['saved', 'missed']).describe('What kind of practice mode to use: saved for saved activities, missed for missed activities'),
    skillIdPath: z.array(z.string()).describe('The skill id path to get the next activity for'),
    activityTypes: z.array(z.string()).optional().default([...ActivityTypesPublic]).describe('The activity types to get suggested lessons for'),
    ignoreActivities: z.array(z.string()).optional().default([]).describe('The activities to ignore when suggesting the next activity'),
    numActivities: z.number().optional().default(1).describe('The number of activities to suggest'),
    orderBy: z.enum(['activityScore', 'skillScore']).optional().default('activityScore').describe("The order to sort the activities by. activityScore sorts by the user's past scores on the activity. skillScore sorts activities by the user's scores on the skills of activities."),
});
export type PracticeGetNextActivityRouteRequestIn = z.input<
  typeof PracticeGetNextActivityRouteRequestSchema
>

export type PracticeGetNextActivityRouteRequest = z.infer<
  typeof PracticeGetNextActivityRouteRequestSchema
>

export const PracticeGetNextActivityRouteResponseSchema = z.object({
  activityList: z.array(z.object({activityId: z.string(), type: z.string()})).describe('The activities the user will complete in the practice.'),
  warnings: z.array(z.object({code: z.string(), message: z.string()})).optional().describe('Any warnings that occurred during the request.'),
});

export const PracticeGetNextActivityRoute = new ApiRoute({
    path: "/api/practice/get_next_activity",
    method: "post",
    requestSchema: PracticeGetNextActivityRouteRequestSchema,
    responseSchema: PracticeGetNextActivityRouteResponseSchema,
});