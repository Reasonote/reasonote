import { z } from "zod";

export const LessonLearningObjectiveSchema = z.object({
    id: z.string().describe('The id of the learning objective'),
    name: z.string().describe('The name of the learning objective'),
    description: z.string().describe('The description of the learning objective'),
});

export type LessonLearningObjective = z.infer<typeof LessonLearningObjectiveSchema>;
