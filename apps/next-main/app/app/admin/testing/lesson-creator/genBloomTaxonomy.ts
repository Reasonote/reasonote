import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";

export const TimeSchema = z.object({
    hours: z.number().optional(),
    minutes: z.number().optional(),
})

export const LearningObjectiveAISchema = z.object({
    name: z.string().describe('The name of the learning objective'),
    isOptional: z.boolean().optional(),
    timeToStudy: TimeSchema.optional().describe('The amount of time you expect it would take to learn the objective, and demonstrate mastery of it.'),
})
export type LearningObjective = z.infer<typeof LearningObjectiveAISchema>

export const BloomTaxonomySchema = z.object({
    stages: z.object({
        type: z.literal('stages').optional().default('stages'),
        remembering: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "remembering" stage'),
        understanding: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "understanding" stage'),
        applying: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "applying" stage'),
        analyzing: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "analyzing" stage'),
        evaluating: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "evaluating" stage'),
        creating: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "creating" stage'),
    }).describe('The stages of Bloom\'s taxonomy, with each stage containing a list of learning objectives for this stage'),
})

export const GenBloomTaxonomyOutputSchema = z.object({
    stages: z.object({
        type: z.literal('stages').optional().default('stages'),
        remembering: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "remembering" stage'),
        understanding: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "understanding" stage'),
        applying: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "applying" stage'),
        analyzing: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "analyzing" stage'),
        evaluating: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "evaluating" stage'),
        creating: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the "creating" stage'),
    }).describe('The stages of Bloom\'s taxonomy, with each stage containing a list of learning objectives for this stage'),
})
export type GenBloomTaxonomyOutput = z.infer<typeof GenBloomTaxonomyOutputSchema>

export async function genBloomTaxonomy({subject, reasons}: {subject: string, reasons: string}) {
    return await oneShotAIClient({
        systemMessage: `
        # Your Role
        You are responsible for generating Bloom's taxonomy for the subject of "${subject}".

        # Learning Objective Criteria
        - The learning objectives MUST be teachable within a virtual software, similar to a Duolingo or Digital Tutor-like application.

        # User Context
        The user has provided the following reason(s) for studying this subject:
        \`\`\`
        ${reasons}
        \`\`\`

        `,
        functionName: "outputBloomTaxonomy",
        functionDescription: "Output a Bloom's taxonomy for a given subject.",
        functionParameters: GenBloomTaxonomyOutputSchema
    })
}

