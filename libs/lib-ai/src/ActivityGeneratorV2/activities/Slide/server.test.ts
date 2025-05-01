import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { SlideActivityConfig } from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { SlideActivityTypeServerV2 } from './server';

describe('SlideActivityTypeServerV2', () => {
    it('should provide correct gen config', async () => {
        const ai = createDefaultStubAI();
        const server = new SlideActivityTypeServerV2();
        
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
        expect(config.schema).toBeDefined();
        expect(config.shortDescription).toContain('slide');
        
        // Check instructions
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
        expect(primaryInstructions).toContain('<TITLE');
        expect(primaryInstructions).toContain('<CONTENT');
        expect(primaryInstructions).toContain('<FORMATTING');

        const finalInstructions = await config.finalInstructions?.(request);
        expect(finalInstructions).toBeDefined();
        expect(finalInstructions).toContain('<FINAL_INSTRUCTIONS');
        expect(finalInstructions).toContain('<CONTENT_QUALITY');
        expect(finalInstructions).toContain('<FORMATTING_VALIDATION');
        expect(finalInstructions).toContain('<VISUAL_BALANCE');
    });

    it('should create empty config', () => {
        const server = new SlideActivityTypeServerV2();
        const emptyConfig = server.createEmptyConfig();

        expect(emptyConfig).toEqual({
            version: "0.0.0",
            type: 'slide',
            titleEmoji: "",
            title: "",
            markdownContent: "",
        });
    });
}); 

const generationStrategies = [
    {
        name: 'ActivityGeneratorV2',
        generateActivity: async (request: ActivityGenerateRequest, override?: {
            subjectDefinitionString?: string;
        }) => {
            const ai = createDefaultStubAI();
            const server = new SlideActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: SlideActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['slide']
            })) {
                activities.push(activity as SlideActivityConfig);
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
            const server = new SlideActivityTypeServerV2();
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

describe.each(generationStrategies)('SlideActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: SlideActivityConfig;

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
                content: 'Generate a slide about variables and data types in programming.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Fundamentals'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'slide',
            version: expect.any(String),
            titleEmoji: expect.any(String),
            title: expect.any(String),
            markdownContent: expect.any(String),
        });
    });

    it('should have non-empty content', () => {
        expect(activity.title.length).toBeGreaterThan(0);
        expect(activity.titleEmoji.length).toBeGreaterThan(0);
        expect(activity.markdownContent.length).toBeGreaterThan(0);
    });

    it('should use proper markdown formatting', () => {
        // Check for markdown headers, lists, or emphasis
        const hasMarkdownFormatting = /^#{1,3}|[*-]|\`/.test(activity.markdownContent);
        expect(hasMarkdownFormatting).toBe(true);
    });

    it('should have well-structured content', () => {
        // Check for headers
        expect(activity.markdownContent).toMatch(/^#{1,3}\s.+/m);
        
        // Check for either lists or code blocks
        const hasListsOrCode = /^[-*]|```/.test(activity.markdownContent);
        expect(hasListsOrCode).toBe(true);
    });
}, {
    timeout: 30_000
});

describe('SlideActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new SlideActivityTypeServerV2();
        const config: SlideActivityConfig = {
            type: 'slide',
            version: '0.0.0',
            titleEmoji: '',
            title: 'Variables',
            markdownContent: 'They store data.',
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
        const server = new SlideActivityTypeServerV2();
        const config: SlideActivityConfig = {
            type: 'slide',
            version: '0.0.0',
            titleEmoji: '🐍',
            title: "Python Variables: Your Code's Memory",
            markdownContent: `
## What is a Variable?
A variable in Python is like a labeled container that holds data:

\`\`\`python
name = "Alice"    # String variable
age = 25         # Integer variable
height = 1.75    # Float variable
\`\`\`

### Key Points
- Variables store data in memory
- Names are case-sensitive
- Can hold different types of data
- Value can be changed anytime

### Best Practices
1. Use descriptive names
2. Follow Python naming conventions
3. Initialize before using
4. Keep names lowercase with underscores
`
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