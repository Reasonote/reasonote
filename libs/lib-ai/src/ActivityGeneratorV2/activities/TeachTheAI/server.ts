import { z } from 'zod';

import { trimLines } from '@lukebechtel/lab-ts-utils';
import {
  TeachTheAIActivityConfig,
  TeachTheAIActivityConfigV0_1_0,
  TeachTheAIActivityConfigV0_1_0Schema,
  TeachTheAIResult,
  TeachTheAISubmitRequest,
  TeachTheAISubmitResult,
  TeachTheAISubmitResultDetails,
} from '@reasonote/activity-definitions';
import {
  ActivityGenConfig,
  ActivityGenerateRequest,
} from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { ActivityTypeServerV2 } from '../../ActivityTypeServerV2.priompt';
import { formatExample } from '../../Examples';
import { ActivityRequestHydratedValues } from '../../types';

export class TeachTheAIActivityTypeServerV2 extends ActivityTypeServerV2<TeachTheAIActivityConfig, TeachTheAISubmitResult> {
    static readonly type = 'teach-the-ai' as const;
    readonly type = TeachTheAIActivityTypeServerV2.type;

    override async getGenConfig(args: ActivityGenerateRequest, ai: AI): Promise<ActivityGenConfig> {
        return {
            schema: TeachTheAIActivityConfigV0_1_0Schema,
            shortDescription: 'A teaching activity where students explain concepts to a character who needs help understanding',
            primaryInstructions: async () => `
                <INSTRUCTIONS description="Core instructions for generating a teach-the-ai activity">
                    <OVERVIEW>
                        Create a teaching scenario where the user must explain concepts to a character.
                        The character should be relatable and have a clear reason for needing help.
                        Focus on creating opportunities for the user to demonstrate understanding through teaching.
                    </OVERVIEW>

                    <SETTING description="Guidelines for creating the learning environment">
                        - Choose an appropriate emoji that represents the setting
                        - Create a welcoming and supportive environment
                        - Make it relevant to the subject matter
                        - Keep it focused and specific
                        - Consider both teacher and student perspectives
                    </SETTING>

                    <CHARACTER description="Guidelines for creating the character">
                        - Choose an appropriate emoji for the character
                        - Give the character a clear personality
                        - Make them curious and eager to learn
                        - Include specific areas of confusion
                        - Keep them relatable and engaging
                    </CHARACTER>

                    <TEACHING_OBJECTIVES description="Guidelines for teaching objectives">
                        - Define clear, measurable objectives
                        - Focus on what the teacher needs to convey
                        - Make objectives achievable in short interactions
                        - Include specific grading criteria
                        - Consider different teaching approaches
                    </TEACHING_OBJECTIVES>

                    <NARRATOR_INTRO description="Guidelines for setting up the scene">
                        - Provide clear context for the interaction
                        - Explain why the character needs help
                        - Set up the teaching opportunity naturally
                        - Keep it concise but informative
                    </NARRATOR_INTRO>
                </INSTRUCTIONS>
            `,
            whenToUse: [
                'When practicing explanation skills',
                'For reinforcing understanding through teaching',
                'When exploring different teaching approaches',
                'For developing communication skills',
                'When testing deep understanding of concepts'
            ],
            whenToAvoid: [
                'When concepts are too complex to explain briefly',
                'For purely factual recall',
                'When immediate feedback is crucial',
                'For very technical or specialized topics',
                'When structured practice is needed'
            ],
            examples: [{
                name: "programming_example",
                input: "Generate a teach-the-ai activity about Python variables",
                outputs: [{
                    name: "good_example",
                    quality: "good",
                    output: {
                        version: '0.1.0',
                        type: 'teach-the-ai',
                        setting: {
                            emoji: "🏫",
                            name: "The Code Learning Center",
                            description: "A modern study space where programmers help each other learn. The room has comfortable seating and whiteboards for demonstrations."
                        },
                        characterName: "Alex",
                        characterEmoji: "🤔",
                        narratorIntro: "You're working on some Python code when Alex, a fellow student, approaches you looking confused. They've been trying to understand how variables work in Python but keep getting mixed up.",
                        characterInstructions: "You are Alex, a beginner programmer who is struggling with Python variables. You understand basic programming concepts but get confused about variable types and assignments. Ask questions that show your confusion but also your eagerness to learn.",
                        teachingObjectives: [
                            {
                                objectiveName: "Variable Basics",
                                objectiveDescription: "Help Alex understand what variables are and how they store data",
                                private: {
                                    gradingCriteria: "Teacher should explain variables as storage containers and demonstrate basic assignment"
                                }
                            },
                            {
                                objectiveName: "Dynamic Typing",
                                objectiveDescription: "Explain how Python variables can change types",
                                private: {
                                    gradingCriteria: "Teacher should show how the same variable can hold different types of data"
                                }
                            }
                        ],
                        skillName: "Python Variables"
                    },
                    explanation: "This is a good example because it:\n- Has a realistic teaching scenario\n- Character has clear confusion points\n- Objectives are specific and measurable\n- Setting supports learning\n- Includes clear grading criteria"
                }, {
                    name: "bad_example",
                    quality: "bad",
                    output: {
                        version: '0.0.0',
                        type: 'teach-the-ai',
                        aiInstructions: "You don't understand programming",
                        skillName: "Programming"
                    },
                    explanation: "This is a poor example because it:\n- Missing structured setting\n- No character personality\n- No specific objectives\n- Too vague instructions\n- No grading criteria"
                }]
            }],
            finalInstructions: async () => `
                <FINAL_INSTRUCTIONS description="Final checks and reminders for the activity">
                    <SETTING_QUALITY description="Ensuring the setting is appropriate">
                        - Setting supports teaching interaction
                        - Description is clear and engaging
                        - Emoji is relevant and appropriate
                        - Environment encourages learning
                    </SETTING_QUALITY>

                    <CHARACTER_VALIDATION description="Validating the character">
                        - Character has clear personality
                        - Confusion points are specific
                        - Emoji matches character
                        - Instructions guide meaningful interaction
                    </CHARACTER_VALIDATION>

                    <OBJECTIVE_VALIDATION description="Validating teaching objectives">
                        - Objectives are specific and measurable
                        - Grading criteria is clear
                        - Goals are achievable
                        - Teaching approach is feasible
                    </OBJECTIVE_VALIDATION>
                </FINAL_INSTRUCTIONS>
            `
        };
    }

