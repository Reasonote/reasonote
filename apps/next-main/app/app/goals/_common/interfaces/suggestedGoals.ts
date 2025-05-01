import { z } from "zod";

import { GoalTypeEnumSchema } from "./goaltype";

export const SuggestedGoalSchema = z.object({
  goalName: z.string(),
  goalType: GoalTypeEnumSchema,
});
export type SuggestedGoal = z.infer<typeof SuggestedGoalSchema>;
