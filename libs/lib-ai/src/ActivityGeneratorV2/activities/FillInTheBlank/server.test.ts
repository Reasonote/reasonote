import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { FillInTheBlankActivityConfig } from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { FillInTheBlankActivityTypeServerV2 } from './server';

describe('FillInTheBlankActivityTypeServerV2', () => {
    const server = new FillInTheBlankActivityTypeServerV2();
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
                    generalFeedback: 'Well-structured question with proper span tags',
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
        expect(config.shortDescription).toContain('fill-in-the-blank');
        
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
        expect(instructions).toContain('QUESTION_STYLES');
        expect(instructions).toContain('HIDDEN_WORDS');
        expect(instructions).toContain('CONTENT_GUIDELINES');

        // Check when to use/avoid
        expect(config.whenToUse).toContain('When testing vocabulary comprehension');
        expect(config.whenToAvoid).toContain('When multiple correct answers are possible');

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
        expect(finalInstructions).toContain('TEXT_QUALITY');
        expect(finalInstructions).toContain('ANSWER_VALIDATION');
    });

    it('should create empty config', () => {
        const emptyConfig = server.createEmptyConfig();
        
        expect(emptyConfig.type).toBe('fill-in-the-blank');
        expect(emptyConfig.version).toBe('0.0.1');
        expect(emptyConfig.text).toBe('');
    });

    it('should get completed tip from feedback', async () => {
        const server = new FillInTheBlankActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'fill-in-the-blank',
            grade0to100: 100,
            resultData: {
                userAnswers: ['test']
            },
            activityConfig: {
                type: 'fill-in-the-blank',
                version: '0.0.1',
                text: 'test'
            },
            feedback: {
                aboveTheFoldAnswer: 'Great job on understanding the key concepts!'
            }
        });

        expect(tip).toBe('Great job on understanding the key concepts!');
    });

    it('should return undefined when no feedback available', async () => {
        const server = new FillInTheBlankActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'fill-in-the-blank',
            grade0to100: 100,
            resultData: {
                userAnswers: ['test']
            },
            activityConfig: {
                type: 'fill-in-the-blank',
                version: '0.0.1',
                text: 'test'
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
            const server = new FillInTheBlankActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: FillInTheBlankActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['fill-in-the-blank']
            })) {
                activities.push(activity as FillInTheBlankActivityConfig);
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
            const server = new FillInTheBlankActivityTypeServerV2();
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

describe.each(generationStrategies)('FillInTheBlankActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: FillInTheBlankActivityConfig;

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
                content: 'Generate a fill-in-the-blank activity about variables and data types in programming.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Fundamentals'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'fill-in-the-blank',
            version: expect.any(String),
            text: expect.any(String),
        });
    });

    it('should have non-empty content', () => {
        expect(activity.text.length).toBeGreaterThan(0);
    });

    it('should use proper span tag formatting', () => {
        const spanRegex = /<span id="hidden-word-\d+">[^<]+<\/span>/g;
        const matches = activity.text.match(spanRegex);
        expect(matches).toBeTruthy();
        expect(matches?.length).toBeGreaterThanOrEqual(1);
    });

    it('should have reasonable number of blanks', () => {
        const spanRegex = /<span id="hidden-word-\d+">[^<]+<\/span>/g;
        const matches = activity.text.match(spanRegex) || [];
        expect(matches.length).toBeGreaterThanOrEqual(1);
        expect(matches.length).toBeLessThanOrEqual(3);
    });

    // it('should use proper markdown formatting', () => {
    //     // Check for code formatting
    //     const hasCodeFormatting = /`[^`]+`/.test(activity.text) || /```[^`]+```/.test(activity.text);
    //     expect(hasCodeFormatting).toBe(true);
    // });

}, {
    timeout: 30_000
});

describe('FillInTheBlankActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new FillInTheBlankActivityTypeServerV2();
        const config: FillInTheBlankActivityConfig = {
            type: 'fill-in-the-blank',
            version: '0.0.1',
            text: 'A _____ is used to store data.',
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
        const server = new FillInTheBlankActivityTypeServerV2();
        const config: FillInTheBlankActivityConfig = {
            type: 'fill-in-the-blank',
            version: '0.0.1',
            text: 'In *Python* programming, a <span id="hidden-word-1">variable</span> is used to store data. For example, when we write `x = 5`, we create a <span id="hidden-word-2">variable</span> named `x` with an integer value.',
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


        console.log('EVALUATION_RESULT', JSON.stringify(result, null, 2));

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(true);
        expect(result).toHaveProperty('feedback');
        expect(result.feedback.issues).toBeNull();
    }, 10_000);
}); 