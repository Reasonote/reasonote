import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";

interface SkillTreeNode {
    name: string;
    children: SkillTreeNode[];
}


interface GenSubjectBreakdownInput {
    skill: SkillTreeNode;
    treeRoot: SkillTreeNode;
    reasons: string;
}


function formatSkillTreeNode(skill: SkillTreeNode, depth: number = 0): string {
    let result = `${'  '.repeat(depth)}- ${skill.name}\n`;
    for (const child of skill.children) {
        result += formatSkillTreeNode(child, depth + 1);
    }
    return result;
}


export async function genSubjectBreakdown({skill, treeRoot, reasons}: GenSubjectBreakdownInput) {
    const result = await oneShotAIClient({
        systemMessage: `
        # Your Role
        You are responsible for generating an ordered course of study for the subject: "${skill.name}".

        You should try to avoid adding skills which are already in the tree.
        
        --------------------------------------------
        # Existing Skill Tree
        
        \`\`\`
        ${formatSkillTreeNode(treeRoot)}
        \`\`\`

        --------------------------------------------

        # User Context
        The user has provided the following reason(s) for studying this subject:
        \`\`\`
        ${reasons}
        \`\`\`

        `,
        functionName: "outputSubjectBreakdown",
        functionDescription: "Output the subject breakdown for a given subject. The subjects should be ordered in a way that makes sense for a student to study them.",
        functionParameters: z.object({
            subjects: z.array(z.object({
                name: z.string(),
                canBeLearnedIn10Minutes: z.boolean().optional(),
            })).describe('A list of subjects which should be studied'),
        })
    })


    if (result.data){
        return {
            data: {
                subjects: result.data.subjects.map((subject: any) => {
                    return {
                        name: subject.name,
                        timeToLearn: subject.canBeLearnedIn10Minutes ? {hours: 0, minutes: 10} : {hours: 1, minutes: 0}
                    }
                })
            }
        }
    }
    else {
        return result;
    }
}