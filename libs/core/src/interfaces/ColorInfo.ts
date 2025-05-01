import { z } from "zod";

export const ColorInfoSchema = z.object({
    primaryColor: z.object({
        hsl: z.string().optional().describe("The primary color in HSL format"),
        rgb: z.string().optional().describe("The primary color in RGB format"),
    }).optional().describe("The primary color"),
    secondaryColor: z.object({
        hsl: z.string().optional().describe("The secondary color in HSL format"),
        rgb: z.string().optional().describe("The secondary color in RGB format"),
    }).optional().describe("The secondary color"),
});
export type ColorInfo = z.infer<typeof ColorInfoSchema>;
