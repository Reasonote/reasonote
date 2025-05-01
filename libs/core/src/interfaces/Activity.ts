import { z } from "zod";

export const ActivitySchema = z.object({
    id: z.string().nullish().describe('The id of the activity'),
    forSkills: z.array(z.object({
        id: z.string().optional(), 
        name: z.string().optional(), 
        pathTo: z.array(z.string()).optional()
    })).nullish().describe('The skills that the activity is for'),
    type: z.string().describe('The type of the activity'),
    config: z.object({
        data: z.record(z.string(), z.any()).describe('The data of the activity'),
    }).nullish().describe('The configuration of the activity'),
    results: z.object({
        id: z.string().nullish().describe('The id of the result'),
        data: z.record(z.string(), z.any()).describe('The data of the result'),
    }).array().nullish().describe('The results of the activity'),
});
export type Activity = z.infer<typeof ActivitySchema>;