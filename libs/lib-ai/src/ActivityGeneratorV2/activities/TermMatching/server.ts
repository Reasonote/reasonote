import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  TermMatchingActivityConfig,
  TermMatchingActivityConfigSchemav0_0_1,
  TermMatchingResult,
  TermMatchingSubmitRequest,
  TermMatchingSubmitResult,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class TermMatchingActivityTypeServerV2 extends ActivityTypeServerV2<TermMatchingActivityConfig, TermMatchingSubmitResult> {
    static readonly type = 'term-matching' as const;
    readonly type = TermMatchingActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: TermMatchingActivityConfigSchemav0_0_1,
            shortDescription: 'A term matching activity where students match terms with their definitions',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a term matching activity">
                    <OVERVIEW>
                        Create a term matching activity where students need to match terms with their correct definitions.
                        Terms should be clear and specific to the topic.
                        Definitions should be concise but comprehensive.
                    </OVERVIEW>

                    <TERM_PAIRS description="Guidelines for creating term-definition pairs">
                        - Include 2-10 term-definition pairs
                        - Terms should be key concepts from the topic
                        - Definitions should be clear and accurate
                        - Avoid overly similar definitions
                        - Use proper formatting for code or math
                        - Keep definitions concise but complete
                    </TERM_PAIRS>

                    <INSTRUCTIONS_TEXT description="Guidelines for activity instructions">
                        - Provide clear matching directions
                        - Explain scoring if hard mode is enabled
                        - Keep instructions concise
                        - Use appropriate language level
                    </INSTRUCTIONS_TEXT>

                    <DIFFICULTY_BALANCE description="Guidelines for difficulty">
                        - Terms should be clearly distinct
                        - Definitions should be unambiguous
                        - Complexity should match skill level
                        - Consider using hard mode for advanced topics
                    </DIFFICULTY_BALANCE>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When testing vocabulary comprehension',
                'For reviewing key terms and concepts',
                'When definitions are unambiguous',
                'For assessing basic understanding',
                'When matching skills are appropriate'
            ],
            whenToAvoid: [
                'When concepts require detailed explanation',
                'For complex problem-solving',
                'When multiple definitions are valid',
                'For procedural knowledge',
                'When exact wording is crucial'
            ],
            examples: [{
                name: "programming_example",
                input: "Generate a term matching activity about Python data types",
                outputs: [{   
                    name: "good_example",
                    quality: "good",
                    output: {
                        termPairs: [
                            { term: "int", definition: "A whole number data type used for counting and arithmetic" },
                            { term: "float", definition: "A decimal number data type for mathematical operations" },
                            { term: "str", definition: "A sequence of characters used for text data" },
                            { term: "bool", definition: "A data type with only True or False values" },
                            { term: "list", definition: "An ordered collection that can store multiple items" }
                        ],
                        instructions: "Match each Python data type with its correct definition. In hard mode, incorrect matches will reduce your score.",
                        hardMode: true,
                        version: "0.0.1"
                    },
                    explanation: "This is a good example because it:\n- Uses clear, distinct terms\n- Has concise but complete definitions\n- Includes appropriate number of pairs\n- Has clear instructions\n- Uses hard mode appropriately"
                }, {
                    name: "bad_example",
                    quality: "bad",
                    output: {
                        termPairs: [
                            { term: "number", definition: "Stores numbers" },
                            { term: "text", definition: "Stores text" }
                        ],
                        instructions: "Match the terms.",
                        version: "0.0.0"
                    },
                    explanation: "This is a poor example because it:\n- Terms are too vague\n- Definitions are too simple\n- Too few term pairs\n- Instructions lack detail\n- Doesn't use proper technical terms"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <CONTENT_QUALITY description="Ensuring the content is well-structured">
                        - Terms are clear and specific
                        - Definitions are accurate and unambiguous
                        - Proper number of term pairs (2-10)
                        - Instructions are clear and complete
                    </CONTENT_QUALITY>

                    <FORMATTING_VALIDATION description="Validating formatting">
                        - Code is properly formatted
                        - Math expressions use LaTeX
                        - Terms and definitions are consistent
                        - No unnecessary jargon
                    </FORMATTING_VALIDATION>

                    <DIFFICULTY_BALANCE description="Maintaining appropriate difficulty">
                        - Terms are appropriately challenging
                        - Definitions are distinct
                        - Hard mode is used appropriately
                        - Complexity matches topic
                    </DIFFICULTY_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): TermMatchingActivityConfig {
        return {
            version: "0.0.1",
            type: this.type,
            termPairs: [
                { term: "", definition: "" },
                { term: "", definition: "" }
            ],
            instructions: "Match the terms with their correct definitions.",
            hardMode: false
        };
    }

    async getCompletedTip(result: TermMatchingResult): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }

    override postProcessConfig = async ({config, request, ai}: {config: TermMatchingActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<TermMatchingActivityConfig> => {
        return config;
    }

    override evaluateConfig = async ({config, request, ai}: {config: TermMatchingActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                            Your task is to evaluate if the generated term matching activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If terms and definitions are clear and distinct, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to activities that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - Clear, distinct terms with unambiguous definitions are better than many vague ones
                                - If terms and definitions are clear and related, it's working
                                - Proper formatting of code and math is essential
                                - Instructions should be clear but don't need to be verbose
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing/broken code or math formatting
                                - Ambiguous or unclear definitions
                                - Too few or too many term pairs
                                - Technical errors or incorrect information
                                - Very similar or confusing definitions
                                - Missing or unclear instructions
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass activities that have these">
                                - Clear, distinct terms
                                - Unambiguous definitions
                                - Proper number of pairs (2-10)
                                - Clear instructions
                                - Proper formatting
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more terms
                                - Could have longer definitions
                                - Could be more challenging
                                - Could have more detail
                                - Instructions could be more detailed
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a term matching activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad term matching activities">
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
                            <TERM_PAIRS>
                                ${config.termPairs.map(pair => 
                                    `<PAIR>
                                        <TERM>${pair.term}</TERM>
                                        <DEFINITION>${pair.definition}</DEFINITION>
                                    </PAIR>`
                                ).join('\n')}
                            </TERM_PAIRS>
                            <INSTRUCTIONS>${config.instructions}</INSTRUCTIONS>
                            <HARD_MODE>${config.version === '0.0.1' ? config.hardMode : false}</HARD_MODE>
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

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: TermMatchingActivityConfig, userAnswer: TermMatchingSubmitRequest, ai: AI}): Promise<TermMatchingSubmitResult> => {
        // In easy mode, always give 100%
        if (userAnswer.mistakeCount === undefined) {
            return {
                score: 1.0, // 100% as a decimal
                shortFeedback: "Perfect! All matches are correct.",
                details: {
                    grade0To100: 100,
                    shortExplanation: "Perfect! All matches are correct.",
                    explanation: "You've successfully matched all terms with their correct definitions."
                }
            };
        }

        // In hard mode, deduct 10% per mistake
        const penaltyPerMistake = 10;
        const totalPenalty = Math.min(90, userAnswer.mistakeCount * penaltyPerMistake);
        const finalGrade = Math.max(0, 100 - totalPenalty);
        const finalScore = finalGrade / 100; // Convert to 0-1 scale

        const penaltyExplanation = `You made ${userAnswer.mistakeCount} mistake${userAnswer.mistakeCount === 1 ? '' : 's'} while completing this activity in hard mode:
- Each mistake results in a ${penaltyPerMistake}% penalty
- Total penalty: ${totalPenalty}%
- Final grade: ${finalGrade}%`;

        return {
            score: finalScore,
            shortFeedback: `Completed with ${userAnswer.mistakeCount} mistake${userAnswer.mistakeCount === 1 ? '' : 's'} in hard mode (-${totalPenalty}%)`,
            details: {
                grade0To100: finalGrade,
                shortExplanation: `Completed with ${userAnswer.mistakeCount} mistake${userAnswer.mistakeCount === 1 ? '' : 's'} in hard mode (-${totalPenalty}%)`,
                explanation: penaltyExplanation
            }
        };
    }
} 