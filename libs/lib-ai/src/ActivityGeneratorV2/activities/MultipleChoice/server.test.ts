import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import {
  MultipleChoiceActivityConfig,
  MultipleChoiceActivityConfigv1_0_0,
  MultipleChoiceActivityTypeDefinition,
} from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { ActivityRequestHydratedValues } from '../../types';
import { MultipleChoiceActivityTypeServerV2 } from './server';

describe('MultipleChoiceActivityTypeServerV2', () => {
    const server = new MultipleChoiceActivityTypeServerV2();
    const mockAI = {
        prompt: {
            activities: {
                generateActivityContextString: async () => 'mock context',
            },
        },
        genObject: async () => ({
            object: {
                thinking: [{
                    reasoning: 'Good question structure',
                    possibleIssue: 'None',
                    severity: 'nit',
                }],
                result: {
                    isValid: true,
                    issues: null,
                    generalFeedback: 'Well-structured question with clear answer choices',
                },
            },
        }),
    } as unknown as AI;

    it('should provide correct gen config', async () => {
        const config = await server.getGenConfig({
            from: {
                skill: {
                    name: 'Test Skill',
                    parentSkillIds: [],
                    parentSkillContext: '',
                }
            }
        }, mockAI);

        // Check schema
        expect(config.schema).toBeDefined();
        expect(config.shortDescription).toContain('multiple choice');
        
        // Check instructions
        const instructions = await config.primaryInstructions({
            from: {
                skill: {
                    name: 'Test Skill',
                    parentSkillIds: [],
                    parentSkillContext: '',
                }
            }
        });
        expect(instructions).toContain('INSTRUCTIONS');
        expect(instructions).toContain('QUESTION');
        expect(instructions).toContain('ANSWER_CHOICES');
        expect(instructions).toContain('FOLLOW_UPS');

        // Check when to use/avoid
        expect(config.whenToUse).toContain('When testing understanding of concepts');
        expect(config.whenToAvoid).toContain('When multiple answers could be correct');

        // Check examples
        expect(config.examples).toBeDefined();
        expect(config.examples?.[0].outputs).toBeDefined();
        
        // Check final instructions
        const finalInstructions = await config.finalInstructions?.({
            from: {
                skill: {
                    name: 'Test Skill',
                    parentSkillIds: [],
                    parentSkillContext: '',
                }
            }
        });
        expect(finalInstructions).toContain('FINAL_INSTRUCTIONS');
        expect(finalInstructions).toContain('CONTENT_QUALITY');
        expect(finalInstructions).toContain('ANSWER_CHOICE_VALIDATION');
    });

    it('should create empty config', () => {
        const emptyConfig = server.createEmptyConfig();
        
        expect(emptyConfig.type).toBe('multiple-choice');
        expect(emptyConfig.version).toBe('1.0.0');
        expect(emptyConfig.question).toBe('');
        expect(emptyConfig.answerChoices).toEqual([]);
    });

    describe('evaluateConfig', () => {
        it('evaluates valid configuration correctly', async () => {
            const mockConfig: MultipleChoiceActivityConfigv1_0_0 = {
                type: 'multiple-choice',
                version: '1.0.0',
                question: 'What is 2 + 2?',
                answerChoices: [
                    { text: '4', isCorrect: true, followUp: 'Correct!' },
                    { text: '3', isCorrect: false, followUp: 'Try again.' },
                    { text: '5', isCorrect: false, followUp: 'Too high.' },
                    { text: '2', isCorrect: false, followUp: 'Too low.' },
                ],
            };

            const mockRequest: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues} = {
                from: {
                    skill: {
                        name: 'Python programming',
                        parentSkillIds: [],
                        parentSkillContext: '',
                    }
                },
                hydrated: stubHydratedValues(),
            };

            const result = await server.evaluateConfig({
                config: mockConfig,
                request: mockRequest,
                ai: mockAI,
            });

            expect(result.isValid).toBe(true);
            expect(result.feedback.issues).toBeNull();
            expect(result.feedback.generalFeedback).toBeDefined();
        });

        it('handles evaluation of basic configuration', async () => {
            const mockConfig: MultipleChoiceActivityConfigv1_0_0 = {
                type: 'multiple-choice',
                version: '1.0.0',
                question: 'Basic question?',
                answerChoices: [
                    { text: 'A', isCorrect: true },
                    { text: 'B', isCorrect: false },
                ],
            };

            const mockRequest: ActivityGenerateRequest & {hydrated: ActivityRequestHydratedValues} = {
                from: {
                    skill: {
                        name: 'Python programming',
                        parentSkillIds: [],
                        parentSkillContext: '',
                    }
                },
                hydrated: stubHydratedValues(),
            };

            const result = await server.evaluateConfig({
                config: mockConfig,
                request: mockRequest,
                ai: mockAI,
            });

            expect(result.isValid).toBeDefined();
            expect(result.feedback).toBeDefined();
        });
    });

    it('should get completed tip from feedback', async () => {
        const server = new MultipleChoiceActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-pass-fail',
            activityType: 'multiple-choice',
            grade0to100: 100,
            resultData: {
                userAnswer: 'test'
            },
            activityConfig: {
                type: 'multiple-choice',
                version: '1.0.0',
                question: 'test',
                answerChoices: [
                    { text: 'test', isCorrect: true },
                ],
            },
            feedback: {
                markdownFeedback: 'Great job on selecting the correct answer!'
            },
            submitResult: {
                details: {
                    isCorrect: true,
                    followUp: 'Correct!',
                },
            }
        });

        expect(tip).toBe('Great job on selecting the correct answer!');
    });

    it('should return undefined when no feedback available', async () => {
        const server = new MultipleChoiceActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-pass-fail',
            activityType: 'multiple-choice',
            grade0to100: 100,
            resultData: {
                userAnswer: 'test'
            },
            activityConfig: {
                type: 'multiple-choice',
                version: '1.0.0',
                question: 'test',
                answerChoices: [
                    { text: 'test', isCorrect: true },
                ],
            },
            submitResult: {
                details: {
                    isCorrect: true,
                    followUp: 'Correct!',
                },
                score: 100,
                shortFeedback: 'Great job on selecting the correct answer!'
            }
        });

        expect(tip).toBeUndefined();
    });
});

