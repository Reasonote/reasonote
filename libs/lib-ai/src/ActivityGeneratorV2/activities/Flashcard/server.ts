import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  FlashcardActivityConfig,
  FlashcardActivityConfigSchema,
  FlashcardResult,
  FlashcardSubmitRequest,
  FlashcardSubmitResult,
  FlashcardSubmitResultDetails,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class FlashcardActivityTypeServerV2 extends ActivityTypeServerV2<FlashcardActivityConfig, FlashcardSubmitResult> {
    static readonly type = 'flashcard' as const;
    readonly type = FlashcardActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: FlashcardActivityConfigSchema.extend({
                type: z.literal(this.type),
            }),
            shortDescription: 'A flashcard activity where students see a prompt and then reveal the answer',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a flashcard activity">
                    <OVERVIEW>
                        Generate a flashcard with a clear front (prompt/question) and back (answer/explanation).
                        The content should be educational and relevant to the topic.
                        Use tasteful markdown formatting for emphasis (i.e. *italics*) and proper formatting for code or math.
                    </OVERVIEW>

                    <CARD_FRONT description="Guidelines for the front of the flashcard">
                        - Should be clear and concise
                        - Can be a question, term, or concept
                        - Use proper formatting for code snippets with \`backticks\` or \`\`\`code blocks\`\`\`
                        - For math, use LaTeX with $$...$$
                        - Length should be reasonable (1-3 sentences)
                        - Should prompt specific, testable knowledge
                    </CARD_FRONT>

                    <CARD_BACK description="Guidelines for the back of the flashcard">
                        - Should directly answer the front
                        - Can include brief explanations or examples
                        - Use proper formatting for code or math
                        - Keep it focused and relevant
                        - Avoid unnecessary verbosity
                        - Can include key points in bullet form if appropriate
                    </CARD_BACK>

                    <METADATA description="Guidelines for metadata">
                        <SUBSKILLS>
                            Break down the skills tested by this flashcard into specific subskills.
                            Title each like a Wikipedia article.
                        </SUBSKILLS>
                        <CHALLENGE_SUBSKILLS>
                            Identify 2-3 more advanced skills that would challenge a student who masters this card.
                        </CHALLENGE_SUBSKILLS>
                        <IMPROVE_SUBSKILLS>
                            Identify 2-3 foundational skills that would help a struggling student understand this card better.
                        </IMPROVE_SUBSKILLS>
                    </METADATA>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When testing vocabulary or terminology',
                'When practicing recall of key concepts',
                'For memorizing important facts or formulas',
                'When learning new definitions',
                'For reviewing core principles'
            ],
            whenToAvoid: [
                'When testing complex problem-solving',
                'When multiple concepts need to be connected',
                'When step-by-step processes need to be practiced',
                'When open-ended discussion is needed',
                'When testing application of knowledge'
            ],
            examples: [{
                name: "programming_example_term",
                input: "Generate a flashcard about Python variables",
                outputs: [{   
                    name: "good_example_term",
                    quality: "good",
                    output: {
                        flashcardFront: "What is a *variable* in Python?",
                        flashcardBack: "A variable is a named storage location that holds data. In Python, variables:\n- Are dynamically typed\n- Are created through assignment (e.g. \`x = 5\`)\n- Can store any type of data\n- Can be reassigned to different values",
                        metadata: {
                            subSkills: [
                                "Python Variable Declaration",
                                "Dynamic Typing in Python",
                                "Variable Assignment Syntax",
                                "Variable Naming Conventions"
                            ],
                            challengeSubSkills: [
                                "Python Memory Management",
                                "Variable Scope and Lifetime"
                            ],
                            improveSubSkills: [
                                "Basic Programming Concepts",
                                "Understanding Data Types"
                            ]
                        }
                    },
                    explanation: "This is a good example because it:\n- Has a clear, focused question\n- Provides a comprehensive but concise answer\n- Uses proper formatting\n- Includes relevant metadata\n- Breaks down the concept into key points"
                }, {
                    name: "bad_example_term",
                    quality: "bad",
                    output: {
                        flashcardFront: "Variables in programming",
                        flashcardBack: "Variables are used to store data and can change. They are very important in programming and you need them to make programs work properly.",
                    },
                    explanation: "This is a poor example because it:\n- Front is too vague\n- Back is too general and lacks specifics\n- Missing proper formatting\n- No concrete examples\n- Missing metadata\n- Doesn't teach anything specific"
                }]
            }, {
                name: "programming_example_code",
                input: "Generate a flashcard about Python list comprehensions",
                outputs: [{   
                    name: "good_example_code",
                    quality: "good",
                    output: {
                        flashcardFront: "What will this Python list comprehension produce?\n```python\n[x * 2 for x in range(3)]\n```",
                        flashcardBack: "The result will be:\n```python\n[0, 2, 4]\n```\n\nExplanation:\n- \`range(3)\` generates numbers 0, 1, 2\n- Each number is multiplied by 2\n- Results are collected into a new list",
                        metadata: {
                            subSkills: [
                                "Python List Comprehension Syntax",
                                "Range Function Usage",
                                "List Operations",
                                "Iteration in Python"
                            ],
                            challengeSubSkills: [
                                "Nested List Comprehensions",
                                "Generator Expressions"
                            ],
                            improveSubSkills: [
                                "Basic Python Lists",
                                "For Loops in Python"
                            ]
                        }
                    },
                    explanation: "This is a good example because it:\n- Uses a specific code example\n- Shows clear input and output\n- Explains the process step by step\n- Uses proper code formatting\n- Has relevant metadata"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <CONTENT_QUALITY description="Ensuring the content is well-structured">
                        - Front should be clear and specific
                        - Back should directly answer the front
                        - All code and math should be properly formatted
                        - Content should be accurate and educational
                    </CONTENT_QUALITY>

                    <METADATA_VALIDATION description="Validating metadata">
                        - SubSkills should be specific and relevant
                        - ChallengeSubSkills should be more advanced
                        - ImproveSubSkills should be foundational
                        - All skills should be properly titled
                    </METADATA_VALIDATION>

                    <DIFFICULTY_BALANCE description="Maintaining appropriate difficulty">
                        - Content should be challenging but achievable
                        - Explanations should be clear but not oversimplified
                        - Examples should illustrate key points
                        - Focus on one clear concept per card
                    </DIFFICULTY_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    override postProcessConfig = async ({config, request, ai}: {config: FlashcardActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<FlashcardActivityConfig> => {
        return config;
    }

    createEmptyConfig(): FlashcardActivityConfig {
        return {
            version: "0.0.0",
            type: this.type,
            flashcardFront: "",
            flashcardBack: "",
        };
    }

    async getCompletedTip(result: FlashcardResult): Promise<string | undefined> {    
        if (result?.feedback?.markdownFeedback) {
            return result.feedback.markdownFeedback;
        }
        return undefined;
    }

    override evaluateConfig = async ({config, request, ai}: {config: FlashcardActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                                If a flashcard effectively tests understanding of a concept, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to cards that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused card testing one concept is often better than a complex one
                                - If the front and back are clear and related, it's working
                                - Proper formatting of code and math is essential
                                - Metadata should be relevant but doesn't need to be perfect
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing/broken code or math formatting
                                - Front and back that don't clearly relate
                                - Technical errors or incorrect information
                                - Content that's too vague to be educational
                                - Front that gives away the answer
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass cards that have these">
                                - Clear, specific front
                                - Directly related, informative back
                                - Proper formatting
                                - Tests a specific concept
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more detail
                                - Could have more examples
                                - Could be more comprehensive
                                - Metadata could be more detailed
                                - Could be more challenging
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a flashcard activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad flashcard activities">
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
                            <FRONT>${config.flashcardFront}</FRONT>
                            <BACK>${config.flashcardBack}</BACK>
                            <METADATA>${JSON.stringify(config.metadata, null, 2)}</METADATA>
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

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: FlashcardActivityConfig, userAnswer: FlashcardSubmitRequest, ai: AI}): Promise<FlashcardSubmitResult> => {
        // Determine score based on attested level
        let score: number;
        switch (userAnswer.attestedLevel) {
            case 'BAD':
                score = 0.33;
                break;
            case 'OK':
                score = 0.67;
                break;
            case 'GREAT':
                score = 1;
                break;
            default:
                score = 0.5;
        }

        // Create details object with initialized subskills
        const details: FlashcardSubmitResultDetails = {
            subskills: {
                improveSubSkills: [],
                challengeSubSkills: []
            }
        };

        // Add subskills based on attested level
        if (userAnswer.attestedLevel === 'BAD' || userAnswer.attestedLevel === 'OK') {
            // For BAD or OK responses, add improve subskills from metadata if available
            if (config.metadata?.improveSubSkills?.length) {
                details.subskills!.improveSubSkills = config.metadata.improveSubSkills;
            } else if (config.metadata?.subSkills?.length) {
                // Fall back to general subSkills if improveSubSkills not available
                details.subskills!.improveSubSkills = config.metadata.subSkills;
            }
        } else if (userAnswer.attestedLevel === 'GREAT') {
            // For GREAT responses, add challenge subskills from metadata if available
            if (config.metadata?.challengeSubSkills?.length) {
                details.subskills!.challengeSubSkills = config.metadata.challengeSubSkills;
            } else if (config.metadata?.subSkills?.length) {
                // Fall back to general subSkills if challengeSubSkills not available
                details.subskills!.challengeSubSkills = config.metadata.subSkills;
            }
        }

        return {
            score,
            shortFeedback: `You rated your knowledge as ${userAnswer.attestedLevel.toLowerCase()}.`,
            details
        };
    }
} 