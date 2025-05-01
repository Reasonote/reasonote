import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  MultipleChoiceActivityConfig,
  MultipleChoiceActivityConfigSchemav1_0_0,
  MultipleChoiceActivityConfigv1_0_0,
  MultipleChoiceActivityTypeDefinition,
  MultipleChoiceResult,
  MultipleChoiceSubmitRequest,
  MultipleChoiceSubmitResult,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { ActivityRequestHydratedValues } from '../../types';

export class MultipleChoiceActivityTypeServerV2 extends ActivityTypeServerV2<MultipleChoiceActivityConfig, MultipleChoiceSubmitResult> {
    static readonly type = 'multiple-choice' as const;
    readonly type = MultipleChoiceActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: MultipleChoiceActivityConfigSchemav1_0_0,
            shortDescription: 'A multiple choice activity where students select the correct answer from a list of options',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a multiple choice activity">
                    <OVERVIEW>
                        Generate a multiple choice question with a clear question and set of answer choices.
                        The content should be educational and relevant to the topic.
                        Use tasteful markdown formatting for emphasis (i.e. *italics*) and proper formatting for code or math.
                    </OVERVIEW>

                    <QUESTION description="Guidelines for the question">
                        - Should be clear and specific
                        - Can include code snippets or mathematical expressions
                        - Use proper formatting (backticks for code, $$...$$ for math)
                        - Length should be reasonable (1-3 sentences)
                        - Should test understanding, not just recall
                        - Can include examples or context when needed
                    </QUESTION>

                    <ANSWER_CHOICES description="Guidelines for answer choices">
                        - Provide 3-5 answer choices
                        - One choice must be clearly correct
                        - Other choices should be plausible distractors
                        - All choices should be relevant to the topic
                        - Avoid obviously wrong answers
                        - Keep similar length and structure across choices
                        - Use proper formatting for code or math if needed
                        - Ensure all answer choices are unique and distinct from each other
                    </ANSWER_CHOICES>

