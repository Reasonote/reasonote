import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  ShortAnswerActivityConfig,
  ShortAnswerActivityConfigSchema,
  ShortAnswerResult,
  ShortAnswerSubmitRequest,
  ShortAnswerSubmitResult,
} from '@reasonote/activity-definitions';
import { latexFixer } from '@reasonote/ai-generators';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class ShortAnswerActivityTypeServerV2 extends ActivityTypeServerV2<ShortAnswerActivityConfig, ShortAnswerSubmitResult> {
    static readonly type = 'short-answer' as const;
    readonly type = ShortAnswerActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: ShortAnswerActivityConfigSchema,
            shortDescription: 'A short answer activity where students write a brief response to demonstrate understanding',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a short answer activity">
                    <OVERVIEW>
                        Create a short answer question that tests understanding of key concepts.
                        The question should be clear and specific, requiring a focused response.
                        Include clear grading criteria for evaluating responses.
                    </OVERVIEW>

                    <QUESTION description="Guidelines for creating the question">
                        - Should be clear and unambiguous
                        - Focus on one specific concept or idea
                        - Use proper formatting for code or math if needed
                        - Length should be reasonable (1-2 sentences)
                        - Should test understanding, not just recall
                        - Can include context or examples when needed
                    </QUESTION>

                    <GRADING_CRITERIA description="Guidelines for grading criteria">
                        - List key points that should be included in the answer
                        - Specify what makes an answer excellent vs. acceptable
                        - Include examples of good and poor responses
                        - Consider alternative valid approaches
                        - Define point allocation if applicable
                    </GRADING_CRITERIA>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When testing conceptual understanding',
                'For explaining processes or methods',
                'When multiple approaches are valid',
                'For demonstrating critical thinking',
                'When testing writing ability'
            ],
            whenToAvoid: [
                'When exact answers are required',
                'For simple fact recall',
                'When immediate feedback is crucial',
                'For very complex multi-step problems',
                'When objective scoring is required'
            ],
            examples: [{
                name: "programming_example_concept",
                input: "Generate a short answer question about Python variables",
                outputs: [{   
                    name: "good_example_concept",
                    quality: "good",
                    output: {
                        questionText: "Explain why Python is considered a *dynamically typed* language. Include a code example to support your explanation.",
                        gradingCriteria: `
                            Key points that must be addressed:
                            1. Definition of dynamic typing (variables can change types)
                            2. Contrast with static typing
                            3. Code example showing type changing
                            4. Practical implications

                            Example of excellent answer:
                            "Python is dynamically typed because variable types are determined at runtime and can change. Unlike statically typed languages where you declare types upfront, Python variables can hold different types of data at different times. For example:
                            x = 5          # x is an integer
                            x = 'hello'    # now x is a string
                            This flexibility makes Python more concise but requires careful attention to type changes."

                            Example of poor answer:
                            "Python is dynamic and variables can change."

                            Grading breakdown:
                            - Clear explanation of dynamic typing: 40%
                            - Valid code example: 30%
                            - Practical implications: 30%
                        `
                    },
                    explanation: "This is a good example because it:\n- Tests understanding of a key concept\n- Requires explanation and example\n- Has clear grading criteria\n- Specifies what makes good/poor answers\n- Uses proper formatting"
                }, {
                    name: "bad_example_concept",
                    quality: "bad",
                    output: {
                        questionText: "What is a variable?",
                        gradingCriteria: "Student should know what a variable is."
                    },
                    explanation: "This is a poor example because it:\n- Tests pure recall\n- Too basic/vague\n- Lacks specific grading criteria\n- No example answers\n- Could be multiple choice instead"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <QUESTION_QUALITY description="Ensuring the question is well-structured">
                        - Question is clear and specific
                        - Tests understanding, not just recall
                        - Uses proper formatting
                        - Appropriate length and complexity
                    </QUESTION_QUALITY>

                    <GRADING_CRITERIA_VALIDATION description="Validating grading criteria">
                        - Clear expectations for answers
                        - Examples of good/poor responses
                        - Specific point allocation
                        - Considers valid alternatives
                    </GRADING_CRITERIA_VALIDATION>

                    <DIFFICULTY_BALANCE description="Maintaining appropriate difficulty">
                        - Challenging but achievable
                        - Requires critical thinking
                        - Can be answered concisely
                        - Tests relevant skills
                    </DIFFICULTY_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): ShortAnswerActivityConfig {
        return {
            version: "0.0.0",
            type: this.type,
            questionText: "",
            gradingCriteria: ""
        };
    }

    async getCompletedTip(result: ShortAnswerResult): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }

    override postProcessConfig = async ({config, request, ai}: {config: ShortAnswerActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<ShortAnswerActivityConfig> => {
        const fixedLatexResult = await latexFixer({
            stringsToFix: [config.questionText, config.gradingCriteria]
        }, ai);

        if (fixedLatexResult.fixedLatexStrings.length > 0) {
            return {
                ...config,
                questionText: fixedLatexResult.fixedLatexStrings[0],
                gradingCriteria: fixedLatexResult.fixedLatexStrings[1]
            };
        }

        return config;
    }

    override evaluateConfig = async ({config, request, ai}: {config: ShortAnswerActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
        const genConfig = await this.getGenConfig(request, ai);
        
        // Get activity-specific instructions
        const primaryInstructions = await genConfig.primaryInstructions(request);
        const finalInstructions = await genConfig.finalInstructions?.(request);
        const context = await ai.prompt.activities.generateActivityContextString(request);

        const evaluationResponse = await ai.genObject({
            model: 'openai:gpt-4o-mini',
            schema: z.object({
                thinking: z.array(z.object({
                    reasoning: z.string().describe('The AI\'s reasoning for the issue'),
                    possibleIssue: z.string(),
                    severity: z.enum(['nit', 'minor', 'major', 'critical']),
                })).describe('Use this to think through the activity config provided, and to make sure your evaluation is thorough and accurate'),
                result: z.object({
                    isValid: z.boolean(),
                    issues: z.array(z.object({
                        issue: z.string().describe('The issue found with the activity'),
                        suggestedFix: z.string().nullable().describe('A suggested fix for the issue'),
                    })).nullable().describe('The issues found with the activity'),
                    generalFeedback: z.string().nullable().describe('General feedback about the activity'),
                }).describe('The final result of the evaluation'),
            }),
            messages: [
                {
                    role: 'system',
                    content: trimLines(`
                        <YOUR_TASK>
                            Your task is to evaluate if the generated short answer activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If a question effectively tests understanding and has clear grading criteria, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to questions that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused question testing one concept is often better than a complex one
                                - If the question and grading criteria are clear, it's working
                                - Proper formatting of code and math is essential
                                - Grading criteria should be clear but don't need to be exhaustive
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing/broken code or math formatting
                                - Question that could have multiple valid interpretations
                                - Missing or unclear grading criteria
                                - Technical errors or incorrect information
                                - Questions that test pure recall
                                - Questions that are too vague
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass questions that have these">
                                - Clear, specific question
                                - Tests understanding
                                - Has grading criteria
                                - Proper formatting
                                - Reasonable length
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more context
                                - Could have more examples
                                - Could be more challenging
                                - Grading criteria could be more detailed
                                - Could test deeper understanding
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a short answer activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad short answer activities">
                                ${genConfig.examples ? genConfig.examples.map((example, index) => formatExample(example, index)).join('\n') : 'No examples provided'}
                            </EXAMPLES>

                            <ACTIVITY_CONTEXT description="The context in which this activity was generated">
                                ${context}
                            </ACTIVITY_CONTEXT>

                            <FINAL_CHECKS description="Final requirements that must be met">
                                ${finalInstructions}
                            </FINAL_CHECKS>
                        </EVALUATION_CONTEXT>
                    `)
                },
                {
                    role: 'user',
                    content: trimLines(`
                        <ACTIVITY_TO_EVALUATE>
                            <QUESTION>${config.questionText}</QUESTION>
                            <GRADING_CRITERIA>${config.gradingCriteria}</GRADING_CRITERIA>
                        </ACTIVITY_TO_EVALUATE>
                    `)
                }
            ],
            mode: 'json',
            providerArgs: {
                structuredOutputs: true,
            },
        });

        return {
            isValid: evaluationResponse.object.result.isValid,
            feedback: {
                issues: evaluationResponse.object.result.issues,
                generalFeedback: evaluationResponse.object.result.generalFeedback,
            }
        };
    }

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: ShortAnswerActivityConfig, userAnswer: ShortAnswerSubmitRequest, ai: AI}): Promise<ShortAnswerSubmitResult> => {
        const gradeResult = await ai.tools.oneShotAI({
            systemMessage: trimLines(`
                # You
                You are an excellent, detail-oriented grader.

                # Your Task
                You are responsible for grading the user's answer to the following short-answer question:
                \`\`\`json
                ${JSON.stringify(config, null, 2)}
                \`\`\`

                You have the ability to give partial credit -- try to follow the grading criteria as closely as possible.

                # Notes
                - When you give feedback to the user, address them as: "You".
                - If you think you have a fun fact related to the question, you can include it in your feedback. Doing this will help the user by making things more memorable.
            `),
            functionName: "outputGrade",
            functionDescription: "Grade a short answer question",
            functionParameters: z.object({
                grade0To100: z
                    .number()
                    .min(0)
                    .max(100)
                    .describe("The grade, from 0 to 100"),
                shortExplanation: z
                    .string()
                    .describe(
                        "A short ~1-sentence explanation given to the user for why the user got the question right or wrong. If the answer was right, this could be one fun fact. If the answer was wrong, this should be a hint for next time."
                    ),
                explanation: z
                    .string()
                    .describe(
                    "An explanation given to the user for why the user got the question right or wrong."
                    ),
            }),
            otherMessages: [
                {
                    role: "user",
                    content: trimLines(`
                        # MY ANSWER:
                        ${userAnswer.userAnswer}
                    `),
                },
            ],
        });

        if (!gradeResult.success) {
            throw new Error(`Failed to grade short answer: ${gradeResult.error}`);
        }

        const gradeData = gradeResult.data;
 
        return {
            score: gradeData.grade0To100 * .01,
            shortFeedback: gradeData.shortExplanation,
            details: {
                shortExplanation: gradeData.shortExplanation,
                explanation: gradeData.explanation,
            }
        };
    };
} 