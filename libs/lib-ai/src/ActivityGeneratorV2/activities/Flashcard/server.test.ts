import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { FlashcardActivityConfig } from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { ActivityRequestHydratedValues } from '../../types';
import { FlashcardActivityTypeServerV2 } from './server';

describe('FlashcardActivityTypeServerV2', () => {
    it('should provide correct gen config', async () => {
        const ai = createDefaultStubAI();
        const server = new FlashcardActivityTypeServerV2();

        const config = await server.getGenConfig({
            from: {
                skill: {
                    name: 'Test Skill',
                    parentSkillIds: [],
                    parentSkillContext: '',
                }
            }
        }, ai);

        // Verify schema is a zod object with the expected fields
        expect(config.schema instanceof z.ZodObject).toBe(true);
        const schema = config.schema as z.ZodObject<any>;
        expect(Object.keys(schema.shape)).toEqual([
            'type',
            'version',
            'flashcardFront',
            'flashcardBack',
            'metadata'
        ]);

        // Verify instructions
        const request = {
            from: {
                skill: {
                    name: 'Test Skill',
                    parentSkillIds: [],
                    parentSkillContext: '',
                }
            }
        };

        // Check primary instructions XML structure
        const primaryInstructions = await config.primaryInstructions(request);
        expect(primaryInstructions).toBeDefined();
        expect(primaryInstructions).toContain('<INSTRUCTIONS');
        expect(primaryInstructions).toContain('<OVERVIEW');
        expect(primaryInstructions).toContain('<CARD_FRONT');
        expect(primaryInstructions).toContain('<CARD_BACK');
        expect(primaryInstructions).toContain('<METADATA');

        const finalInstructions = await config.finalInstructions?.(request);
        expect(finalInstructions).toBeDefined();
        expect(finalInstructions).toContain('<FINAL_INSTRUCTIONS');
        expect(finalInstructions).toContain('<CONTENT_QUALITY');
        expect(finalInstructions).toContain('<METADATA_VALIDATION');
        expect(finalInstructions).toContain('<DIFFICULTY_BALANCE');
    });

    it('should create empty config', () => {
        const server = new FlashcardActivityTypeServerV2();
        const emptyConfig = server.createEmptyConfig();

        expect(emptyConfig).toEqual({
            version: "0.0.0",
            type: 'flashcard',
            flashcardFront: "",
            flashcardBack: "",
        });
    });

    it('should get completed tip from feedback', async () => {
        const server = new FlashcardActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'flashcard',
            grade0to100: 100,
            resultData: {
                attestedLevel: 'GREAT'
            },
            activityConfig: {
                type: 'flashcard',
                version: '0.0.0',
                flashcardFront: 'test front',
                flashcardBack: 'test back'
            },
            feedback: {
                markdownFeedback: 'Great job on understanding the key concepts!'
            }
        });

        expect(tip).toBe('Great job on understanding the key concepts!');
    });

    it('should return undefined when no feedback available', async () => {
        const server = new FlashcardActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'flashcard',
            grade0to100: 100,
            resultData: {
                attestedLevel: 'GREAT'
            },
            activityConfig: {
                type: 'flashcard',
                version: '0.0.0',
                flashcardFront: 'test front',
                flashcardBack: 'test back'
            }
        });

        expect(tip).toBeUndefined();
    });
});

const generationStrategies = [
    {
        name: 'ActivityGeneratorV2',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            getHydratedValuesOverride?: (generator: ActivityGeneratorV2, req: ActivityGenerateRequest) => Promise<ActivityRequestHydratedValues>;
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new FlashcardActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: override?.getHydratedValuesOverride || 
                    createHydratedValuesOverride({ 
                        subjectDefinitionString: override?.subjectDefinitionString 
                    })
            });
            const activities: FlashcardActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['flashcard']
            })) {
                activities.push(activity as FlashcardActivityConfig);
            }

            return activities[0];
        }
    },
    {
        name: 'Direct Server Generation',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            getHydratedValuesOverride?: (generator: ActivityGeneratorV2, req: ActivityGenerateRequest) => Promise<ActivityRequestHydratedValues>;
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new FlashcardActivityTypeServerV2();

            const result = await server.generate(request, ai, {
                getHydratedValuesOverride: override?.getHydratedValuesOverride || 
                    createHydratedValuesOverride({
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

describe.each(generationStrategies)('FlashcardActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: FlashcardActivityConfig;

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
                content: 'Generate a flashcard about variables and data types in programming.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Fundamentals'
        });

        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'flashcard',
            version: expect.any(String),
            flashcardFront: expect.any(String),
            flashcardBack: expect.any(String),
        });
    });

    it('should have non-empty content', () => {
        expect(activity.flashcardFront.length).toBeGreaterThan(0);
        expect(activity.flashcardBack.length).toBeGreaterThan(0);
    });

    // it('should use proper markdown formatting', () => {
    //     // Check for markdown formatting in either front or back
    //     const hasMarkdown = /[*`]/.test(activity.flashcardFront) || 
    //                       /[*`]/.test(activity.flashcardBack);
    //     expect(hasMarkdown).toBe(true);
    // });

}, {
    timeout: 30_000
});

describe('FlashcardActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new FlashcardActivityTypeServerV2();
        const config: FlashcardActivityConfig = {
            type: 'flashcard',
            version: '0.0.0',
            flashcardFront: 'Variables',
            flashcardBack: 'They store data.',
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
    }, 10_000);

    it('should evaluate config and isValid true for good config', async () => {
        const ai = createDefaultStubAI();
        const server = new FlashcardActivityTypeServerV2();
        const config: FlashcardActivityConfig = {
            type: 'flashcard',
            version: '0.0.0',
            flashcardFront: 'What is a *variable* in Python?',
            flashcardBack: 'A variable is a named storage location that holds data. In Python, variables:\n- Are dynamically typed\n- Are created through assignment (e.g. `x = 5`)\n- Can store any type of data\n- Can be reassigned to different values',
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
    }, 10_000);
}); 