import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { ChooseTheBlankActivityConfig } from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { ChooseTheBlankActivityTypeServerV2 } from './server';

describe('ChooseTheBlankActivityTypeServerV2 Basics', () => {
    it('should provide correct gen config', async () => {
        const ai = createDefaultStubAI();
        const server = new ChooseTheBlankActivityTypeServerV2();
        
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
            'text',
            'hiddenWords',
            'wordChoices'
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

        const finalInstructions = await config.finalInstructions?.(request);
        expect(finalInstructions).toBeDefined();
    });

    it('should create empty config', () => {
        const server = new ChooseTheBlankActivityTypeServerV2();
        const emptyConfig = server.createEmptyConfig();

        expect(emptyConfig).toEqual({
            version: "0.0.0",
            type: 'choose-the-blank',
            text: "",
            hiddenWords: [],
            wordChoices: [],
        });
    });

    it('should get completed tip from feedback', async () => {
        const server = new ChooseTheBlankActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'choose-the-blank',
            grade0to100: 100,
            resultData: {
                selectedAnswers: ['test']
            },
            activityConfig: {
                type: 'choose-the-blank',
                version: '0.0.0',
                text: 'test',
                hiddenWords: ['test'],
                wordChoices: ['test']
            },
            feedback: {
                aboveTheFoldAnswer: 'Great job on understanding the key concepts!'
            }
        });

        expect(tip).toBe('Great job on understanding the key concepts!');
    });

    it('should return undefined when no feedback available', async () => {
        const server = new ChooseTheBlankActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'choose-the-blank',
            grade0to100: 100,
            resultData: {
                selectedAnswers: ['test']
            },
            activityConfig: {
                type: 'choose-the-blank',
                version: '0.0.0',
                text: 'test',
                hiddenWords: ['test'],
                wordChoices: ['test']
            }
        });

        expect(tip).toBeUndefined();
    });

    it('should generate valid choose-the-blank activity using ActivityGeneratorV2', async () => {
        
    });
}); 


const generationStrategies = [
    {
        name: 'ActivityGeneratorV2',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new ChooseTheBlankActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: ChooseTheBlankActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['choose-the-blank']
            })) {
                activities.push(activity as ChooseTheBlankActivityConfig);
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
            const server = new ChooseTheBlankActivityTypeServerV2();
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

describe.each(generationStrategies)('ChooseTheBlankActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: ChooseTheBlankActivityConfig;

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
                content: 'Generate a choose-the-blank activity about variables and data types in programming.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Fundamentals'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'choose-the-blank',
            version: expect.any(String),
            text: expect.any(String),
            hiddenWords: expect.any(Array),
            wordChoices: expect.any(Array),
        });
    });

    it('should have non-empty content', () => {
        expect(activity.text.length).toBeGreaterThan(0);
        expect(activity.hiddenWords.length).toBeGreaterThan(0);
        expect(activity.wordChoices.length).toBeGreaterThan(0);
    });

    it('should include all hidden words in word choices', () => {
        activity.hiddenWords.forEach((word: string) => {
            expect(activity.wordChoices).toContain(word);
        });
    });

    it('should have a reasonable number of word choices', () => {
        const expectedMinChoices = activity.hiddenWords.length; // At minimum, we need all correct answers
        const expectedMaxChoices = activity.hiddenWords.length * 4; // At maximum, 4 choices per blank
        
        expect(activity.wordChoices.length).toBeGreaterThanOrEqual(expectedMinChoices);
        expect(activity.wordChoices.length).toBeLessThanOrEqual(expectedMaxChoices);
    });

    it('should provide sufficient context around blanks', () => {
        const words = activity.text.split(/\s+/);
        const nonBlankWords = words.filter(word => !activity.hiddenWords.includes(word));
        
        expect(nonBlankWords.length).toBeGreaterThan(activity.hiddenWords.length);
    });

    it('should use proper formatting with spans', () => {
        // Check for span tags with IDs
        expect(activity.text).toMatch(/<span id="hidden-word-\d+">/);
    });
}, {
    timeout: 30_000
});


describe('ChooseTheBlankActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new ChooseTheBlankActivityTypeServerV2();
        const config: ChooseTheBlankActivityConfig = {
            type: 'choose-the-blank',
            version: '0.0.0',
            text: 'In programming, a _____ is used to store data.',
            hiddenWords: ['variable'],
            wordChoices: ['variable', 'function', 'class']
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

        console.log(result);

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(false);
        expect(result).toHaveProperty('feedback');
        expect(Array.isArray(result.feedback.issues)).toBe(true);
    }, 15_000);

    it('should evaluate config and fail for irrelevant distractors', async () => {
        const ai = createDefaultStubAI();
        const server = new ChooseTheBlankActivityTypeServerV2();
        const config: ChooseTheBlankActivityConfig = {
            type: 'choose-the-blank',
            version: '0.0.0',
            text: 'In Python, a <span id="hidden-word-1">variable</span> is used to store data that can change during program execution.',
            hiddenWords: ['variable'],
            wordChoices: [
                'variable',      // Correct answer
                'banana',        // ❌ Completely irrelevant
                'elephant',      // ❌ Completely irrelevant
                'sunshine',      // ❌ Completely irrelevant
                'pizza'         // ❌ Completely irrelevant
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

        console.log(JSON.stringify(result, null, 2));

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(false);
        expect(result).toHaveProperty('feedback');
        expect(Array.isArray(result.feedback.issues)).toBe(true);
    }, 15_000);

    it('should evaluate config and isValid true for good config', async () => {
        const ai = createDefaultStubAI();
        const server = new ChooseTheBlankActivityTypeServerV2();
        const config: ChooseTheBlankActivityConfig = {
            type: 'choose-the-blank',
            version: '0.0.0',
            text: 'In the python code snippet `x = 5`, `x` is best referred to as a <span id="hidden-word-1">variable</span>.',
            hiddenWords: ['variable'],
            wordChoices: [
                'variable',     // Correct answer for first blank
                'constant',     // Plausible distractor - similar concept
                'parameter',    // Plausible distractor - related to data storage
                'type',         // Correct answer for second blank
                'value',        // Plausible distractor - related but incorrect
                'scope'         // Plausible distractor - related concept
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

        console.log(JSON.stringify(result, null, 2));

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(true);
        expect(result).toHaveProperty('feedback');
        expect(result.feedback.issues).toBeNull();
    }, 15_000);
});
