import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  EphMessageWithCharacterInfoSchema,
  RoleplayActivityConfig,
  RoleplayActivityConfigSchemav0_0_0,
  RoleplayResult,
  RoleplaySubmitRequest,
  RoleplaySubmitResult,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

// Define the type for the EphMessageWithCharacterInfo
type EphMessageWithCharacterInfo = z.infer<typeof EphMessageWithCharacterInfoSchema>;


export class RoleplayActivityTypeServerV2 extends ActivityTypeServerV2<RoleplayActivityConfig, RoleplaySubmitResult> {
    static readonly type = 'roleplay' as const;
    readonly type = RoleplayActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: RoleplayActivityConfigSchemav0_0_0,
            shortDescription: 'A roleplay activity where students interact with AI characters to achieve specific objectives',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a roleplay activity">
                    <OVERVIEW>
                        Create a roleplay scenario where the student interacts with AI characters to achieve specific learning objectives.
                        The scenario should be engaging, educational, and relevant to the topic.
                        Characters should have distinct personalities and motivations that create meaningful interactions.
                    </OVERVIEW>

                    <SETTING description="Guidelines for creating the setting">
                        - Should be clear and specific
                        - Relevant to the learning objectives
                        - Provides enough context for meaningful interaction
                        - Can be realistic or hypothetical
                        - Use an appropriate emoji as an icon
                    </SETTING>

                    <CHARACTERS description="Guidelines for creating characters">
                        - Each character needs a clear role and personality
                        - Include public information (name, emoji, description)
                        - Define private traits (personality, motivation)
                        - Characters should have conflicting or complementary goals
                        - Use common emojis that work across devices
                        - 2-4 characters is usually ideal
                    </CHARACTERS>