const generationStrategies = [
    {
        name: 'ActivityGeneratorV2',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new MultipleChoiceActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: MultipleChoiceActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['multiple-choice']
            })) {
                activities.push(activity as MultipleChoiceActivityConfig);
            }

            return activities[0];
        }
    },
    {
        name: 'Direct Server Generation',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new MultipleChoiceActivityTypeServerV2();
            const result = await server.generate(request, ai, {
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            if (!result.success) {
                throw result.error;
            }
            return result.data;
        }
    }
];

describe.each(generationStrategies)('MultipleChoiceActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: MultipleChoiceActivityConfig;

    beforeAll(async () => {
        activity = await generateActivity({
            from: {
                skill: {
                    name: 'Basic Programming Concepts',
                    parentSkillIds: [],
                    parentSkillContext: 'Understanding fundamental programming concepts',
                }
            },
            otherMessages: [{
                role: 'user',
                content: 'Generate a multiple choice question about variables and data types in programming.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Fundamentals'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        // Convert to v1.0.0 if it's not already
        const activityV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(activity);
        
        expect(activityV1).toMatchObject({
            type: 'multiple-choice',
            version: expect.any(String),
            question: expect.any(String),
            answerChoices: expect.any(Array),
        });
    });

    it('should have non-empty content', () => {
        // Convert to v1.0.0 if it's not already
        const activityV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(activity);
        
        expect(activityV1.question.length).toBeGreaterThan(0);
        expect(activityV1.answerChoices.length).toBeGreaterThan(0);
    });

    it('should have a reasonable number of answer choices', () => {
        // Convert to v1.0.0 if it's not already
        const activityV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(activity);
        
        expect(activityV1.answerChoices.length).toBeGreaterThanOrEqual(3); // Minimum 3 choices
        expect(activityV1.answerChoices.length).toBeLessThanOrEqual(5); // Maximum 5 choices
    });

    it('should include at least one correct answer', () => {
        // Convert to v1.0.0 if it's not already
        const activityV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(activity);
        
        const hasCorrectAnswer = activityV1.answerChoices.some(choice => choice.isCorrect);
        expect(hasCorrectAnswer).toBe(true);
    });

    it('should have follow-ups for each answer choice', () => {
        // Convert to v1.0.0 if it's not already
        const activityV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(activity);
        
        // Each answer choice should have a follow-up
        activityV1.answerChoices.forEach(choice => {
            expect(choice.followUp).toBeDefined();
        });
    });
 
    // it('should use proper markdown formatting', () => {
    //     // Check for code formatting or emphasis
    //     const hasMarkdownFormatting = /`[^`]+`|\*[^*]+\*|```[^`]+```/.test(activity.question);
    //     expect(hasMarkdownFormatting).toBe(true);
    // }); 
}, {
    timeout: 30_000
});

describe('MultipleChoiceActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new MultipleChoiceActivityTypeServerV2();
        const config: MultipleChoiceActivityConfigv1_0_0 = {
            type: 'multiple-choice',
            version: '1.0.0',
            question: 'What is a variable?',
            answerChoices: [
                { text: 'A thing', isCorrect: true },
                { text: 'Another thing', isCorrect: false },
            ],
        };

        const result = await server.evaluateConfig({
            config,
            request: {
                from: {
                    skill: {
                        name: 'Programming Basics',
                        parentSkillIds: [],
                        parentSkillContext: '',
                    }
                },
                hydrated: stubHydratedValues()
            },
            ai
        });

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(false);
        expect(result).toHaveProperty('feedback');
        expect(Array.isArray(result.feedback.issues)).toBe(true);
    }, 30_000);

    it('should evaluate config and isValid true for good config', async () => {
        const ai = createDefaultStubAI();
        const server = new MultipleChoiceActivityTypeServerV2();
        const config: MultipleChoiceActivityConfigv1_0_0 = {
            type: 'multiple-choice',
            version: '1.0.0',
            question: 'In *Python*, what is the data type of the value in the code `x = 5`?',
            answerChoices: [
                { text: 'int', isCorrect: true, followUp: 'Correct! In Python, whole numbers are represented by the int (integer) data type.' },
                { text: 'str', isCorrect: false, followUp: 'Not quite. The value 5 is a number, not a string (text) value.' },
                { text: 'float', isCorrect: false, followUp: 'Close, but not quite. While 5 could be stored as a float, Python automatically uses int for whole numbers.' },
                { text: 'bool', isCorrect: false, followUp: 'Incorrect. Boolean values can only be True or False.' }
            ]
        };

        const result = await server.evaluateConfig({
            config,
            request: {
                from: {
                    skill: {
                        name: 'Programming Basics',
                        parentSkillIds: [],
                        parentSkillContext: '',
                    }
                },
                hydrated: stubHydratedValues()
            },
            ai
        });

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(true);
        expect(result).toHaveProperty('feedback');
        expect(result.feedback.issues).toBeNull();
    }, 30_000);
});

