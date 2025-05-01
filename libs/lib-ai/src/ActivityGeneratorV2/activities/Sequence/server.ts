import { z } from 'zod';

import {
  SequenceActivityConfig,
  SequenceActivityConfigSchemav0_0_1,
  SequenceResult,
  SequenceSubmitRequest,
  SequenceSubmitResult,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { ActivityRequestHydratedValues } from '../../types';

export class SequenceActivityTypeServerV2 extends ActivityTypeServerV2<SequenceActivityConfig, SequenceSubmitResult> {
    static readonly type = 'sequence' as const;
    readonly type = SequenceActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: SequenceActivityConfigSchemav0_0_1,
            shortDescription: 'A sequence activity where students arrange items in the correct order',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a sequence activity">
                    <OVERVIEW>
                        Generate a sequence activity with 4-6 items that need to be arranged in a specific order.
                        The content should be educational and have a clear, logical sequence.
                        Consider various types of sequences: historical events, process steps, order of operations, 
                        size/magnitude comparisons, or cause-and-effect relationships.
                        Use tasteful markdown formatting for emphasis and proper formatting for code or math.
                    </OVERVIEW>

                    <PROMPT description="Guidelines for the prompt">
                        - Should clearly state the ordering criterion (e.g., chronological, procedural, logical)
                        - Can include context or background information
                        - Must be unambiguous about the desired order
                        - Length should be concise but clear
                    </PROMPT>

                    <ITEMS description="Guidelines for sequence items">
                        - Provide 4-6 items to sequence
                        - Each item should be distinct and clear
                        - Items should have a definitive correct order
                        - Can include dates, process steps, operations, or measurable criteria
                        - Use proper formatting for any technical content
                    </ITEMS>

                    <FEEDBACK description="Guidelines for feedback">
                        - Explain why the correct order is logical
                        - For historical events: explain the significance of the chronology
                        - For processes: highlight dependencies between steps
                        - For operations: explain the consequences of performing steps out of order
                        - Keep explanations concise and educational
                    </FEEDBACK>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When testing understanding of historical chronology',
                'When teaching processes or procedures',
                'For teaching algorithmic or step-by-step operations',
                'For size or magnitude comparisons',
                'When demonstrating cause and effect relationships'
            ],
            whenToAvoid: [
                'When order is subjective or debatable',
                'For simple memorization tasks',
                'When multiple correct orders exist',
                'For very complex processes (>6 steps)',
            ],
            examples: [
                {
                    name: "Historical Events Timeline",
                    input: "Generate a sequence activity about World War II events in chronological order with dates as hidden labels.",
                    outputs: [
                        {
                            name: "World War II Timeline",
                            quality: "good",
                            output: {
                                type: "sequence",
                                version: "0.0.1",
                                prompt: "Arrange the following World War II events in chronological order:",
                                items: [
                                    {
                                        id: "1",
                                        label: "Germany invades Poland",
                                        hiddenPositionLabel: "September 1, 1939"
                                    },
                                    {
                                        id: "2",
                                        label: "Attack on Pearl Harbor",
                                        hiddenPositionLabel: "December 7, 1941"
                                    },
                                    {
                                        id: "3",
                                        label: "D-Day (Normandy landings)",
                                        hiddenPositionLabel: "June 6, 1944"
                                    },
                                    {
                                        id: "4",
                                        label: "Germany surrenders",
                                        hiddenPositionLabel: "May 8, 1945"
                                    },
                                    {
                                        id: "5",
                                        label: "Atomic bombing of Hiroshima",
                                        hiddenPositionLabel: "August 6, 1945"
                                    }
                                ],
                                aiScoringEnabled: true
                            },
                            explanation: "This example uses historical events with specific dates as hidden labels. The position labels provide a clear chronological ordering structure."
                        }
                    ]
                },
                {
                    name: "Scientific Method Process",
                    input: "Generate a sequence activity about the steps of the scientific method with descriptive position labels.",
                    outputs: [
                        {
                            name: "Scientific Method Steps",
                            quality: "good",
                            output: {
                                type: "sequence",
                                version: "0.0.1",
                                prompt: "Arrange the steps of the scientific method in the correct order:",
                                items: [
                                    {
                                        id: "1",
                                        label: "Make an observation",
                                        hiddenPositionLabel: "Step 1: Initial observation of a phenomenon"
                                    },
                                    {
                                        id: "2",
                                        label: "Ask a question",
                                        hiddenPositionLabel: "Step 2: Formulate a specific question about the observation"
                                    },
                                    {
                                        id: "3",
                                        label: "Form a hypothesis",
                                        hiddenPositionLabel: "Step 3: Propose a testable explanation"
                                    },
                                    {
                                        id: "4",
                                        label: "Conduct an experiment",
                                        hiddenPositionLabel: "Step 4: Test the hypothesis through controlled investigation"
                                    },
                                    {
                                        id: "5",
                                        label: "Analyze data and draw conclusions",
                                        hiddenPositionLabel: "Step 5: Interpret results and determine if hypothesis is supported"
                                    }
                                ],
                                aiScoringEnabled: true
                            },
                            explanation: "This example shows a process-based sequence with clear step-by-step ordering and descriptive position labels that explain the purpose of each step."
                        }
                    ]
                },
                {
                    name: "Mathematical Order of Operations",
                    input: "Generate a sequence activity about the mathematical order of operations (PEMDAS).",
                    outputs: [
                        {
                            name: "PEMDAS Order",
                            quality: "good",
                            output: {
                                type: "sequence",
                                version: "0.0.1",
                                prompt: "Arrange these mathematical operations in the correct order they should be performed (PEMDAS):",
                                items: [
                                    {
                                        id: "1",
                                        label: "Parentheses",
                                        hiddenPositionLabel: "First: Calculate expressions inside parentheses"
                                    },
                                    {
                                        id: "2",
                                        label: "Exponents",
                                        hiddenPositionLabel: "Second: Calculate powers and roots"
                                    },
                                    {
                                        id: "3",
                                        label: "Multiplication",
                                        hiddenPositionLabel: "Third (tie): Perform multiplication from left to right"
                                    },
                                    {
                                        id: "4",
                                        label: "Division",
                                        hiddenPositionLabel: "Third (tie): Perform division from left to right"
                                    },
                                    {
                                        id: "5",
                                        label: "Addition",
                                        hiddenPositionLabel: "Fourth (tie): Perform addition from left to right"
                                    },
                                    {
                                        id: "6",
                                        label: "Subtraction",
                                        hiddenPositionLabel: "Fourth (tie): Perform subtraction from left to right"
                                    }
                                ],
                                aiScoringEnabled: true
                            },
                            explanation: "This example shows a procedural sequence with clear ordering rules and explanatory position labels for each operation."
                        }
                    ]
                }
            ],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders">
                    <CONTENT_QUALITY>
                        - Prompt should clearly specify the type of sequence (chronological, procedural, etc.)
                        - Items should be properly formatted and distinct
                        - Sequence should be logical and educational
                    </CONTENT_QUALITY>

                    <SEQUENCE_VALIDATION>
                        - One clear correct order exists
                        - Items are distinct and unambiguous
                        - Order follows stated criterion
                    </SEQUENCE_VALIDATION>

                    <DIFFICULTY_BALANCE>
                        - Sequence should test understanding of the subject matter
                        - Items should be related but distinct
                        - Order should be logical once the underlying principle is understood
                    </DIFFICULTY_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): SequenceActivityConfig {
        return {
            version: "0.0.1",
            type: this.type,
            prompt: "",
            items: [],
            aiScoringEnabled: true,
        };
    }

    async getCompletedTip(result: SequenceResult): Promise<string | undefined> {
        if (result?.feedback?.markdownFeedback) {
            return result.feedback.markdownFeedback;
        }
        return undefined;
    }

    override postProcessConfig = async ({config}: {config: SequenceActivityConfig}): Promise<SequenceActivityConfig> => {
        return config;
    }

    override evaluateConfig = async ({config, request, ai}: {
        config: SequenceActivityConfig,
        request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues},
        ai: AI
    }): Promise<{
        isValid: boolean,
        feedback: {
            issues: {issue: string, suggestedFix: string | null}[] | null,
            generalFeedback: string | null
        }
    }> => {
        const genConfig = await this.getGenConfig(request, ai);
        
        const primaryInstructions = await genConfig.primaryInstructions(request);
        const finalInstructions = await genConfig.finalInstructions?.(request);
        const context = await ai.prompt.activities.generateActivityContextString(request);

        const result = await ai.genObject({
            model: 'openai:gpt-4-turbo',
            schema: z.object({
                thinking: z.array(z.object({
                    reasoning: z.string(),
                    possibleIssue: z.string(),
                    severity: z.enum(['nit', 'minor', 'major', 'critical']),
                })),
                result: z.object({
                    isValid: z.boolean(),
                    issues: z.array(z.object({
                        issue: z.string(),
                        suggestedFix: z.string().nullable(),
                    })).nullable(),
                    generalFeedback: z.string().nullable(),
                }),
            }),
            messages: [
                // ... evaluation messages would go here
            ],
            mode: 'json',
        });

        // Access the properties correctly based on the actual return type
        return {
            isValid: result.object.result.isValid,
            feedback: {
                issues: result.object.result.issues,
                generalFeedback: result.object.result.generalFeedback,
            }
        };
    }

    override gradeUserAnswer = async ({config, userAnswer, ai}: {
        config: SequenceActivityConfig,
        userAnswer: SequenceSubmitRequest,
        ai: AI
    }): Promise<SequenceSubmitResult> => {
        const userSequence = userAnswer.userSequence;
        const correctSequence = config.items.map(item => item.id);

        console.log('userSequence', userSequence);
        console.log('correctSequence', correctSequence);
        
        // Calculate correct and incorrect positions
        const correctPositions: number[] = [];
        const incorrectPositions: number[] = [];
        
        userSequence.forEach((itemId, index) => {
            if (index < correctSequence.length && itemId === correctSequence[index]) {
                correctPositions.push(index);
            } else {
                incorrectPositions.push(index);
            }
        });
        
        // Calculate score based on correct positions
        const totalItems = correctSequence.length;
        const correctCount = correctPositions.length;
        const score = Math.round((correctCount / totalItems) * 100);
        
        // Generate feedback based on score
        let shortFeedback = "";
        if (score === 100) {
            shortFeedback = "Perfect! You arranged all items in the correct order.";
        } else if (score >= 75) {
            shortFeedback = "Great job! Most items are in the correct order.";
        } else if (score >= 50) {
            shortFeedback = "Good effort! About half of the items are in the correct order.";
        } else if (score > 0) {
            shortFeedback = "You have a few items in the correct order. Try again!";
        } else {
            shortFeedback = "None of the items are in the correct order. Try again!";
        }
        
        return {
            score: score * .01,
            shortFeedback,
            details: {
                correctPositions,
                incorrectPositions,
            }
        };
    }
}