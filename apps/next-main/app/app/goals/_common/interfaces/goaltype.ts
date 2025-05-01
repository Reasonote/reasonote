import { z } from "zod";

export const GoalTypeEnumSchema = z.enum(["habit", "today-only"]);
export type GoalTypeEnum = z.infer<typeof GoalTypeEnumSchema>;
