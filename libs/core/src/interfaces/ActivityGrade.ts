import { z } from "zod";

export const ActivitySubmitResultSchema = z.object({
    score: z.number().optional(),
    shortFeedback: z.string().optional(),
    details: z.any().optional(),
});

export type ActivitySubmitResult<TSubmitResultDetails = any> = z.infer<typeof ActivitySubmitResultSchema> & {
    details: TSubmitResultDetails;
}