    createEmptyConfig(): TeachTheAIActivityConfigV0_1_0 {
        return {
            version: "0.1.0",
            type: this.type,
            setting: {
                emoji: "",
                name: "",
                description: ""
            },
            characterName: "",
            characterEmoji: "",
            narratorIntro: "",
            characterInstructions: "",
            skillName: "",
            teachingObjectives: []
        } as TeachTheAIActivityConfigV0_1_0;
    }

    async getCompletedTip(result: TeachTheAIResult): Promise<string | undefined> {    
        if (result?.feedback?.markdownFeedback) {
            return result.feedback.markdownFeedback;
        }
        return undefined;
    }

    override evaluateConfig = async ({config, request, ai}: {config: TeachTheAIActivityConfig, request: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues}, ai: AI}): Promise<{isValid: boolean, feedback: {issues: {issue: string, suggestedFix: string | null}[] | null, generalFeedback: string | null}}> => {
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
                            Your task is to evaluate if the generated teach-the-ai activity follows all the instructions and requirements.
                            The goal is to identify genuine problems that would make the activity ineffective, NOT to suggest minor improvements.
                            
                            <CORE_PRINCIPLE>
                                If an activity effectively creates an opportunity for teaching and learning through interaction, it should be marked as valid,
                                even if you can think of ways it could be marginally improved.
                                DO NOT suggest improvements to activities that are already working well.
                            </CORE_PRINCIPLE>

                            <EVALUATION_PRINCIPLES>
                                - A focused teaching scenario with clear objectives is often better than a complex one
                                - If the character and setting support learning, it's working
                                - Teaching objectives should be achievable in short interactions
                                - Character should have specific, relevant confusion points
                            </EVALUATION_PRINCIPLES>

                            <CRITICAL_ISSUES description="ONLY flag these as problems">
                                - Missing or inappropriate emojis
                                - Unclear or missing setting description
                                - Vague or missing character personality
                                - Teaching objectives without clear criteria
                                - Technical errors or incorrect information
                                - Character instructions that don't guide interaction
                            </CRITICAL_ISSUES>

                            <AUTOMATIC_PASS description="Automatically pass activities that have these">
                                - Clear, supportive setting
                                - Well-defined character with specific confusion
                                - Appropriate emojis
                                - Achievable teaching objectives
                                - Clear grading criteria
                            </AUTOMATIC_PASS>

                            <ABSOLUTELY_DO_NOT_FLAG description="Never mention these as issues">
                                - Could have more objectives
                                - Could have more character background
                                - Could be more challenging
                                - Setting could be more elaborate
                                - Could cover more concepts
                            </ABSOLUTELY_DO_NOT_FLAG>
                        </YOUR_TASK>

                        <EVALUATION_CONTEXT description="Context for evaluating a teach-the-ai activity">
                            <ACTIVITY_INSTRUCTIONS description="The instructions that were provided for generating this activity">
                                ${primaryInstructions}
                            </ACTIVITY_INSTRUCTIONS>

                            <EXAMPLES description="Examples of good and bad teach-the-ai activities">
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
                            ${config.version === '0.0.0' ? `
                                <INSTRUCTIONS>${config.aiInstructions}</INSTRUCTIONS>
                                <SKILL_NAME>${config.skillName}</SKILL_NAME>
                            ` : `
                                <SETTING>
                                    <EMOJI>${config.setting.emoji}</EMOJI>
                                    <NAME>${config.setting.name}</NAME>
                                    <DESCRIPTION>${config.setting.description}</DESCRIPTION>
                                </SETTING>
                                <CHARACTER>
                                    <NAME>${config.characterName}</NAME>
                                    <EMOJI>${config.characterEmoji}</EMOJI>
                                    <INSTRUCTIONS>${config.characterInstructions}</INSTRUCTIONS>
                                </CHARACTER>
                                <NARRATOR_INTRO>${config.narratorIntro}</NARRATOR_INTRO>
                                <SKILL_NAME>${config.skillName}</SKILL_NAME>
                                <TEACHING_OBJECTIVES>
                                    ${config.teachingObjectives.map(obj => 
                                        `<OBJECTIVE>
                                            <NAME>${obj.objectiveName}</NAME>
                                            <DESCRIPTION>${obj.objectiveDescription}</DESCRIPTION>
                                            <GRADING_CRITERIA>${obj.private.gradingCriteria}</GRADING_CRITERIA>
                                        </OBJECTIVE>`
                                    ).join('\n')}
                                </TEACHING_OBJECTIVES>
                            `}
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

    override postProcessConfig = async ({config, request, ai}: {config: TeachTheAIActivityConfig, request: ActivityGenerateRequest, ai: AI}): Promise<TeachTheAIActivityConfig> => {
        return config;
    }

    override gradeUserAnswer = async ({config, userAnswer, ai}: {config: TeachTheAIActivityConfig, userAnswer: TeachTheAISubmitRequest, ai: AI}): Promise<TeachTheAISubmitResult> => {
        // Extract the conversation from the user's answer
        const conversation = userAnswer.conversation;
        
        // For v0.1.0 config, we have teaching objectives to grade
        if (config.version === '0.1.0') {
            const teachingObjectives = (config as TeachTheAIActivityConfigV0_1_0).teachingObjectives;
            
            // Grade each objective
            const objectiveGrades = await Promise.all(teachingObjectives.map(async (objective) => {
                // Use AI to grade the objective based on the conversation
                const gradeResult = await ai.tools.oneShotAI({
                    systemMessage: trimLines(`
                        You are an expert teacher evaluator. Your task is to evaluate how well a teacher explained a concept to a student.
                        
                        The concept being taught is: ${(config as TeachTheAIActivityConfigV0_1_0).skillName}
                        
                        The specific objective being evaluated is: ${objective.objectiveName}
                        Description: ${objective.objectiveDescription}
                        
                        Grading criteria: ${objective.private.gradingCriteria}
                        
                        You will be given a conversation between a teacher (the user) and a student (the AI character named ${(config as TeachTheAIActivityConfigV0_1_0).characterName}).
                        
                        Evaluate how well the teacher met this specific objective on a scale from 0 to 1, where:
                        - 0 means the objective was not addressed at all
                        - 0.5 means the objective was partially addressed
                        - 1 means the objective was fully addressed
                    `),
                    functionName: "submitGrade",
                    functionDescription: "Submit a grade for the teaching objective",
                    functionParameters: z.object({
                        grade: z.number().min(0).max(1).describe("A decimal between 0 and 1 representing how well the objective was met"),
                        feedback: z.string().describe("Brief feedback explaining the grade"),
                    }),
                    otherMessages: conversation.map(msg => {
                        if (msg.role === 'user') {
                            return {
                                role: 'user' as const,
                                content: msg.content || "",
                            };
                        } else if (msg.role === 'assistant') {
                            return {
                                role: 'assistant' as const,
                                content: msg.content || "",
                            };
                        } else if (msg.role === 'system') {
                            return {
                                role: 'system' as const,
                                content: msg.content || "",
                            };
                        } else {
                            // Skip function messages or convert to a supported type
                            return {
                                role: 'system' as const,
                                content: `Function message: ${msg.content || ""}`,
                            };
                        }
                    }),
                });
                
                if (!gradeResult.success) {
                    throw new Error(`Failed to grade teaching objective: ${gradeResult.error}`);
                }
                
                const { grade, feedback } = gradeResult.data;
                
                return {
                    objectiveName: objective.objectiveName,
                    grade,
                    feedback,
                };
            }));
            
            // Calculate overall score (average of objective grades)
            const overallScore = objectiveGrades.reduce((sum, obj) => sum + obj.grade, 0) / objectiveGrades.length;
            
            // Generate overall feedback
            const overallFeedbackResult = await ai.tools.oneShotAI({
                systemMessage: trimLines(`
                    You are an expert teacher evaluator providing feedback on a teaching session.
                    
                    The concept being taught was: ${(config as TeachTheAIActivityConfigV0_1_0).skillName}
                    
                    You have the following grades for specific objectives:
                    ${objectiveGrades.map(og => `- ${og.objectiveName}: ${og.grade} - ${og.feedback}`).join('\n')}
                    
                    Provide concise, constructive overall feedback on the teaching session. Focus on strengths and areas for improvement.
                    Keep your feedback under 150 words.
                `),
                functionName: "provideFeedback",
                functionDescription: "Provide overall feedback on the teaching session",
                functionParameters: z.object({
                    feedback: z.string().describe("Concise, constructive feedback on the teaching session"),
                }),
                otherMessages: [],
            });
            
            if (!overallFeedbackResult.success) {
                throw new Error(`Failed to generate overall feedback: ${overallFeedbackResult.error}`);
            }
            
            const overallFeedback = overallFeedbackResult.data.feedback;
            
            // Create the details object
            const details: TeachTheAISubmitResultDetails = {
                objectiveGrades,
                overallFeedback,
            };
            
            return {
                score: overallScore,
                shortFeedback: overallFeedback,
                details,
            };
        } else {
            // For v0.0.0 config, we don't have specific objectives, so provide a simpler evaluation
            const evaluationResult = await ai.tools.oneShotAI({
                systemMessage: trimLines(`
                    You are an expert teacher evaluator. Your task is to evaluate how well a teacher explained a concept to a student.
                    
                    The concept being taught is: ${config.skillName}
                    
                    You will be given a conversation between a teacher (the user) and a student (the AI).
                    
                    Evaluate how well the teacher explained the concept on a scale from 0 to 1, where:
                    - 0 means the concept was not explained at all
                    - 0.5 means the concept was partially explained
                    - 1 means the concept was fully explained
                `),
                functionName: "submitEvaluation",
                functionDescription: "Submit an evaluation of the teaching session",
                functionParameters: z.object({
                    grade: z.number().min(0).max(1).describe("A decimal between 0 and 1 representing how well the concept was explained"),
                    feedback: z.string().describe("Brief feedback explaining the grade"),
                }),
                otherMessages: conversation.map(msg => {
                    if (msg.role === 'user') {
                        return {
                            role: 'user' as const,
                            content: msg.content || "",
                        };
                    } else if (msg.role === 'assistant') {
                        return {
                            role: 'assistant' as const,
                            content: msg.content || "",
                        };
                    } else if (msg.role === 'system') {
                        return {
                            role: 'system' as const,
                            content: msg.content || "",
                        };
                    } else {
                        // Skip function messages or convert to a supported type
                        return {
                            role: 'system' as const,
                            content: `Function message: ${msg.content || ""}`,
                        };
                    }
                }),
            });
            
            if (!evaluationResult.success) {
                throw new Error(`Failed to evaluate teaching session: ${evaluationResult.error}`);
            }
            
            const { grade, feedback } = evaluationResult.data;
            
            // Create the details object
            const details: TeachTheAISubmitResultDetails = {
                objectiveGrades: [{
                    objectiveName: "Teaching Effectiveness",
                    grade,
                    feedback,
                }],
                overallFeedback: feedback,
            };
            
            return {
                score: grade,
                shortFeedback: feedback,
                details,
            };
        }
    };
} 