import _ from 'lodash';
import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import {
  TeachTheAIActivityConfigV0_1_0,
} from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { TeachTheAIActivityTypeServerV2 } from './server';

describe('TeachTheAIActivityTypeServerV2', () => {
    it('should provide correct gen config', async () => {
        const ai = createDefaultStubAI();
        const server = new TeachTheAIActivityTypeServerV2();
        
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
        expect(primaryInstructions).toContain('<SETTING');
        expect(primaryInstructions).toContain('<CHARACTER');
        expect(primaryInstructions).toContain('<TEACHING_OBJECTIVES');

        const finalInstructions = await config.finalInstructions?.(request);
        expect(finalInstructions).toBeDefined();
        expect(finalInstructions).toContain('<FINAL_INSTRUCTIONS');
        expect(finalInstructions).toContain('<SETTING_QUALITY');
        expect(finalInstructions).toContain('<CHARACTER_VALIDATION');
        expect(finalInstructions).toContain('<OBJECTIVE_VALIDATION');
    });

    it('should create empty config', () => {
        const server = new TeachTheAIActivityTypeServerV2();
        const emptyConfig = server.createEmptyConfig();

        expect(emptyConfig).toEqual({
            version: "0.1.0",
            type: 'teach-the-ai',
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
        });
    });

    it('should get completed tip from feedback', async () => {
        const server = new TeachTheAIActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'teach-the-ai',
            grade0to100: 100,
            resultData: {
                conversation: []
            },
            activityConfig: {
                version: '0.1.0',
                type: 'teach-the-ai',
                setting: {
                    emoji: "🏫",
                    name: "Test Setting",
                    description: "Test Description"
                },
                characterName: "Test Character",
                characterEmoji: "🤖",
                narratorIntro: "Test Intro",
                characterInstructions: "Test Instructions",
                skillName: "Test Skill",
                teachingObjectives: []
            },
            feedback: {
                markdownFeedback: 'Great job on teaching the concept!'
            }
        });

        expect(tip).toBe('Great job on teaching the concept!');
    });

    it('should return undefined when no feedback available', async () => {
        const server = new TeachTheAIActivityTypeServerV2();
        const tip = await server.getCompletedTip({
            type: 'graded',
            gradeType: 'graded-numeric',
            activityType: 'teach-the-ai',
            grade0to100: 100,
            resultData: {
                conversation: []
            },
            activityConfig: {
                version: '0.1.0',
                type: 'teach-the-ai',
                setting: {
                    emoji: "🏫",
                    name: "Test Setting",
                    description: "Test Description"
                },
                characterName: "Test Character",
                characterEmoji: "🤖",
                narratorIntro: "Test Intro",
                characterInstructions: "Test Instructions",
                skillName: "Test Skill",
                teachingObjectives: []
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
            const server = new TeachTheAIActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: TeachTheAIActivityConfigV0_1_0[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['teach-the-ai']
            })) {
                activities.push(activity as TeachTheAIActivityConfigV0_1_0);
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
            const server = new TeachTheAIActivityTypeServerV2();
            const result = await server.generate(request, ai, {
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            if (!result.success) {
                throw result.error;
            }
            return result.data as TeachTheAIActivityConfigV0_1_0;
        }
    }
];

describe.each(generationStrategies)('TeachTheAIActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: TeachTheAIActivityConfigV0_1_0;

    beforeAll(async () => {
        activity = await generateActivity({
            from: {
                skill: {
                    name: 'Teaching Fundamentals',
                    parentSkillIds: [],
                    parentSkillContext: 'Understanding how to teach effectively',
                }
            },
            otherMessages: [{
                role: 'user',
                content: 'Generate a teach-the-ai activity about effective learning strategies.'
            }]
        }, {
            subjectDefinitionString: 'Educational Psychology'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'teach-the-ai',
            version: expect.any(String),
            setting: expect.objectContaining({
                emoji: expect.any(String),
                name: expect.any(String),
                description: expect.any(String)
            }),
            characterName: expect.any(String),
            characterEmoji: expect.any(String),
            narratorIntro: expect.any(String),
            characterInstructions: expect.any(String),
            skillName: expect.any(String),
            teachingObjectives: expect.any(Array)
        });
    });

    it('should have non-empty content', () => {
        expect(activity.setting.emoji.length).toBeGreaterThan(0);
        expect(activity.setting.name.length).toBeGreaterThan(0);
        expect(activity.setting.description.length).toBeGreaterThan(0);
        expect(activity.characterName.length).toBeGreaterThan(0);
        expect(activity.characterEmoji.length).toBeGreaterThan(0);
        expect(activity.narratorIntro.length).toBeGreaterThan(0);
        expect(activity.characterInstructions.length).toBeGreaterThan(0);
        expect(activity.skillName.length).toBeGreaterThan(0);
        expect(activity.teachingObjectives.length).toBeGreaterThan(0);
    });

    it('should have well-structured teaching objectives', () => {
        activity.teachingObjectives.forEach(objective => {
            expect(objective.objectiveName.length).toBeGreaterThan(0);
            expect(objective.objectiveDescription.length).toBeGreaterThan(0);
            expect(objective.private.gradingCriteria.length).toBeGreaterThan(0);
        });
    });
}, {
    timeout: 30_000
});

describe('TeachTheAIActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new TeachTheAIActivityTypeServerV2();
        const config: TeachTheAIActivityConfigV0_1_0 = {
            version: '0.1.0',
            type: 'teach-the-ai',
            setting: {
                emoji: '',
                name: '',
                description: ''
            },
            characterName: '',
            characterEmoji: '',
            narratorIntro: '',
            characterInstructions: '',
            skillName: '',
            teachingObjectives: []
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
        const server = new TeachTheAIActivityTypeServerV2();
        const config: TeachTheAIActivityConfigV0_1_0 = {
            type: "teach-the-ai",
            version: "0.1.0",
            setting: {
                "emoji": "🏫",
                "name": "The Code Learning Center",
                "description": "A modern study space where programmers help each other learn. The room has comfortable seating and whiteboards for demonstrations."
              },
              "narratorIntro": "You're working on some programming exercises when Jamie, a fellow student, approaches you looking puzzled. They've been trying to grasp the concept of variables and data types in programming but keep getting confused.",
              "characterInstructions": "You are Jamie, a beginner programmer who is struggling with understanding variables and data types. You know that variables store information, but you're unsure about how different data types work and when to use them. Ask questions that show your confusion but also your eagerness to learn.",
              "characterName": "Jamie",
              "characterEmoji": "🤔",
              "teachingObjectives": [
                {
                  "objectiveName": "Understanding Variables",
                  "objectiveDescription": "Help Jamie understand what variables are and how they are used to store data in programming.",
                  "private": {
                    "gradingCriteria": "Teacher should explain variables as named storage locations and demonstrate basic variable assignment."
                  }
                },
                {
                  "objectiveName": "Exploring Data Types",
                  "objectiveDescription": "Explain the different data types (e.g., integers, strings, booleans) and when to use each type.",
                  "private": {
                    "gradingCriteria": "Teacher should provide examples of each data type and explain their use cases."
                  }
                }
              ],
            skillName: "Variables and Data Types"
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

        console.log('RESULT', JSON.stringify(result, null, 2));

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(true);
        expect(result).toHaveProperty('feedback');
        expect(result.feedback.issues).toBeNull();
    }, 20_000);
}); 