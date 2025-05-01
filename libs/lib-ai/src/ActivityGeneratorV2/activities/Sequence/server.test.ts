import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { SequenceActivityConfig } from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import { createHydratedValuesOverride } from '../../test-utils';
import { SequenceActivityTypeServerV2 } from './server';

describe('SequenceActivityTypeServerV2', () => {
    const server = new SequenceActivityTypeServerV2();
    const mockAI = {
        prompt: {
            activities: {
                generateActivityContextString: async () => 'mock context',
            },
        },
        genObject: async () => ({
            object: {
                thinking: [{
                    reasoning: 'Good sequence structure',
                    possibleIssue: 'None',
                    severity: 'nit',
                }],
                result: {
                    isValid: true,
                    issues: null,
                    generalFeedback: 'Well-structured sequence with clear ordering',
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

        expect(config.schema).toBeDefined();
        expect(config.shortDescription).toContain('sequence');
        
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
        expect(instructions).toContain('PROMPT');
        expect(instructions).toContain('ITEMS');
    });

    it('should create empty config', () => {
        const emptyConfig = server.createEmptyConfig();
        
        expect(emptyConfig.type).toBe('sequence');
        expect(emptyConfig.version).toBe('0.0.1');
        expect(emptyConfig.prompt).toBe('');
        expect(emptyConfig.items).toEqual([]);
        expect(emptyConfig.aiScoringEnabled).toBe(true);
    });

    // Add more test cases for sequence-specific functionality
});

// Add generation strategy tests similar to MultipleChoice
const generationStrategies = [
    {
        name: 'ActivityGeneratorV2',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new SequenceActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: SequenceActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['sequence']
            })) {
                activities.push(activity as SequenceActivityConfig);
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
            const server = new SequenceActivityTypeServerV2();
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

describe.each(generationStrategies)('SequenceActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: SequenceActivityConfig;

    beforeAll(async () => {
        activity = await generateActivity({
            from: {
                skill: {
                    name: 'Programming Fundamentals',
                    parentSkillIds: [],
                    parentSkillContext: 'Understanding programming language concepts',
                }
            },
            otherMessages: [{
                role: 'user',
                content: 'Generate a sequence activity about the steps to create a function in JavaScript.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Programming'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'sequence',
            version: expect.any(String),
            prompt: expect.any(String),
            items: expect.any(Array),
        });
    });

    it('should have non-empty content', () => {
        expect(activity.prompt.length).toBeGreaterThan(0);
        expect(activity.items.length).toBeGreaterThan(0);
    });

    it('should have a reasonable number of items', () => {
        // Should have at least 3 items to sequence and no more than 10
        expect(activity.items.length).toBeGreaterThanOrEqual(3);
        expect(activity.items.length).toBeLessThanOrEqual(10);
    });

    it('should have valid items', () => {
        activity.items.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('label');
            expect(item.id.length).toBeGreaterThan(0);
            expect(item.label.length).toBeGreaterThan(0);
        });
    });
}, {
    timeout: 30_000
});

// Add more test suites for sequence-specific functionality