                    <FOLLOW_UPS description="Guidelines for answer choice follow-ups">
                        - For correct answer: provide a brief reinforcing fact or explanation
                        - For incorrect answers: give a helpful tip about why this choice is wrong
                        - Keep follow-ups concise (one sentence)
                        - Make follow-ups educational and constructive
                        - Use proper formatting if needed
                    </FOLLOW_UPS>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When testing understanding of concepts',
                'When multiple plausible options exist',
                'For reviewing key terminology',
                'When testing application of knowledge',
                'For assessing problem-solving steps'
            ],
            whenToAvoid: [
                'When exact wording is critical',
                'When multiple answers could be correct',
                'When testing writing or explanation skills',
                'When step-by-step work needs to be shown',
                'When testing recall of specific facts'
            ],
            examples: [{
                name: "programming_example_concept",
                input: "Generate a multiple choice question about Python variables",
                outputs: [{   
                    name: "good_example_concept",
                    quality: "good",
                    output: {
                        question: "What will be the value of `x` after executing the following Python code?\n```python\nx = 5\nx += 3\nx *= 2\n```",
                        answerChoices: [
                            "16",
                            "13",
                            "11",
                            "8"
                        ],
                        correctAnswer: "16",
                        answerChoiceFollowUps: [
                            {
                                answerChoice: "16",
                                followUp: "Correct! The operations are performed in sequence: 5 + 3 = 8, then 8 * 2 = 16."
                            },
                            {
                                answerChoice: "13",
                                followUp: "Remember that `*=` performs multiplication, not addition."
                            },
                            {
                                answerChoice: "11",
                                followUp: "Try breaking down each operation step by step to track the value changes."
                            },
                            {
                                answerChoice: "8",
                                followUp: "Don't forget the final multiplication operation (`*= 2`)."
                            }
                        ]
                    },
                    explanation: "This is a good example because it:\n- Tests understanding, not just recall\n- Uses proper code formatting\n- Has plausible distractors\n- Includes helpful follow-ups\n- Requires step-by-step thinking"
                }, {
                    name: "bad_example_concept",
                    quality: "bad",
                    output: {
                        question: "What is a variable?",
                        answerChoices: [
                            "A place to store data",
                            "A number",
                            "A word",
                            "None of the above"
                        ],
                        correctAnswer: "A place to store data",
                    },
                    explanation: "This is a poor example because it:\n- Tests pure recall\n- Too basic/vague\n- Distractors aren't plausible\n- Missing follow-ups\n- No practical context"
                }]
            }, {
                name: "programming_example_application",
                input: "Generate a multiple choice question about Python list operations",
                outputs: [{   
                    name: "good_example_application",
                    quality: "good",
                    output: {
                        question: "Which Python list operation would you use to *efficiently* remove the last element from a list `numbers` and get its value?",
                        answerChoices: [
                            "numbers.pop()",
                            "numbers.remove(-1)",
                            "del numbers[-1]",
                            "numbers = numbers[:-1]"
                        ],
                        correctAnswer: "numbers.pop()",
                        answerChoiceFollowUps: [
                            {
                                answerChoice: "numbers.pop()",
                                followUp: "Correct! `pop()` removes and returns the last element in O(1) time."
                            },
                            {
                                answerChoice: "numbers.remove(-1)",
                                followUp: "`remove()` searches for the value -1, not the last position."
                            },
                            {
                                answerChoice: "del numbers[-1]",
                                followUp: "`del` removes the element but doesn't return its value."
                            },
                            {
                                answerChoice: "numbers = numbers[:-1]",
                                followUp: "This creates a new list copy without the last element, less efficient than `pop()`."
                            }
                        ]
                    },
                    explanation: "This is a good example because it:\n- Tests practical knowledge\n- Considers efficiency\n- Has plausible alternatives\n- Includes educational follow-ups\n- Uses proper formatting"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <CONTENT_QUALITY description="Ensuring the content is well-structured">
                        - Question should be clear and unambiguous
                        - All code and math should be properly formatted
                        - Content should be accurate and educational
                        - Answer choices should be properly formatted
                    </CONTENT_QUALITY>

                    <ANSWER_CHOICE_VALIDATION description="Validating answer choices">
                        - One answer must be clearly correct
                        - Distractors should be plausible
                        - All choices should be relevant
                        - Follow-ups should be helpful
                        - All answer choices must be unique with no duplicates
                    </ANSWER_CHOICE_VALIDATION>

                    <DIFFICULTY_BALANCE description="Maintaining appropriate difficulty">
                        - Question should test understanding
                        - Distractors should challenge but not trick
                        - Context should be sufficient
                        - Follow-ups should aid learning
                    </DIFFICULTY_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): MultipleChoiceActivityConfigv1_0_0 {
        return {
            version: "1.0.0",
            type: this.type,
            question: "",
            answerChoices: [],
        };
    }

    async getCompletedTip(result: MultipleChoiceResult): Promise<string | undefined> {    
        if (result?.feedback?.markdownFeedback) {
            return result.feedback.markdownFeedback;
        }
        return undefined;
    }

    override postProcessConfig = async ({config, request, ai}: {config: MultipleChoiceActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<MultipleChoiceActivityConfig> => {
        // First, convert any config to v1.0.0
        const configV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(config);
        
        // Now apply deduplication logic for v1.0.0 format
        const textToChoiceMap = new Map();
        
        // Keep track of which choices are correct
        const correctChoices = new Set();
        
        // Process each answer choice
        for (const choice of configV1.answerChoices) {
            // If we haven't seen this text before, add it to the map
            if (!textToChoiceMap.has(choice.text)) {
                textToChoiceMap.set(choice.text, choice);
                
                // If this choice is correct, mark it
                if (choice.isCorrect) {
                    correctChoices.add(choice.text);
                }
            } else {
                // If we've seen this text before, update the existing entry if needed
                const existingChoice = textToChoiceMap.get(choice.text);
                
                // If the current choice is correct but the existing one isn't, update it
                if (choice.isCorrect && !existingChoice.isCorrect) {
                    textToChoiceMap.set(choice.text, choice);
                    correctChoices.add(choice.text);
                }
                
                // If the current choice has a followUp but the existing one doesn't, update it
                if (choice.followUp && !existingChoice.followUp) {
                    existingChoice.followUp = choice.followUp;
                }
            }
        }
        
        // Convert the map values back to an array
        const uniqueAnswerChoices = Array.from(textToChoiceMap.values());
        
        // Make sure at least one answer is marked as correct
        if (correctChoices.size === 0 && uniqueAnswerChoices.length > 0) {
            // If no correct answers, mark the first one as correct
            uniqueAnswerChoices[0].isCorrect = true;
        }
        
        return {
            ...configV1,
            answerChoices: uniqueAnswerChoices
        };
    }

    override evaluateConfig = async ({config, request, ai}: {config: MultipleChoiceActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
        // First, convert any config to v1.0.0
        const configV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(config);
        
        // Generate a context string for the activity
        const contextString = await ai.prompt.activities.generateActivityContextString(request);

        // Prepare the evaluation prompt
        const evaluationPrompt = trimLines(`
            <EVALUATION_TASK>
                Evaluate the quality of this multiple choice question for ${contextString}.
                
                <MULTIPLE_CHOICE_QUESTION>
                    ${JSON.stringify(configV1, null, 2)}
                </MULTIPLE_CHOICE_QUESTION>
                
                <EVALUATION_INSTRUCTIONS>
                    Analyze the question for clarity, correctness, and educational value.
                    
                    <CORE_PRINCIPLE>
                        If a question effectively tests understanding of a concept, it should be marked as valid,
                        even if you can think of ways it could be marginally improved.
                        DO NOT suggest improvements to questions that are already working well.
                    </CORE_PRINCIPLE>

                    <EVALUATION_PRINCIPLES>
                        - A focused question testing one concept is often better than a complex one
                        - If the question and choices are clear, it's working
                        - Proper formatting of code and math is essential
                        - Follow-ups should be helpful but aren't critical
                    </EVALUATION_PRINCIPLES>

                    <CRITICAL_ISSUES description="ONLY flag these as problems">
                        - Missing/broken code or math formatting
                        - Multiple possible correct answers
                        - No clear correct answer
                        - Technical errors or incorrect information
                        - Question that gives away the answer
                        - Completely implausible distractors
                        - Duplicate answer choices
                    </CRITICAL_ISSUES>
                </EVALUATION_INSTRUCTIONS>
                
                <EVALUATION_CRITERIA>
                    1. Is the question clear and well-formulated?
                    2. Is there exactly one correct answer?
                    3. Are the distractors plausible but clearly incorrect?
                    4. Is the question at an appropriate difficulty level?
                    5. Does the question test understanding rather than just recall?
                    6. Are code snippets or mathematical expressions properly formatted?
                    7. Are the follow-ups helpful and informative?
                </EVALUATION_CRITERIA>
                
                <OUTPUT_FORMAT>
                    {
                        "thinking": [
                            {
                                "reasoning": string, // Your analysis of one aspect of the question
                                "possibleIssue": string, // Potential issue identified, or "None" if no issue
                                "severity": "critical" | "major" | "minor" | "nit" // How serious the issue is
                            },
                            // Additional thinking objects as needed
                        ],
                        "result": {
                            "isValid": boolean, // Whether the question is valid and ready to use
                            "issues": [ // Null if no issues
                                {
                                    "issue": string, // Clear description of the issue
                                    "suggestedFix": string | null // Suggested fix, or null if no specific suggestion
                                }
                            ] | null,
                            "generalFeedback": string // Overall assessment of the question quality
                        }
                    }
                </OUTPUT_FORMAT>
            </EVALUATION_TASK>
        `);

        // Get the evaluation result
        const result = await ai.genObject({
            prompt: evaluationPrompt,
            schema: z.object({
                thinking: z.array(z.object({
                    reasoning: z.string(),
                    possibleIssue: z.string(),
                    severity: z.enum(['critical', 'major', 'minor', 'nit'])
                })),
                result: z.object({
                    isValid: z.boolean(),
                    issues: z.array(z.object({
                        issue: z.string(),
                        suggestedFix: z.string().nullable()
                    })).nullable(),
                    generalFeedback: z.string().nullable()
                })
            }),
            mode: 'json',
            providerArgs: {
                structuredOutputs: true
            }
        });

        return {
            isValid: result.object.result.isValid,
            feedback: {
                issues: result.object.result.issues,
                generalFeedback: result.object.result.generalFeedback
            }
        };
    }

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: MultipleChoiceActivityConfig, userAnswer: MultipleChoiceSubmitRequest, ai: AI}): Promise<MultipleChoiceSubmitResult> => {
        if (config.version === '0.0.1' || config.version === '0.0.0') {
            const isCorrect = userAnswer.userAnswer === config.correctAnswer;
     
            // Find the follow-up for the selected answer if available
            let followUp = '';
            if (config.answerChoiceFollowUps) {
                const followUpEntry = config.answerChoiceFollowUps.find(
                    entry => entry.answerChoice === userAnswer.userAnswer
                );
                if (followUpEntry) {
                    followUp = followUpEntry.followUp;
                }
            }
            
            return {
                score: isCorrect ? 1.0 : 0.0,
                shortFeedback: isCorrect ? 
                    "Correct! " + (followUp || '') : 
                    "Incorrect. The correct answer is: " + config.correctAnswer + (followUp ? ". " + followUp : ""),
                details: {
                    isCorrect,
                    followUp: followUp || undefined
                }
            };
        }
        else if (config.version === '1.0.0') {
            const isCorrect = config.answerChoices.find(choice => choice.isCorrect)?.text === userAnswer.userAnswer;
            const followUp = config.answerChoices.find(choice => choice.text === userAnswer.userAnswer)?.followUp;

            return {
                score: isCorrect ? 1.0 : 0.0,
                shortFeedback: followUp ? 
                    followUp 
                    :
                    isCorrect ?
                        'Correct!'
                        :
                        'Incorrect. The correct answer is: ' + config.answerChoices.find(choice => choice.isCorrect)?.text,
                details: {
                    isCorrect,
                    followUp: followUp || undefined
                }
            };
        }

        return {
            score: 0.0,
            shortFeedback: 'This activity type is not supported yet.',
            details: {
                isCorrect: false,
                followUp: undefined
            }
        };
    }
} 