import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  FillInTheBlankActivityConfig,
  FillInTheBlankActivityConfigSchemav0_0_1,
  FillInTheBlankResult,
  FillInTheBlankSubmitResult,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class FillInTheBlankActivityTypeServerV2 extends ActivityTypeServerV2<FillInTheBlankActivityConfig, FillInTheBlankSubmitResult> {
    static readonly type = 'fill-in-the-blank' as const;
    readonly type = FillInTheBlankActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: FillInTheBlankActivityConfigSchemav0_0_1,
            shortDescription: 'A fill-in-the-blank activity where students type in their answers',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a fill-in-the-blank activity">
                    <OVERVIEW>
                        Generate a fill-in-the-blank activity where students need to type in the correct words to complete the text.
                        The text should be educational and relevant to the topic.
                        Questions can be focused and concise, or more comprehensive with multiple blanks.
                        Use tasteful markdown formatting for emphasis (i.e. *italics*), to make the activity more engaging.
                    </OVERVIEW>

                    <QUESTION_STYLES description="Different valid approaches to questions">
                        - Focused questions with concrete examples (e.g. "In the code \`x = 5\`, \`x\` is a <span id="hidden-word-1">variable</span>")
                        - Comprehensive questions that test multiple related concepts
                        - Questions that test understanding through practical examples
                        Choose the style that best fits the concept being tested.
                    </QUESTION_STYLES>

                    <HIDDEN_WORDS description="Guidelines for selecting words to hide">
                        - Choose key terms or concepts that test understanding
                        - Select words that are central to the topic
                        - Pick terms that demonstrate comprehension when used correctly
                        - Number of blanks can vary (1-3) based on the question style
                        - MUST wrap hidden words in <span> tags with id="hidden-word-N" where N is the blank number
                        - Include the actual answer word inside the span tags
                    </HIDDEN_WORDS>

                    <CONTENT_GUIDELINES description="Guidelines for creating effective questions">
                        <FOCUS_ON_KEY_CONCEPTS>Target critical knowledge or skills rather than trivial facts.</FOCUS_ON_KEY_CONCEPTS>
                        <CLARITY>Ensure the question is clear, concise, and easily understandable.</CLARITY>
                        <SINGLE_ANSWER>Design each blank so there's only one correct or best answer.</SINGLE_ANSWER>
                        <CONTEXTUAL_CLUES>Provide sufficient information for an educated guess, but not so much that the answer becomes obvious.</CONTEXTUAL_CLUES>
                        <AVOID_GUESSWORK>Structure the question so it's not easy to guess the answer without proper knowledge.</AVOID_GUESSWORK>
                        <OBVIOUS_TO_KNOWLEDGEABLE>The word(s) you choose to blank out should be obvious to a person who knows the subject well.</OBVIOUS_TO_KNOWLEDGEABLE>
                    </CONTENT_GUIDELINES>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When testing vocabulary comprehension',
                'When checking understanding of key concepts',
                'When practicing proper word usage in context',
                'For reading comprehension exercises',
                'When exact wording or spelling is important'
            ],
            whenToAvoid: [
                'When multiple correct answers are possible',
                'When testing complex problem-solving skills',
                'When open-ended responses are needed',
                'When the concept requires long-form explanation',
                'When testing mathematical calculations'
            ],
            examples: [{
                name: "programming_example_focused",
                input: "Generate a fill-in-the-blank activity about Python variables",
                outputs: [{   
                    name: "good_example_focused",
                    quality: "good",
                    output: {
                        text: "In the *Python* code snippet `x = 5`, `x` is best referred to as a <span id=\"hidden-word-1\">variable</span>.",
                    },
                    explanation: "This is a good example because it:\n- Uses a concrete, focused code example\n- Tests a specific concept without over-explaining\n- Uses proper code formatting\n- Uses correct span tag format\n- Is clear and concise while being educational"
                }, {
                    name: "bad_example_overexplained",
                    quality: "bad",
                    output: {
                        text: "A _____ is something that stores data in memory and can change its value during program execution. For example, when we write x = 5, we are creating one.",
                    },
                    explanation: "This is a poor example because it:\n- Over-explains the concept instead of testing it\n- Lacks proper code formatting\n- Missing span tags\n- Too verbose and gives away the answer\n- Reads like a definition rather than a practical test"
                }]
            }, {
                name: "programming_example_comprehensive",
                input: "Generate a fill-in-the-blank activity about Python list comprehensions",
                outputs: [{   
                    name: "good_example_comprehensive",
                    quality: "good",
                    output: {
                        text: "In the *Python* programming language, ```python\nx = [i * 2 for i in range(5)]\n``` is an example of a <span id=\"hidden-word-1\">list comprehension</span>. This powerful feature combines a <span id=\"hidden-word-2\">loop</span> and list creation into a single line of code.",
                    },
                    explanation: "This is a good example because it:\n- Tests multiple related concepts\n- Uses proper code formatting\n- Provides helpful context where needed\n- Uses correct span tag format\n- Builds on basic concepts to test deeper understanding"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <TEXT_QUALITY description="Ensuring the text is well-structured">
                        - Text should be clear and concise
                        - Include context appropriate to the question style
                        - Use proper formatting for code and emphasis
                        - VERIFY all hidden words are wrapped in proper span tags
                    </TEXT_QUALITY>

                    <ANSWER_VALIDATION description="Validating answers">
                        - Each blank should have exactly one correct answer
                        - Answers should be specific and unambiguous
                        - Avoid blanks that could have multiple valid answers
                        - Consider common spelling variations or synonyms that might be valid
                    </ANSWER_VALIDATION>

                    <DIFFICULTY_BALANCE description="Maintaining appropriate difficulty">
                        - Questions should test understanding, not definitions
                        - Prefer practical examples over theoretical explanations
                        - Context should be sufficient but not excessive
                        - Ensure answers can be reasonably typed by students
                    </DIFFICULTY_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    override postProcessConfig = async ({config, request, ai}: {config: FillInTheBlankActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<FillInTheBlankActivityConfig> => {
        return config;
    }

    createEmptyConfig(): FillInTheBlankActivityConfig {
        return {
            version: "0.0.1",
            type: this.type,
            text: "",
        };
    }

    async getCompletedTip(result: FillInTheBlankResult): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }

    override evaluateConfig = async ({config, request, ai}: {config: FillInTheBlankActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                            Your task is to evaluate if the generated activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If a question effectively tests understanding of a concept, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to questions that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused question with a concrete example is often better than a complex one
                                - If a question makes students think about the right concept, it's working
                                - One well-chosen blank is better than multiple forced ones
                                - Practical examples (like code) are better than theoretical ones
                                - Repeated hidden words are fine if each instance reinforces learning
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing/broken span tags for hidden words
                                - Hidden words that could have multiple DIFFERENT valid answers
                                - Text that explicitly gives away the answer
                                - Technical errors that make the question incorrect
                                - Answers that are unreasonably long or complex to type
                                
                                <IMPORTANT_NOTE description="What NOT to flag as issues">
                                    - Do NOT flag repeated hidden words (same word in multiple blanks) as an issue
                                    - This is actually desirable when it reinforces the concept
                                    - Example: "A <span>foo</span> is used for baz, and bar. It is also has its own subject of study -- the field of <span>foo</span>ology."
                                </IMPORTANT_NOTE>
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass questions that have these">
                                - Clear concrete example (like a code snippet)
                                - Proper span tag formatting
                                - Tests a specific concept
                                - Has unambiguous answers (note: same word in multiple blanks is fine)
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more blanks
                                - Could have more context
                                - Question is too focused/simple
                                - Could test deeper understanding
                                - Could be more comprehensive
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a fill-in-the-blank activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad fill-in-the-blank activities">
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
                            <TEXT>${config.text}</TEXT>
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

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: FillInTheBlankActivityConfig, userAnswer: {userAnswers: string[]}, ai: AI}): Promise<FillInTheBlankSubmitResult> => {
        // Extract hidden words from the text
        const hiddenWordsRegex = /<span id="hidden-word-(\d+)">([^<]+)<\/span>/g;
        const hiddenWords: {index: number, word: string}[] = [];
        let match;
        
        while ((match = hiddenWordsRegex.exec(config.text)) !== null) {
            hiddenWords.push({
                index: parseInt(match[1]),
                word: match[2].trim().toLowerCase()
            });
        }
        
        // Sort hidden words by index
        hiddenWords.sort((a, b) => a.index - b.index);
        
        // Get user answers
        const userAnswers = Array.isArray(userAnswer.userAnswers) ? userAnswer.userAnswers : [userAnswer.userAnswers];
        
        // Check if we have the right number of answers
        if (userAnswers.length !== hiddenWords.length) {
            return {
                shortFeedback: `Expected ${hiddenWords.length} answers, but got ${userAnswers.length}.`,
                score: 0,
                details: {
                    explanation: `Expected ${hiddenWords.length} answers, but got ${userAnswers.length}.`,
                    gradePerWord: []
                }
            };
        }
        
        // Generate feedback using AI for more detailed explanation and grading
        const gradeResult = await ai.genObject({
            model: 'openai:gpt-4o',
            schema: z.object({
                grade0To100: z
                    .number()
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
                gradePerWord: z.array(z.object({
                    hiddenWord: z.string().describe("The word that was hidden in the question"),
                    userAnswer: z.string().describe("The user's answer to the question"),
                    grade0To100: z.number().describe("The grade, from 0 to 100"),
                    explanation: z.string().describe("Explanation of why this answer is correct or incorrect")
                })).describe("The individual grade for each word in the question."),
            }),
            messages: [
                {
                    role: 'system',
                    content: `
                        # You
                        You are an excellent, detail-oriented grader.

                        # Your Task
                        You are responsible for grading the user's answer to the following fill-in-the-blank question:
                        \`\`\`json
                        ${JSON.stringify(config, null, 2)}
                        \`\`\`

                        You have the ability to give partial credit. The expectation is *not* that the user gets the exact wording of the answer, but that they get the *meaning* of the answer.

                        # Notes
                        - When you give feedback to the user, address them as: "You".
                        - If you think you have a fun fact related to the question, you can include it in your feedback. Doing this will help the user by making things more memorable.
                    `
                },
                {
                    role: 'user',
                    content: `
                        # MY ANSWERS:
                        ${userAnswers
                            .map((answer, idx) => {
                                return `Blank ${idx + 1} Answer: "${answer}" (Expected: "${hiddenWords[idx].word}")`;
                            })
                            .join("\n")}
                    `
                }
            ],
            providerArgs: {
                structuredOutputs: true,
            },
        });
    
        return {
            score: gradeResult.object.grade0To100 * .01,
            shortFeedback: gradeResult.object.shortExplanation,
            details: {
                explanation: gradeResult.object.explanation,
                gradePerWord: gradeResult.object.gradePerWord
            }
        };
    }
} 