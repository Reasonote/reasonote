import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";

import {GenBloomTaxonomyOutput} from "./genBloomTaxonomy";

export const LessonActivityInfopageSchema = z.object({
    type: z.literal('infopage').optional().default('infopage'),
    name: z.string().describe('The name of the infopage'),
    topics: z.array(z.string()).describe('A list of topics which will be covered in the infopage'),
});

export const LessonActivityFlashcardSchema = z.object({
    type: z.literal('flashcard').optional().default('flashcard'),
    question: z.string().describe('The question of the flashcard'),
    answer: z.string().describe('The answer of the flashcard')
})

export const LessonActivityMultipleChoiceSchema = z.object({
    type: z.literal('multipleChoice').optional().default('multipleChoice'),
    question: z.string().describe('The question of the multiple choice activity'),
    options: z.array(z.string()).describe('A list of options for the multiple choice question'),
    correctAnswer: z.string().describe('The correct answer for the multiple choice question')
})

export const LessonActivitySchema = z.union([
    LessonActivityInfopageSchema,
    LessonActivityFlashcardSchema,
    LessonActivityMultipleChoiceSchema
])


export const GenLessonsLearningObjectiveAISchema = z.object({
    name: z.string().describe('The name of the learning objective'),
    activities: z.array(LessonActivitySchema).describe('A list of activities which will help the student learn the learning objective.'),
})
export type GenLessonsLearningObjectiveAI = z.infer<typeof GenLessonsLearningObjectiveAISchema>

export const GenBloomLessonsTaxonomySchema = z.object({
    remembering: z.array(GenLessonsLearningObjectiveAISchema).describe('A list of learning objectives for the "remembering" stage'),
    understanding: z.array(GenLessonsLearningObjectiveAISchema).describe('A list of learning objectives for the "understanding" stage'),
    applying: z.array(GenLessonsLearningObjectiveAISchema).describe('A list of learning objectives for the "applying" stage'),
    analyzing: z.array(GenLessonsLearningObjectiveAISchema).describe('A list of learning objectives for the "analyzing" stage'),
    evaluating: z.array(GenLessonsLearningObjectiveAISchema).describe('A list of learning objectives for the "evaluating" stage'),
    creating: z.array(GenLessonsLearningObjectiveAISchema).describe('A list of learning objectives for the "creating" stage'),
})
export type GenBloomLessonsTaxonomy = z.infer<typeof GenBloomLessonsTaxonomySchema>

export const GenBloomLessonsLessonSchema = z.object({
    type: z.literal('lesson').optional().default('lesson'),
    name: z.string().describe('The name of the lesson'),
    learningObjectives: GenBloomLessonsTaxonomySchema
})
export type GenBloomLessonsLesson = z.infer<typeof GenBloomLessonsLessonSchema>

export const GenBloomLessonsResultSchema = z.object({
    lessons: z.array(GenBloomLessonsLessonSchema).describe('A list of lessons for the given subject'),
});
export type GenBloomLessonsResult = z.infer<typeof GenBloomLessonsResultSchema>

