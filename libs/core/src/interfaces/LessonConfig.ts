import { z } from "zod";

import { ActivitySchema } from "./Activity";
import { LessonBasicConfigSchema } from "./LessonBasicConfig";
import { LessonLearningObjectiveSchema } from "./LessonLearningObjective";

export interface LessonConfigSkill {
    id: string;
    // name: string;
    // children?: LessonConfigSkill[];
}

export interface LessonSkillTreeActivityGenerateSkill {
    id: string;
    pathTo: string[];
}

export const LessonConfigSchema = z.object({
    id: z.string().optional().describe('The id of the lesson'),
    basic: LessonBasicConfigSchema,
    rootSkillId: z.string().describe('The id of the root skill of the lesson'),
    activities: z.array(ActivitySchema).nullish(),
    learningObjectives: z.array(LessonLearningObjectiveSchema).nullish(),
})
export type LessonConfig = z.infer<typeof LessonConfigSchema>;

export const LearningObjectiveAISchema = z.object({
    name: z.string().describe('The name of the learning objective'),
    // description: z.string().describe('The description of the learning objective'),
}).describe('A learning objective for the given lesson.');

export const LearningObjectiveSchema = LearningObjectiveAISchema.extend({
    id: z.string().describe('The id of the learning objective'),
});