describe('MultipleChoiceActivityTypeServerV2 Deduplication', () => {
    it('should deduplicate answer choices in postProcessConfig', async () => {
        const server = new MultipleChoiceActivityTypeServerV2();
        
        // Create a config with duplicate answer choices (using v1.0.0 format)
        const configWithDuplicates: MultipleChoiceActivityConfigv1_0_0 = {
            type: 'multiple-choice',
            version: '1.0.0',
            question: 'What is 2 + 2?',
            answerChoices: [
                { text: '4', isCorrect: true, followUp: 'Correct!' },
                { text: '4', isCorrect: true, followUp: 'This is a duplicate.' },
                { text: '4', isCorrect: true, followUp: 'Another duplicate.' },
                { text: '4', isCorrect: true, followUp: 'Yet another duplicate.' },
            ],
        };

        const mockAI = {} as AI;
        const mockRequest = {} as ActivityGenerateRequest;

        // Process the config
        const processedConfig = await server.postProcessConfig({
            config: configWithDuplicates,
            request: mockRequest,
            ai: mockAI
        });

        // Convert to v1.0.0 if it's not already
        const processedConfigV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(processedConfig);
        
        // Verify that duplicates were removed (by text)
        const uniqueTexts = new Set(processedConfigV1.answerChoices.map(choice => choice.text));
        expect(uniqueTexts.size).toBe(1);
        expect(processedConfigV1.answerChoices.length).toBe(1);
        expect(processedConfigV1.answerChoices[0].text).toBe('4');
    });

    it('should generate and deduplicate answer choices when explicitly asked to create duplicates', async () => {
        const ai = createDefaultStubAI();
        const server = new MultipleChoiceActivityTypeServerV2();
        
        // Create a request that explicitly asks for duplicate answer choices
        const request: ActivityGenerateRequest = {
            from: {
                skill: {
                    name: 'Basic Math',
                    parentSkillIds: [],
                    parentSkillContext: 'Understanding basic math operations',
                }
            },
            additionalInstructions: 'Create a multiple choice question with exactly 4 answer choices, but make all the answer choices identical. Use the exact same text for all 4 options.'
        };

        // Generate the activity
        const result = await server.generate(request, ai);
        
        if (!result.success) {
            throw new Error('Failed to generate activity');
        }
        
        const activity = result.data;
        
        // Convert to v1.0.0 if it's not already
        const activityV1 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(activity);
        
        // Verify that the activity has only unique answer choices (by text)
        const uniqueTexts = new Set(activityV1.answerChoices.map(choice => choice.text));
        expect(uniqueTexts.size).toBe(activityV1.answerChoices.length);
        
        // Verify that each answer choice has a follow-up
        activityV1.answerChoices.forEach(choice => {
            expect(choice.followUp).toBeDefined();
        });
        
        // Verify that there is at least one correct answer
        const hasCorrectAnswer = activityV1.answerChoices.some(choice => choice.isCorrect);
        expect(hasCorrectAnswer).toBe(true);
    }, 30_000);
}); 