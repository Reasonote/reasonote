import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";

import {GenBloomLessonsLesson} from "./genBloomLessons";

export const GetLessonSkillsSkillSchema = z.object({
    name: z.string().describe('The name of the skill'),
    level: z.enum(['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating']).describe('At what level does this lesson cover the skill?'),
})

export const GetLessonSkillsResultSchema = z.object({
    skills: z.array(GetLessonSkillsSkillSchema).describe('A list of skills covered in the lesson'),
});
export type GetLessonSkillsResult = z.infer<typeof GetLessonSkillsResultSchema>

export async function getLessonSkills({
    lesson,
    existingSkills
}: {
    lesson: GenBloomLessonsLesson,
    existingSkills: string[]
}) {
    return await oneShotAIClient({
        systemMessage: `
        # Your Role
        You are responsible for determining which skills a lesson covers, and to what extent.

        When determining a skill, you should output:
        - The Name of the Subskill
        - The level in Bloom's Taxonomy at which it is covered in the lesson

        --------------------------------------------

        # Helpful Information

        ## Bloom's Taxonomy
        Bloom's Taxonomy is a classification of the different objectives and skills that educators set for students (learning objectives).
        It divides educational objectives into six levels: remembering, understanding, applying, analyzing, evaluating, and creating.
        
        ### Create
            Verbs: design, formulate, build, invent, create, compose, generate, derive, modify, develop.
            Example: "By the end of this lesson, the student will be able to design an original homework problem dealing with the principle of conservation of energy."
        ### Evaluate
            Verbs: choose, support, relate, determine, defend, judge, grade, compare, contrast, argue, justify, support, convince, select, evaluate.
            Example: "By the end of this lesson, the student will be able to determine whether using conservation of energy or conservation of momentum would be more appropriate for solving a dynamics problem."
        ### Analyze
            Verbs: classify, break down, categorize, analyze, diagram, illustrate, criticize, simplify, associate.
            Example: "By the end of this lesson, the student will be able to differentiate between potential and kinetic energy."
        ### Apply
            Verbs: calculate, predict, apply, solve, illustrate, use, demonstrate, determine, model, perform, present.
            Example: "By the end of this lesson, the student will be able to calculate the kinetic energy of a projectile."
        ### Understand
            Verbs: describe, explain, paraphrase, restate, give original examples of, summarize, contrast, interpret, discuss.
            Example: "By the end of this lesson, the student will be able to describe Newton’s three laws of motion to in her/his own words."
        ### Remember
            Verbs: list, recite, outline, define, name, match, quote, recall, identify, label, recognize.
            Example: "By the end of this lesson, the student will be able to recite Newton’s three laws of motion."

        --------------------------------------------

        # Context
        ## Lesson
        ### Activities
        ${JSON.stringify(lesson.learningObjectives.remembering.map((lo) => lo.activities), null, 2)}
        ${JSON.stringify(lesson.learningObjectives.understanding.map((lo) => lo.activities), null, 2)}
        ${JSON.stringify(lesson.learningObjectives.applying.map((lo) => lo.activities), null, 2)}
        ${JSON.stringify(lesson.learningObjectives.analyzing.map((lo) => lo.activities), null, 2)}
        ${JSON.stringify(lesson.learningObjectives.evaluating.map((lo) => lo.activities), null, 2)}
        ${JSON.stringify(lesson.learningObjectives.creating.map((lo) => lo.activities), null, 2)}

        `,
        functionName: "outputBloomLessons",
        functionDescription: "Output Lessons based on Bloom's taxonomy for the subject.",
        functionParameters: GetLessonSkillsResultSchema
    })
}