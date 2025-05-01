import {z} from "zod";

import {
  trimAllLines,
  trimLines,
} from "@lukebechtel/lab-ts-utils";
import {ChooseTheBlankActivityConfig} from "@reasonote/activity-definitions";
import { CoreMessage } from "ai";
import {aib} from "@/clientOnly/ai/aib";
export async function gradeChooseTheBlankActivity(data: ChooseTheBlankActivityConfig, userAnswers: string[]){
    const baseParams = {
        prompt: trimLines(`
            <TASK> 
                You are an excellent, detail-oriented grader who is great at giving feedback to users.
                You are responsible for grading the user's answer to the following choose-the-blank question:
                \`\`\`json
                ${JSON.stringify(data, null, 2)}
                \`\`\`
            </TASK>

            <NOTES>
                - When you give feedback to the user, address them as: "You".
                - If you think you have a fun fact related to the question, you can include it in your feedback. Doing this will help the user by making things more memorable.
                - If you think the user's answer is correct, give them full credit.
                - When the order of the words in a blank do not matter, you should not penalize the user for the order of the words in their answer.
            </NOTES>

            <GRADING>
                - The grade should be a number between 0 and 100.
                - The short explanation should be at most 2 sentences. It should clearly and concisely explain why the user got the question right or wrong.
                - The explanation should be a detailed explanation of why the user got the question right or wrong. It should offer the user insight into how to improve their answer next time.
                - We should also give a grade for each of the hidden words or phrases (these should generally be either 0 or 100).
            </GRADING>

            <INPUT_FORMAT>
                - The input will be a sentence with some words or phrases hidden.
                - The hidden words or phrases will be wrapped in <span id="hidden-word-X"> tags, where X is a number starting at 1 and incrementing by 1 for each hidden word or phrase.
                - The user answers will be wrapped in <HIDDEN_WORD_X> tags, where X is the same number as the hidden word or phrase.
            </INPUT_FORMAT>

            <OUTPUT_FORMAT>
                - The output should be a JSON object with the following fields:
                - grade0To100: The grade, from 0 to 100.
                - shortExplanation: A short 1 sentence explanation given to the user explaining why the user got the question right or wrong. If the answer was right, this could be one fun fact. If the answer was wrong, this should be a hint for next time.
                - explanation: A 2-3 sentence explanation given to the user for why the user got the question right or wrong. Once again, if the answer was right, this could be one fun fact. If the answer was wrong, this should be a hint for next time.
                - gradePerBlank: an array of scores between 0 and 100, one for each of the hidden words or phrases.
            </OUTPUT_FORMAT>

            <EXAMPLES>
                <GOOD_EXAMPLE>
                    <INPUT>
                        <SENTENCE>
                            "<span id="hidden-word-1">Paris</span> is the capital of France."
                        </SENTENCE>
                        <USER_ANSWER>
                            <HIDDEN_WORD_1>Paris</HIDDEN_WORD_1>
                        </USER_ANSWER>
                    </INPUT>
                    <OUTPUT>
                        <GRADE_0_TO_100>
                            100
                        </GRADE_0_TO_100>
                        <SHORT_EXPLANATION>
                            "Did you know that the Eiffel Tower in Paris is 330 meters tall?"
                        </SHORT_EXPLANATION>
                        <EXPLANATION>
                            "Paris is indeed the capital of France. Paris is also known for its beautiful architecture, including the 330m tall Eiffel Tower."
                        </EXPLANATION>
                        <GRADE_PER_BLANK>
                            [100]
                        </GRADE_PER_BLANK>
                    </OUTPUT>
                </GOOD_EXAMPLE>

                <GOOD_EXAMPLE>
                    <INPUT>
                        <SENTENCE>
                            "<span id="hidden-word-1">Paris</span> is the capital of France."
                        </SENTENCE>
                        <USER_ANSWER>
                            <HIDDEN_WORD_1>London</HIDDEN_WORD_1>
                        </USER_ANSWER>
                    </INPUT>
                    <OUTPUT>
                        <GRADE_0_TO_100>
                            0
                        </GRADE_0_TO_100>
                        <SHORT_EXPLANATION>
                            "Paris is the capital of France, not London."
                        </SHORT_EXPLANATION>
                        <EXPLANATION>
                            "London is the capital of England, Paris is the capital of France."
                        </EXPLANATION>
                        <GRADE_PER_BLANK>
                            [0]
                        </GRADE_PER_BLANK>
                    </OUTPUT>
                </GOOD_EXAMPLE>

                <GOOD_EXAMPLE>
                    <INPUT>
                        <SENTENCE>
                            "<span id="hidden-word-1">Paris</span> is the capital of France."
                        </SENTENCE>
                        <USER_ANSWER>
                            <HIDDEN_WORD_1>Rome</HIDDEN_WORD_1>
                        </USER_ANSWER>
                    </INPUT>
                    <OUTPUT>
                        <GRADE_0_TO_100>
                            0
                        </GRADE_0_TO_100>
                        <SHORT_EXPLANATION>
                            "Paris is the capital of France, not Rome."
                        </SHORT_EXPLANATION>
                        <EXPLANATION>
                            "Rome is the capital of Italy, Paris is the capital of France."
                        </EXPLANATION>
                        <GRADE_PER_BLANK>
                            [0]
                        </GRADE_PER_BLANK>
                    </OUTPUT>
                </GOOD_EXAMPLE>
            
                <GOOD_EXAMPLE>
                    <INPUT>
                        <SENTENCE>
                            "The French flag has 3 colors: <span id="hidden-word-1">Blue</span>, <span id="hidden-word-2">White</span>, and <span id="hidden-word-3">Red</span>."
                        </SENTENCE>
                        <USER_ANSWER>
                            <HIDDEN_WORD_1>Blue</HIDDEN_WORD_1>
                            <HIDDEN_WORD_2>White</HIDDEN_WORD_2>
                            <HIDDEN_WORD_3>Red</HIDDEN_WORD_3>
                        </USER_ANSWER>
                    </INPUT>
                    <OUTPUT>
                        <GRADE_0_TO_100>
                            100
                        </GRADE_0_TO_100>
                        <SHORT_EXPLANATION>
                            "Did you know that the latest French flag was created in 1789?"
                        </SHORT_EXPLANATION>
                        <EXPLANATION>
                            "The French flag indeed has 3 colors: Blue, White, and Red. The french flag, also known as le Tricolore, originated during the French Revolution and was created in 1789."
                        </EXPLANATION>
                        <GRADE_PER_BLANK>
                            [100, 100, 100]
                        </GRADE_PER_BLANK>
                    </OUTPUT>
                </GOOD_EXAMPLE>

                <GOOD_EXAMPLE>
                    <INPUT>
                        <SENTENCE>
                            "The French flag has 3 colors: <span id="hidden-word-1">Blue</span>, <span id="hidden-word-2">White</span>, and <span id="hidden-word-3">Red</span>."
                        </SENTENCE>
                        <USER_ANSWER>
                            <HIDDEN_WORD_1>Blue</HIDDEN_WORD_1>
                            <HIDDEN_WORD_2>White</HIDDEN_WORD_2>
                            <HIDDEN_WORD_3>Green</HIDDEN_WORD_3>
                        </USER_ANSWER>
                    </INPUT>
                    <OUTPUT>
                        <GRADE_0_TO_100>
                            66
                        </GRADE_0_TO_100>
                        <SHORT_EXPLANATION>
                            "The French flag does not have green."
                        </SHORT_EXPLANATION>
                        <EXPLANATION>
                            "The French flag does not have green. The three colors of the French flag are Blue, White, and Red."
                        </EXPLANATION>
                        <GRADE_PER_BLANK>
                            [100, 100, 0]
                        </GRADE_PER_BLANK>
                    </OUTPUT>
                </GOOD_EXAMPLE>

                <GOOD_EXAMPLE>
                    <INPUT>
                        <SENTENCE>
                            "The French flag has 3 colors: <span id="hidden-word-1">Blue</span>, <span id="hidden-word-2">White</span>, and <span id="hidden-word-3">Red</span>."
                        </SENTENCE>
                        <USER_ANSWER>
                            <HIDDEN_WORD_1>White</HIDDEN_WORD_1>
                            <HIDDEN_WORD_2>Blue</HIDDEN_WORD_2>
                            <HIDDEN_WORD_3>Red</HIDDEN_WORD_3>
                        </USER_ANSWER>
                    </INPUT>
                    <OUTPUT>
                        <GRADE_0_TO_100>
                            100
                        </GRADE_0_TO_100>
                        <SHORT_EXPLANATION>
                            "The French flag is Blue, White, and Red."
                        </SHORT_EXPLANATION>
                        <EXPLANATION>
                            "The three colors of the French flag are Blue, White, and Red. The order of the colors is different, but the colors are the same."
                        </EXPLANATION>
                        <GRADE_PER_BLANK>
                            [100, 100, 100]
                        </GRADE_PER_BLANK>
                    </OUTPUT>
                </GOOD_EXAMPLE>

                <GOOD_EXAMPLE>
                    <INPUT>
                        <SENTENCE>
                            "The French flag has 3 colors: <span id="hidden-word-1">Blue</span>, <span id="hidden-word-2">White</span>, and <span id="hidden-word-3">Red</span>."
                        </SENTENCE>
                        <USER_ANSWER>
                            <HIDDEN_WORD_1>Orange</HIDDEN_WORD_1>
                            <HIDDEN_WORD_2>Green</HIDDEN_WORD_2>
                            <HIDDEN_WORD_3>Purple</HIDDEN_WORD_3>
                        </USER_ANSWER>
                    </INPUT>
                    <OUTPUT>
                        <GRADE_0_TO_100>
                            0
                        </GRADE_0_TO_100>
                        <SHORT_EXPLANATION>
                            "The French flag does not have orange, green, or purple."
                        </SHORT_EXPLANATION>
                        <EXPLANATION>
                            "The French flag does not have orange, green, or purple. The three colors of the French flag are Blue, White, and Red."
                        </EXPLANATION>
                        <GRADE_PER_BLANK>
                            [0, 0, 0]
                        </GRADE_PER_BLANK>
                    </OUTPUT>
                </GOOD_EXAMPLE>
            </EXAMPLES>
        `),
        schema: z.object({
            grade0To100: z
                .number()
                .describe("The grade, from 0 to 100"),
            shortExplanation: z
                .string()
                .describe(
                    "A short 1-2 sentence explanation given to the user explaining why the user got the question right or wrong. If the answer was right, this could be one fun fact. If the answer was wrong, this should be a hint for next time."
                ),
            explanation: z
                .string()
                .describe(
                "An explanation given to the user for why the user got the question right or wrong. This should be a detailed explanation, and should offer the user insight into how to improve their answer next time."
                ),
            gradePerBlank: z.array(z.number()).describe("An array of scores between 0 and 100, one for each of the hidden words or phrases."),
        }),
        model: 'openai:gpt-4o-mini',
        mode: 'json',
        providerArgs: {
            structuredOutputs: true,
        },
    } as const;

    const messages = [{
        role: "user",
        content: trimAllLines(`
            <SENTENCE>
                ${data.text}
            </SENTENCE>
            <USER_ANSWERS>
                ${userAnswers
                    .map((answer, idx) => {
                        return `<HIDDEN_WORD_${idx + 1}>${answer}</HIDDEN_WORD_${idx + 1}>`;
                    })
                    .join("\n")}
            </USER_ANSWERS>
        `)
    }]

    const gradeResult = await aib.genObject({
        ...baseParams,
        messages: messages as CoreMessage[]
    });
    
    return gradeResult;
}