export async function genBloomLessons({
    subject,
    reasons,
    existingLessons,
    existingLearningObjectives
}: {
    subject: string,
    reasons: string,
    existingLessons?: GenBloomLessonsResult['lessons'],
    existingLearningObjectives?: GenBloomTaxonomyOutput;
    allowedLevels?: string[];
}) {
    return await oneShotAIClient({
        systemMessage: `
        # Your Role
        You are responsible for generating a set of SHORT, BITE-SIZED lessons to help the user learn the subject of "${subject}".

        The ordering of each lesson should explicitly be based on Bloom's taxonomy.

        You have been given a number of existing learning objectives to use as a starting point for your lessons.

        - You should aim to create 5-10 minute lessons.
        - Your lessons should be possible to be studied in a single sitting.
        - The lessons will be taught within the context of an e-learning platform.
        - Assume that exercises can be created on demand to help the student learn the material, but remember it is an e-learning platform.
        - Each micro-lesson should cover ALL SIX of Bloom's taxonomy stages.

        # Example
        
        ## Example Input:
        \`\`\`
        {
            "subject": "Python",
            "reasons": "I want to learn python to enhance my career prospects in software development."
        }
        \`\`\`

        ## Example Output:

        {
            "lessons": [
              {
                "type": "lesson",
                "name": "Understanding Variables & Data Types in Python",
                "learningObjectives": {
                  "remembering": [
                    {"name": "List Python data types"},
                    {"name": "Define what variables are"}
                  ],
                  "understanding": [
                    {"name": "Explain the use of variables"},
                    {"name": "Differentiate between data types"}
                  ],
                  "applying": [
                    {"name": "Use variables in simple Python scripts"}
                  ],
                  "analyzing": [
                    {"name": "Compare data types based on their usage context"}
                  ],
                  "evaluating": [
                    {"name": "Assess the appropriateness of data type selection for specific variables"}
                  ],
                  "creating": [
                    {"name": "Design a Python script utilizing variables and multiple data types effectively"}
                  ]
                }
              },
              {
                "type": "lesson",
                "name": "Control Flow in Python: If Statements & Loops",
                "learningObjectives": {
                  "remembering": [
                    {"name": "Identify syntax for if statements"},
                    {"name": "Recall how for and while loops are structured"}
                  ],
                  "understanding": [
                    {"name": "Summarize the purpose of control flow in programming"}
                  ],
                  "applying": [
                    {"name": "Construct simple if statements"},
                    {"name": "Write for and while loops in Python"}
                  ],
                  "analyzing": [
                    {"name": "Analyze a problem that requires iteration to solve"}
                  ],
                  "evaluating": [
                    {"name": "Judge when to use an if statement versus a loop"}
                  ],
                  "creating": [
                    {"name": "Develop a script that combines if statements and loops to solve a problem"}
                  ]
                }
              }
            ]
          }

        --------------------------------------------

        # Helpful Information

        Create
            Verbs: design, formulate, build, invent, create, compose, generate, derive, modify, develop.
            Example: "By the end of this lesson, the student will be able to design an original homework problem dealing with the principle of conservation of energy."
        Evaluate
            Verbs: choose, support, relate, determine, defend, judge, grade, compare, contrast, argue, justify, support, convince, select, evaluate.
            Example: "By the end of this lesson, the student will be able to determine whether using conservation of energy or conservation of momentum would be more appropriate for solving a dynamics problem."
        Analyze
            Verbs: classify, break down, categorize, analyze, diagram, illustrate, criticize, simplify, associate.
            Example: "By the end of this lesson, the student will be able to differentiate between potential and kinetic energy."
        Apply
            Verbs: calculate, predict, apply, solve, illustrate, use, demonstrate, determine, model, perform, present.
            Example: "By the end of this lesson, the student will be able to calculate the kinetic energy of a projectile."
        Understand
            Verbs: describe, explain, paraphrase, restate, give original examples of, summarize, contrast, interpret, discuss.
            Example: "By the end of this lesson, the student will be able to describe Newton’s three laws of motion to in her/his own words."
        Remember
            Verbs: list, recite, outline, define, name, match, quote, recall, identify, label, recognize.
            Example: "By the end of this lesson, the student will be able to recite Newton’s three laws of motion."


        --------------------------------------------

        # Context
        ## Existing Learning Objectives
        \`\`\`
        ${JSON.stringify(existingLearningObjectives, null, 2)}
        \`\`\`

        ## Existing Lessons
        \`\`\`
        ${JSON.stringify(existingLessons, null, 2)}
        \`\`\`

        ## User Context
        The user has provided the following reason(s) for studying this subject:
        \`\`\`
        ${reasons}
        \`\`\`

        `,
        functionName: "outputBloomLessons",
        functionDescription: "Output Lessons based on Bloom's taxonomy for the subject.",
        functionParameters: GenBloomLessonsResultSchema
    })
}