                    <USER_OBJECTIVES description="Guidelines for setting user objectives">
                        - Clear, measurable learning goals
                        - Objectives should test understanding
                        - Include criteria for success
                        - Make objectives challenging but achievable
                        - Align with the topic being taught
                    </USER_OBJECTIVES>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When practicing communication skills',
                'For scenario-based learning',
                'When exploring different perspectives',
                'For problem-solving in context',
                'When simulating real-world interactions'
            ],
            whenToAvoid: [
                'When exact answers are needed',
                'For basic fact recall',
                'When time is very limited',
                'For large group activities',
                'When immediate feedback is crucial'
            ],
            examples: [{
                name: "programming_example_teamwork",
                input: "Generate a roleplay about working in a software development team",
                outputs: [{   
                    name: "good_example_teamwork",
                    quality: "good",
                    output: {
                        setting: {
                            emoji: "🏢",
                            name: "Tech Startup Daily Stand-up",
                            description: "A morning stand-up meeting at a small tech startup. The team is discussing progress and challenges on their current project."
                        },
                        characters: [
                            {
                                public: {
                                    emoji: "👩‍💻",
                                    name: "Sarah (Senior Developer)",
                                    description: "An experienced developer who values code quality and best practices."
                                },
                                private: {
                                    personality: "Patient but firm, likes to mentor others while maintaining high standards.",
                                    motivation: "Wants to deliver high-quality code while helping the team grow."
                                }
                            },
                            {
                                public: {
                                    emoji: "👨‍💼",
                                    name: "Mike (Product Manager)",
                                    description: "Focused on meeting client deadlines and managing project scope."
                                },
                                private: {
                                    personality: "Diplomatic but deadline-driven, tries to balance team needs with business requirements.",
                                    motivation: "Needs to keep the project on schedule while maintaining team morale."
                                }
                            }
                        ],
                        userCharacter: {
                            objectives: [
                                {
                                    objectiveName: "Technical Communication",
                                    objectiveDescription: "Explain your code changes and their impact clearly to both technical and non-technical team members.",
                                    private: {
                                        gradingCriteria: "User should use appropriate technical terms while making concepts accessible to the product manager."
                                    }
                                },
                                {
                                    objectiveName: "Problem Resolution",
                                    objectiveDescription: "Address concerns about code quality vs. deadline pressure constructively.",
                                    private: {
                                        gradingCriteria: "User should propose solutions that balance quality and speed, showing understanding of both perspectives."
                                    }
                                }
                            ]
                        }
                    },
                    explanation: "This is a good example because it:\n- Creates a realistic scenario\n- Has characters with clear, conflicting motivations\n- Sets measurable learning objectives\n- Tests both technical and soft skills\n- Uses appropriate emojis"
                }, {
                    name: "bad_example_teamwork",
                    quality: "bad",
                    output: {
                        setting: {
                            name: "Office",
                            description: "A workplace."
                        },
                        characters: [
                            {
                                public: {
                                    emoji: "😊",
                                    name: "Nice Coworker",
                                    description: "A nice person who agrees with everything."
                                },
                                private: {
                                    personality: "Very nice",
                                    motivation: "Be nice"
                                }
                            }
                        ],
                        userCharacter: {
                            objectives: [
                                {
                                    objectiveName: "Do Good",
                                    objectiveDescription: "Do a good job",
                                    private: {
                                        gradingCriteria: "User should do well"
                                    }
                                }
                            ]
                        }
                    },
                    explanation: "This is a poor example because it:\n- Setting is too vague\n- Character lacks depth and motivation\n- No real conflict or challenge\n- Objectives are unclear\n- No specific learning goals"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <SETTING_QUALITY description="Ensuring the setting works">
                        - Setting provides clear context
                        - Relevant to learning objectives
                        - Allows for meaningful interaction
                        - Uses appropriate emoji
                    </SETTING_QUALITY>

                    <CHARACTER_VALIDATION description="Validating characters">
                        - Each character has clear motivation
                        - Personalities create interesting dynamics
                        - Public/private info is appropriate
                        - Emojis are common and visible
                    </CHARACTER_VALIDATION>

                    <OBJECTIVE_VALIDATION description="Validating objectives">
                        - Clear success criteria
                        - Measurable outcomes
                        - Appropriate difficulty
                        - Aligned with topic
                    </OBJECTIVE_VALIDATION>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    override postProcessConfig = async ({config, request, ai}: {config: RoleplayActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<RoleplayActivityConfig> => {
        return config;
    }

    createEmptyConfig(): RoleplayActivityConfig {
        return {
            version: "0.0.0",
            type: this.type,
            setting: {
                name: "",
                description: ""
            },
            userCharacter: {
                objectives: []
            },
            characters: []
        };
    }

    async getCompletedTip(result: RoleplayResult): Promise<string | undefined> {    
        if (result?.feedback?.markdownFeedback) {
            return result.feedback.markdownFeedback;
        }
        return undefined;
    }

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: RoleplayActivityConfig, userAnswer: RoleplaySubmitRequest, ai: AI}): Promise<RoleplaySubmitResult> => {
        const gradeResult = await ai.genObject({
            model: 'openai:gpt-4o',
            schema: z.object({
                grade0To100: z
                    .number()
                    .describe("The grade, from 0 to 100"),
                explanation: z
                    .string()
                    .describe("An explanation given to the user about why they received the grade they did."),
            }),
            messages: [
                {
                    role: 'system',
                    content: trimLines(`
                        # You
                        You are an excellent, detail-oriented grader.

                        # Your Task
                        You are responsible for grading the user's performance in the following roleplay activity:
                        \`\`\`json
                        ${JSON.stringify(config, null, 2)}
                        \`\`\`

                        # Notes
                        - When you give feedback to the user, address them as: "You".
                        - If you think you have a fun fact related to the question, you can include it in your feedback. Doing this will help the user by making things more memorable.
                    `)
                },
                {
                    role: 'user',
                    content: trimLines(`
                        # CONVERSATION HISTORY:
                        ${userAnswer.messages.map((m) => {
                            return trimLines(`
                                ${m.role === "user" ? "(USER):" : `${m.character?.name || "Character"}:`}

                                ${m.content}
                            `);
                        }).join("\n\n")}
                    `)
                }
            ],
            providerArgs: {
                structuredOutputs: true,
            },
        });
        
        return {
            score: gradeResult.object.grade0To100 / 100, // Convert from 0-100 to 0-1 scale
            shortFeedback: gradeResult.object.explanation,
            details: {
                grade0To100: gradeResult.object.grade0To100,
                explanation: gradeResult.object.explanation
            }
        };
    }

    override evaluateConfig = async ({config, request, ai}: {config: RoleplayActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                            Your task is to evaluate if the generated roleplay activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If a roleplay effectively creates meaningful interaction and tests understanding, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to activities that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused scenario with clear objectives is often better than a complex one
                                - If characters and setting enable meaningful interaction, it's working
                                - Characters need clear motivations but don't need to be perfect
                                - Objectives should be measurable but don't need excessive detail
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing or unclear objectives
                                - Characters without meaningful motivations
                                - Setting that doesn't enable interaction
                                - Objectives that can't be measured
                                - Missing or broken emoji formatting
                                - Characters that don't create meaningful dynamics
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass activities that have these">
                                - Clear setting and context
                                - Characters with distinct motivations
                                - Measurable objectives
                                - Valid emoji formatting
                                - Enables meaningful interaction
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more characters
                                - Could have more objectives
                                - Setting could be more detailed
                                - Characters could be more complex
                                - Could be more challenging
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a roleplay activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad roleplay activities">
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
                                <NAME>${config.setting.name}</NAME>
                                <DESCRIPTION>${config.setting.description}</DESCRIPTION>
                                <EMOJI>${config.setting.emoji ?? ''}</EMOJI>
                            </SETTING>
                            <CHARACTERS>${JSON.stringify(config.characters, null, 2)}</CHARACTERS>
                            <USER_OBJECTIVES>${JSON.stringify(config.userCharacter.objectives, null, 2)}</USER_OBJECTIVES>
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
} 