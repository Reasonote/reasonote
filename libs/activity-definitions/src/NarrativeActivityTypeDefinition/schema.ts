import { z } from "zod";

import { ActivityResultUngradedBaseSchema } from "@reasonote/core";

import { ActivityConfigBaseSchema } from "../ActivityConfigBaseSchema";

export const NarrativeActivityConfigSchema = ActivityConfigBaseSchema.extend({
    type: z.literal("narrative").optional().default("narrative"),
    version: z.literal('0.0.0').optional().default('0.0.0'),
    narrativeText: z.string().optional().nullable(),
    metadata: z.object({
        genRequest: z.any().optional().describe('The request that was sent to the AI to generate the narrative'),
    })
    // Include other fields as necessary for your narrative activity
});
export type NarrativeActivityConfig = z.infer<typeof NarrativeActivityConfigSchema>;

export const NarrativeActivityResultSchema = ActivityResultUngradedBaseSchema.extend({
    activityType: z.literal('narrative').optional().default('narrative'),
    activityConfig: NarrativeActivityConfigSchema,
    // feedback: z.object({
    //     // markdownFeedback: z.string().optional().nullable(),
    //     // subskills: z.object({
    //     //     improveSubSkills: z.array(z.string()).optional(),
    //     //     challengeSubSkills: z.array(z.string()).optional(),
    //     // }).optional()
    // }).optional().nullable(),
}).passthrough();

export type NarrativeActivityResult = z.infer<typeof NarrativeActivityResultSchema>;