import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { TermMatchingActivityConfig } from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { TermMatchingActivityTypeServerV2 } from './server';

describe('TermMatchingActivityTypeServerV2', () => {
    it('should provide correct gen config', async () => {
        const ai = createDefaultStubAI();
        const server = new TermMatchingActivityTypeServerV2();
        
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
            'termPairs',
            'instructions',
            'hardMode'
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
        expect(primaryInstructions).toContain('<TERM_PAIRS');
        expect(primaryInstructions).toContain('<INSTRUCTIONS_TEXT');
        expect(primaryInstructions).toContain('<DIFFICULTY_BALANCE');

        const finalInstructions = await config.finalInstructions?.(request);
        expect(finalInstructions).toBeDefined();
        expect(finalInstructions).toContain('<FINAL_INSTRUCTIONS');
        expect(finalInstructions).toContain('<CONTENT_QUALITY');
        expect(finalInstructions).toContain('<FORMATTING_VALIDATION');
        expect(finalInstructions).toContain('<DIFFICULTY_BALANCE');
    });

    it('should create empty config', () => {
        const server = new TermMatchingActivityTypeServerV2();
        const emptyConfig = server.createEmptyConfig();

        expect(emptyConfig).toEqual({
            version: "0.0.1",
            type: 'term-matching',
            termPairs: [
                { term: "", definition: "" },
                { term: "", definition: "" }
            ],
            instructions: "Match the terms with their correct definitions.",
            hardMode: false
        });
    });
});

describe('TermMatchingActivityTypeServerV2 Basics', () => {
    // ... existing basic tests ...
});

const generationStrategies = [
    {
        name: 'ActivityGeneratorV2',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new TermMatchingActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: TermMatchingActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['term-matching']
            })) {
                activities.push(activity as TermMatchingActivityConfig);
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
            const server = new TermMatchingActivityTypeServerV2();
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

describe.each(generationStrategies)('TermMatchingActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: TermMatchingActivityConfig;

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
                content: 'Generate a term matching activity about variables and data types in programming.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Fundamentals'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'term-matching',
            version: expect.any(String),
            termPairs: expect.any(Array),
            instructions: expect.any(String)
        });
    });

    it('should have valid term pairs', () => {
        expect(activity.termPairs.length).toBeGreaterThanOrEqual(2);
        expect(activity.termPairs.length).toBeLessThanOrEqual(10);
        
        activity.termPairs.forEach(pair => {
            expect(pair).toHaveProperty('term');
            expect(pair).toHaveProperty('definition');
            expect(pair.term.length).toBeGreaterThan(0);
            expect(pair.definition.length).toBeGreaterThan(0);
        });
    });

    it('should have clear instructions', () => {
        const instructions = activity.instructions;
        expect(instructions).toBeDefined();
        expect(instructions?.length).toBeGreaterThan(0);
        
        // Check if instructions mention matching
        expect(instructions?.toLowerCase()).toContain('match');
    });
}, {
    timeout: 30_000
});

describe('TermMatchingActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new TermMatchingActivityTypeServerV2();
        const config: TermMatchingActivityConfig = {
            version: '0.0.1',
            type: 'term-matching',
            termPairs: [
                { term: "a", definition: "something" },
                { term: "b", definition: "something else" }
            ],
            instructions: "",
            hardMode: false
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
        const server = new TermMatchingActivityTypeServerV2();
        const config: TermMatchingActivityConfig = {
            version: '0.0.1',
            type: 'term-matching',
            termPairs: [
                { term: "Variable", definition: "A named storage location in memory that holds a value" },
                { term: "Integer", definition: "A whole number data type used for counting and arithmetic" },
                { term: "String", definition: "A sequence of characters used to represent text" },
                { term: "Boolean", definition: "A data type that can only have true or false values" }
            ],
            instructions: "Match each programming concept with its correct definition. In hard mode, incorrect matches will reduce your score.",
            hardMode: true
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