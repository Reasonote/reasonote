import { z } from "zod";

export const ActivityConfigSchema = z.object({
    type: z.string(),
    version: z.string(),
    citations: z.array(z.object({
        docId: z.string(),
        startText: z.string(),
        endText: z.string(),
    })).optional().nullable(),
});

export type ActivityConfig = z.infer<typeof ActivityConfigSchema>;