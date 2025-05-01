import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  NarrativeActivityConfig,
  NarrativeActivityConfigSchema,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class NarrativeActivityTypeServerV2 extends ActivityTypeServerV2<NarrativeActivityConfig> {

    static readonly type = 'narrative' as const;
    readonly type = NarrativeActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: NarrativeActivityConfigSchema,
            shortDescription: 'A narrative activity that explains concepts through engaging stories',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a narrative">
                    <OVERVIEW>
                        Create a narrative that introduces and explains concepts through an engaging story.
                        The story should be grounded in real-world applications and practical usage.
                        Focus on demonstrating concepts through relatable scenarios.
                    </OVERVIEW>

                    <STORY_ELEMENTS description="Guidelines for story elements">
                        <PREMISE>
                            - Define the core idea or message
                            - Should resonate with human experience
                            - Must relate to the concept being taught
                        </PREMISE>

                        <CHARACTERS>
                            - Create relatable, well-motivated characters
                            - Define clear internal desires and fears
                            - Characters should drive the plot forward
                            - Keep focus on one main character
                        </CHARACTERS>

                        <CONFLICT>
                            - Identify main challenge or problem
                            - Should relate to the concept being taught
                            - Create tension to maintain engagement
                            - Must be resolvable through understanding
                        </CONFLICT>

                        <PLOT>
                            - Events should be causally linked
                            - Each event should serve the story's purpose
                            - Build toward concept understanding
                            - Include clear resolution
                        </PLOT>

                        <SETTING>
                            - Choose relevant, relatable context
                            - Support the story's themes
                            - Enhance understanding of concepts
                            - Keep it focused and specific
                        </SETTING>
                    </STORY_ELEMENTS>

                    <WRITING_STYLE description="Guidelines for writing">
                        - Use simple, clear language
                        - Write in first-person perspective
                        - Include dialogue when helpful
                        - Break into clear sections
                        - Use the 3000 most common English words
                        - Avoid jargon unless necessary
                    </WRITING_STYLE>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When explaining complex concepts',
                'For making abstract ideas concrete',
                'When personal experience aids understanding',
                'To demonstrate practical applications',
                'For engaging emotional learning'
            ],
            whenToAvoid: [
                'When direct instruction is needed',
                'For purely factual content',
                'When immediate practice is required',
                'For step-by-step procedures',
                'When brevity is crucial'
            ],
            examples: [{
                name: "programming_example",
                input: "Generate a narrative about Python variables",
                outputs: [{
                    name: "good_example",
                    quality: "good",
                    output: {
                        narrativeText: `I never thought I'd find myself excited about computer programming, but here I was, staring at my laptop screen with a sense of wonder. It all started when my friend Sarah showed me how Python variables worked.

"Think of variables like labeled boxes," she said, opening up a new Python file. "You can put anything in them, and the label helps you remember what's inside."

She typed out a simple example:
\`\`\`python
name = "Alice"
age = 25
height = 1.75
\`\`\`

"See?" she pointed at the screen. "We just created three boxes: one holding the name 'Alice', another with the number 25, and a third with 1.75."

What amazed me was how easily we could change what was in these boxes. Sarah showed me how the same variable could hold different types of data:
\`\`\`python
x = 5          # Now x holds a number
x = "hello"    # Now x holds text
\`\`\`

"That's why Python is called 'dynamically typed'," she explained. "The boxes can hold different types of things at different times."

By the end of our session, I wasn't just learning about variables - I was using them to build something real. We created a simple program that calculated the average of my test scores, and for the first time, I saw how programming could make my life easier.

The concept finally clicked: variables weren't just computer jargon, they were tools that helped us organize and work with information in practical ways.`,
                        metadata: {
                            genRequest: {
                                skill: {
                                    name: "Python Variables",
                                    parentSkillContext: "Programming Fundamentals"
                                }
                            }
                        }
                    },
                    explanation: "This is a good example because it:\n- Uses a relatable first-person perspective\n- Includes practical examples\n- Shows real-world application\n- Builds understanding gradually\n- Includes proper code formatting"
                }, {
                    name: "bad_example",
                    quality: "bad",
                    output: {
                        narrativeText: "Variables are important in programming. They store data and can be changed. You need to understand them to write good code. Here's how they work in Python...",
                        metadata: {
                            genRequest: {
                                skill: {
                                    name: "Python Variables",
                                    parentSkillContext: "Programming Fundamentals"
                                }
                            }
                        }
                    },
                    explanation: "This is a poor example because it:\n- Lacks narrative structure\n- No character or conflict\n- Too direct and instructional\n- Missing practical context\n- No emotional engagement"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the narrative">
                    <CONTENT_QUALITY description="Ensuring the content is effective">
                        - Story serves the learning objective
                        - Concepts are clearly demonstrated
                        - Examples are practical and relevant
                        - Language is simple and clear
                    </CONTENT_QUALITY>

                    <NARRATIVE_STRUCTURE description="Validating story structure">
                        - Clear beginning, middle, and end
                        - Character growth mirrors learning
                        - Conflict resolution teaches concept
                        - Sections flow logically
                    </NARRATIVE_STRUCTURE>

                    <ENGAGEMENT_BALANCE description="Maintaining engagement">
                        - Story is interesting and relatable
                        - Learning feels natural, not forced
                        - Examples are integrated smoothly
                        - Emotional connection is maintained
                    </ENGAGEMENT_BALANCE>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): NarrativeActivityConfig {
        return {
            version: '0.0.0',
            type: this.type,
            narrativeText: "",
            metadata: {
                genRequest: {},
            },
        };
    }

    override evaluateConfig = async ({config, request, ai}: {config: NarrativeActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                            Your task is to evaluate if the generated narrative activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If a narrative effectively teaches the concept through an engaging story, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to narratives that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused story teaching one concept is often better than a complex one
                                - If the narrative engages and teaches effectively, it's working
                                - Story elements should serve the learning objective
                                - Writing should be clear and accessible
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing narrative structure
                                - Unclear or missing concept explanation
                                - No character development
                                - No conflict or resolution
                                - Technical errors or incorrect information
                                - Story that doesn't teach the concept
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass narratives that have these">
                                - Clear story structure
                                - Effective concept teaching
                                - Relatable characters
                                - Engaging conflict
                                - Satisfying resolution
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could be longer
                                - Could have more characters
                                - Could be more detailed
                                - Could have more examples
                                - Could be more complex
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a narrative activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad narrative activities">
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
                            <NARRATIVE>${config.narrativeText}</NARRATIVE>
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

    override postProcessConfig = async ({config, request, ai}: {config: NarrativeActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<NarrativeActivityConfig> => {
        return config;
    }

    async gradeUserAnswer?(args: { config: { type: 'narrative'; version: '0.0.0'; metadata: { genRequest?: any; }; narrativeText?: string | null | undefined; }; userAnswer: any; ai: AI; }): Promise<{score: number, shortFeedback: string, details: any}> {
        return {
            score: 1,
            shortFeedback: "This is a test feedback",
            details: {
                objectiveGrades: [],
            }
        }
    }
} 