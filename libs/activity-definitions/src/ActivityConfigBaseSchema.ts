import { z } from "zod";

import { CitationSchema } from "@reasonote/core";

export const ActivityConfigBaseSchema = z.object({
    citations: z.array(CitationSchema).optional().nullable().describe('If document references are provided, all activities should pull their content from the provided documents, and provide citations to the documents.')
});
export type ActivityConfigBase = z.infer<typeof ActivityConfigBaseSchema>;
