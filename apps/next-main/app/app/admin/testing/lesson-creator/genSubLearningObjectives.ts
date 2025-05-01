import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";

import {LearningObjectiveAISchema} from "./genBloomTaxonomy";

interface GenLearningObjChildrenLearningObjectiveInput {
    name: string;
}


export async function genLearningObjChildren({
    learningObjective,
    reasons,
    siblings,
    subject
}: {
    subject: string,
    learningObjective: GenLearningObjChildrenLearningObjectiveInput,
    siblings: GenLearningObjChildrenLearningObjectiveInput[],
    reasons: string
}) {
    return await oneShotAIClient({
        systemMessage: `
        # Your Role
        You are responsible for helping the user study learn the subject: "${subject}".

        You will be generating "child learning objectives" for the parent learning objective: "${learningObjective.name}".

        # User Context
        The user has provided the following reason(s) for studying this subject:
        \`\`\`
        ${reasons}
        \`\`\`

        `,
        functionName: "outputLearningObjectiveChildren",
        functionDescription: "Output a list of learning objectives which are children of the given learning objective. These should be more specific learning objectives which are necessary to learn the parent learning objective.",
        functionParameters: z.object({
            childLearningObjectives: z.array(LearningObjectiveAISchema).describe('A list of learning objectives which are children of the given learning objective. These should be more specific learning objectives which are necessary to learn the parent learning objective.'),
        })
    })
}