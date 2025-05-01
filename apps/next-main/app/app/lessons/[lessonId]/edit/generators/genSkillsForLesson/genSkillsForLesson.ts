import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";

import {LessonConfig} from "@reasonote/core"

const SkillSchema: z.ZodSchema<any> = z.lazy(() => z.object({
    name: z.string().describe('The name of the skill.'),
    children: z.array(SkillSchema).optional().describe('The ordered list of subskills that are relevant to the lesson.'),
}));
type Skill = z.infer<typeof SkillSchema>


// Recursive function to generate a schema with a given depth
const generateSchemaWithDepth = (depth: number) => {
    return z.lazy(() => z.object({
        name: z.string().describe('The name of the skill.'),
        children: depth === 0 ? 
            z.array(z.object({
                name: z.string().describe('The name of the skill.'),
            })).optional().describe('The ordered list of subskills that are relevant to the lesson.')
            : 
            generateSchemaWithDepth(depth - 1).optional().describe('The ordered list of subskills that are relevant to the lesson.'),
    }));
}


export async function genSkillsForLesson({
    lessonConfig,
    depth
}: {
    lessonConfig: LessonConfig,
    depth?: number
}) {


    const usingSchema = depth ? generateSchemaWithDepth(depth) : SkillSchema;

    return await oneShotAIClient({
        systemMessage: `
        # YOUR ROLE
        You are responsible for suggesting subtopics (AKA "skills") for a lesson on the subject: "${lessonConfig.basic.name}".

        You should include a list of subtopics that should be studied for the given subject.

        DO NOT include duplicates.

        -------------
        # CONTEXT

        ## LESSON SUMMARY
        \`\`\`
        ${lessonConfig.basic.summary}
        \`\`\`
        -------------
        
        # REMINDERS
        - Make sure the skills are relevant to the lesson.
        - Make sure the skills are specific and actionable.
        - Don't include duplicate skills.

        `,
        functionName: "suggestSkills",
        functionDescription: "Suggest skills for the given lesson.",
        functionParameters: z.object({
            skills: z.array(usingSchema).describe('A list of subtopics that should be studied for the given subject.'),
        })
    })
}