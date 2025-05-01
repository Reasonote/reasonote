import {z} from "zod";

export const RouteWarningSchema = z.object({
    code: z.string(),
    text: z.string(),
});
export type RouteWarning = z.infer<typeof RouteWarningSchema>;