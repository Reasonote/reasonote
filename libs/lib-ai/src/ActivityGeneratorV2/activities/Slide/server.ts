import { z } from 'zod';

import {
  notEmpty,
  trimLines,
} from '@lukebechtel/lab-ts-utils';
import {
  SlideActivityConfig,
  SlideActivityConfigSchema,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateManyRequest,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class SlideActivityTypeServerV2 extends ActivityTypeServerV2<SlideActivityConfig> {
    static readonly type = 'slide' as const;
    readonly type = SlideActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest | ActivityGenerateManyRequest, ai: AI): Promise<ActivityGenConfig> {
        var overrides: Partial<ActivityGenConfig> | undefined;
        
        if ('activityTypeSpecificConfig' in args && args.activityTypeSpecificConfig) {
            overrides = args.activityTypeSpecificConfig.genConfigOverrides;
        }

        if ('typeConfigs' in args && args.typeConfigs) {
            overrides = args.typeConfigs[this.type]?.activityTypeSpecificConfig?.genConfigOverrides;
        }


        return {
            schema: SlideActivityConfigSchema,
            shortDescription: 'A slide activity that presents information in a clear, formatted way',
            primaryInstructions: async () => overrides?.primaryInstructions?.(args) ?? `
                <INSTRUCTIONS description="Core instructions for generating a slide">
                    <OVERVIEW>
                        Create a slide that presents information clearly and engagingly.
                        The slide should be focused on a single concept or idea.
                        Use markdown formatting to enhance readability and visual appeal.
                    </OVERVIEW>

                    <TITLE description="Guidelines for the title">
                        - Should be clear and concise
                        - Include a relevant emoji
                        - Capture the main idea of the slide
                        - Use proper capitalization
                    </TITLE>

                    <CONTENT description="Guidelines for the content">
                        - Present information in a clear, logical order
                        - Use markdown formatting for emphasis and structure
                        - Include code blocks with proper syntax highlighting
                        - Use LaTeX for mathematical expressions (wrapped in $$)
                        - Create diagrams using mermaid when helpful
                        - Keep content focused and digestible
                    </CONTENT>

                    <FORMATTING description="Guidelines for formatting">
                        - Use headers (##, ###) to organize content
                        - Apply emphasis (*italic*, **bold**) appropriately
                        - Format code with \`backticks\` or code blocks
                        - Wrap LaTeX in $$...$$
                        - Use bullet points for lists
                        - Include line breaks for readability
                    </FORMATTING>
                </INSTRUCTIONS>
            `,
            whenToUse: overrides?.whenToUse?.filter(notEmpty) ?? [
                'When introducing new concepts',
                'For presenting structured information',
                'When visual aids are helpful',
                'For step-by-step explanations',
                'To summarize key points'
            ],
            whenToAvoid: overrides?.whenToAvoid?.filter(notEmpty) ?? [
                'When interaction is needed',
                'For complex problem-solving',
                'When immediate feedback is required',
                'For testing knowledge',
                'When discussion is important'
            ],
            examples: overrides?.examples?.filter(notEmpty) ?? [{
                name: "programming_example",
                input: "Generate a slide about Python variables",
                outputs: [{
                    name: "good_example",
                    quality: "good",
                    output: {
                        type: "slide",
                        version: "0.0.0",
                        titleEmoji: "🐍",
                        title: "Python Variables: Your Code's Memory",
                        markdownContent: `
                        ## What is a Variable?
                        A variable in Python is like a labeled container that holds data:

                        \`\`\`python
                        name = "Alice"    # String variable
                        age = 25         # Integer variable
                        height = 1.75    # Float variable
                        \`\`\`

                        ### Key Points
                        - Variables store data in memory
                        - Names are case-sensitive
                        - Can hold different types of data
                        - Value can be changed anytime

                        ### Best Practices
                        1. Use descriptive names
                        2. Follow Python naming conventions
                        3. Initialize before using
                        4. Keep names lowercase with underscores
                        `
                    }
                }]
            }],
            finalInstructions: async () => overrides?.finalInstructions?.(args) ?? `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the slide">
                    <CONTENT_QUALITY description="Ensuring the content is well-structured">
                        - Information is clear and focused
                        - Content flows logically
                        - Examples are relevant and helpful
                        - Visual elements enhance understanding
                    </CONTENT_QUALITY>

                    <FORMATTING_VALIDATION description="Validating formatting">
                        - Markdown syntax is correct
                        - LaTeX expressions are properly wrapped
                        - Code blocks have language specified
                        - Mermaid diagrams are valid
                    </FORMATTING_VALIDATION>

                    <VISUAL_BALANCE description="Maintaining visual appeal">
                        - Content is not too dense
                        - Headers organize information
                        - Spacing improves readability
                        - Emoji usage is appropriate
                    </VISUAL_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): SlideActivityConfig {
        return {
            version: '0.0.0',
            type: this.type,
            titleEmoji: '',
            title: '',
            markdownContent: ''
        };
    }

    override evaluateConfig = async ({config, request, ai}: {config: SlideActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                            Your task is to evaluate if the generated slide activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If a slide effectively presents information in a clear and engaging way, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to slides that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused slide presenting one concept is often better than a complex one
                                - If the content is clear and well-formatted, it's working
                                - Proper formatting of code, math, and markdown is essential
                                - Visual organization should aid understanding
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing/broken code or math formatting
                                - Unclear or missing title
                                - Missing or invalid emoji
                                - Technical errors or incorrect information
                                - Poor markdown formatting
                                - Content that's too dense or disorganized
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass slides that have these">
                                - Clear title with emoji
                                - Well-structured content
                                - Proper formatting
                                - Focused topic
                                - Good visual organization
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more content
                                - Could have more examples
                                - Could be more detailed
                                - Could have more visuals
                                - Could be more comprehensive
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a slide activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad slide activities">
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
                            <TITLE_EMOJI>${config.titleEmoji}</TITLE_EMOJI>
                            <TITLE>${config.title}</TITLE>
                            <CONTENT>${config.markdownContent}</CONTENT>
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

    override postProcessConfig = async ({config, request, ai}: {config: SlideActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<SlideActivityConfig> => {
        return config;
    }

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: SlideActivityConfig, userAnswer: any, ai: AI}): Promise<{score: number, shortFeedback: string, details: any}> => {
        return {
            score: 1,
            shortFeedback: "Nice!",
            details: {},
        }
    };
} 