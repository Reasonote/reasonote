import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {
  EphMessageWithCharacterInfo,
} from "@/components/activity/components/EphemeralChat";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {TeachTheAIActivityConfig} from "@reasonote/activity-definitions";
import {RESIChatMessageToVercelMessage} from "@reasonote/lib-ai-common";

export async function gradeRoleplayActivity(data: TeachTheAIActivityConfig, result: {messages: EphMessageWithCharacterInfo[]}){
    const gradeResult = await oneShotAIClient({
        systemMessage: trimLines(`
            # You
            You are an excellent, detail-oriented grader.

            # Your Task
            You are responsible for grading the user's performance in the following Teach The AI activity:
            \`\`\`json
            ${JSON.stringify(data, null, 2)}
            \`\`\`

            # Notes
            - When you give feedback to the user, address them as: "You".
            - If you think you have a fun fact related to the question, you can include it in your feedback. Doing this will help the user by making things more memorable.
        `),
        functionName: "outputGrade",
        functionDescription: "Grade a fill-in-the-blank question",
        functionParameters: z.object({
            grade0To100: z
                .number()
                .min(0)
                .max(100)
                .describe("The grade, from 0 to 100"),
            explanation: z
                .string()
                .describe("An explanation given to the user about why they received the grade they did."),
            // funFact: z
            //     .string()
            //     .optional()
            //     .describe(
            //     "An optional (RELATED!) fun fact to be displayed to the user after they answer the question."
            //     ),
        }),
        otherMessages: [
            ...result.messages.map((m) => {
                return {
                    ...m,
                    content: trimLines(`
                        ${m.role === "user" ? "(USER):" : `${m.characterName}:`}

                        ${m.content}
                    `),
                };
            }),
        ].map(RESIChatMessageToVercelMessage),
    });

    return gradeResult;
}