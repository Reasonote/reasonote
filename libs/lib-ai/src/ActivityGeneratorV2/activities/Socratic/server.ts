import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  SocraticActivityConfig,
  SocraticActivityConfigSchema,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class SocraticActivityTypeServerV2 extends ActivityTypeServerV2<SocraticActivityConfig> {

    static readonly type = 'socratic' as const;
    readonly type = SocraticActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: SocraticActivityConfigSchema,
            shortDescription: 'A Socratic dialogue activity where an AI teacher guides students through discovery learning',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a Socratic dialogue activity">
                    <OVERVIEW>
                        Create a Socratic dialogue setting where an AI teacher guides students to discover and understand concepts through questioning.
                        The activity should encourage critical thinking and self-discovery.
                        Focus on creating a supportive environment for exploration and learning.
                    </OVERVIEW>

                    <SETTING description="Guidelines for creating the learning environment">
                        - Choose an appropriate emoji that represents the setting
                        - Create a welcoming and intellectually stimulating environment
                        - Make it relevant to the subject matter
                        - Keep it focused and specific
                        - Consider the student's perspective
                    </SETTING>

                    <LEARNING_OBJECTIVES description="Guidelines for learning objectives">
                        - Define clear, measurable objectives
                        - Focus on one concept per objective
                        - Make objectives achievable in 1-2 minutes each
                        - Maximum of 2 objectives per activity
                        - Ensure objectives build on each other
                        - Write objectives in student-friendly language
                    </LEARNING_OBJECTIVES>

                    <QUESTION_SEQUENCE description="Guidelines for planning the dialogue">
                        - Start with foundational questions
                        - Build complexity gradually
                        - Include probing follow-up questions
                        - Plan for common misconceptions
                        - Create opportunities for discovery
                        - Allow for multiple perspectives
                    </QUESTION_SEQUENCE>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When teaching complex concepts',
                'For developing critical thinking',
                'When exploring multiple perspectives',
                'For challenging assumptions',
                'When building on prior knowledge'
            ],
            whenToAvoid: [
                'When direct instruction is needed',
                'For purely factual recall',
                'When time is very limited',
                'For very young learners',
                'When immediate answers are required'
            ],
            examples: [{
                name: "programming_example",
                input: "Generate a Socratic dialogue about Python variables",
                outputs: [{
                    name: "good_example",
                    quality: "good",
                    output: {
                        setting: {
                            emoji: "🏛️",
                            name: "The Python Academy",
                            description: "A modern learning space where students explore programming concepts through dialogue and discovery. The room is equipped with computers, but the focus is on understanding core concepts through discussion."
                        },
                        learningObjectives: [
                            {
                                name: "Variable Fundamentals",
                                objective: "Discover what variables are and why we need them in programming."
                            },
                            {
                                name: "Dynamic Typing",
                                objective: "Explore how Python's dynamic typing allows variables to change types."
                            }
                        ],
                        skillName: "Python Variables"
                    },
                    explanation: "This is a good example because it:\n- Has a relevant, welcoming setting\n- Clear, focused learning objectives\n- Objectives are achievable in short time\n- Setting supports the learning goals\n- Appropriate emoji choice"
                }, {
                    name: "bad_example",
                    quality: "bad",
                    output: {
                        setting: {
                            emoji: "💻",
                            name: "Computer Lab",
                            description: "A room with computers."
                        },
                        learningObjectives: [
                            {
                                name: "Learn Programming",
                                objective: "Understand all of Python programming."
                            }
                        ],
                        skillName: "Programming"
                    },
                    explanation: "This is a poor example because it:\n- Setting is too vague\n- Learning objective is too broad\n- Missing specific focus\n- Generic description\n- Lacks structured progression"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <SETTING_QUALITY description="Ensuring the setting is appropriate">
                        - Setting supports learning objectives
                        - Description is clear and engaging
                        - Emoji is relevant and appropriate
                        - Environment encourages dialogue
                    </SETTING_QUALITY>

                    <OBJECTIVE_VALIDATION description="Validating learning objectives">
                        - Objectives are specific and measurable
                        - Can be achieved in 1-2 minutes each
                        - Maximum of 2 objectives
                        - Build on each other logically
                    </OBJECTIVE_VALIDATION>

                    <DIALOGUE_PREPARATION description="Preparing for effective dialogue">
                        - Questions progress logically
                        - Misconceptions are anticipated
                        - Discovery is encouraged
                        - Student engagement is prioritized
                    </DIALOGUE_PREPARATION>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): SocraticActivityConfig {
        return {
            version: "0.0.0",
            type: this.type,
            setting: {
                emoji: "",
                name: "",
                description: ""
            },
            skillName: "",
            learningObjectives: []
        };
    }

    override evaluateConfig = async ({config, request, ai}: {config: SocraticActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                            Your task is to evaluate if the generated Socratic dialogue activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If an activity effectively creates an environment for discovery learning through dialogue, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to activities that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused setting with clear objectives is often better than a complex one
                                - If the setting and objectives support learning, it's working
                                - Learning objectives should be achievable in short time
                                - Setting should encourage dialogue and discovery
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing or inappropriate emoji
                                - Unclear or missing setting description
                                - Too many learning objectives (>2)
                                - Objectives that are too broad or vague
                                - Setting that doesn't support learning
                                - Technical errors or incorrect information
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass activities that have these">
                                - Clear, supportive setting
                                - Appropriate emoji
                                - 1-2 focused objectives
                                - Objectives achievable in short time
                                - Setting supports dialogue
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more objectives
                                - Could have more detail in setting
                                - Could be more challenging
                                - Setting could be more elaborate
                                - Could cover more concepts
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a Socratic dialogue activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad Socratic dialogue activities">
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
                            <SETTING>
                                <EMOJI>${config.setting.emoji}</EMOJI>
                                <NAME>${config.setting.name}</NAME>
                                <DESCRIPTION>${config.setting.description}</DESCRIPTION>
                            </SETTING>
                            <SKILL_NAME>${config.skillName}</SKILL_NAME>
                            <LEARNING_OBJECTIVES>
                                ${config.learningObjectives.map(obj => 
                                    `<OBJECTIVE>
                                        <NAME>${obj.name}</NAME>
                                        <DESCRIPTION>${obj.objective}</DESCRIPTION>
                                    </OBJECTIVE>`
                                ).join('\n')}
                            </LEARNING_OBJECTIVES>
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

    override postProcessConfig = async ({config, request, ai}: {config: SocraticActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<SocraticActivityConfig> => {
        return config;
    }

    override gradeUserAnswer?(args: { config: { type: 'socratic'; version: '0.0.0'; setting: { emoji: string; name: string; description: string; } & { [k: string]: unknown; }; learningObjectives: z.objectOutputType<{ name: z.ZodString; objective: z.ZodString; }, z.ZodTypeAny, 'passthrough'>[]; skillName: string; }; userAnswer: any; ai: AI; }): Promise<any> {
        throw new Error('Method not implemented.');
    }
} 