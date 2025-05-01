import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import {
  RoleplayActivityConfig,
  RoleplayActivityConfigv0_0_0,
  RoleplayResult,
} from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { RoleplayActivityTypeServerV2 } from './server';

describe('RoleplayActivityTypeServerV2', () => {
    const server = new RoleplayActivityTypeServerV2();
    const mockAI = {
        prompt: {
            activities: {
                generateActivityContextString: async () => 'mock context',
            },
        },
        genObject: async () => ({
            object: {
                thinking: [{
                    reasoning: 'Good roleplay structure',
                    possibleIssue: 'None',
                    severity: 'nit',
                }],
                result: {
                    isValid: true,
                    issues: null,
                    generalFeedback: 'Well-structured roleplay with clear objectives',
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
        expect(config.shortDescription).toContain('roleplay');
        
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
    });

    it('should create empty config', () => {
        const emptyConfig = server.createEmptyConfig();
        
        expect(emptyConfig.type).toBe('roleplay');
        expect(emptyConfig.version).toBe('0.0.0');
        expect(emptyConfig.setting).toBeDefined();
        expect(Array.isArray(emptyConfig.characters)).toBe(true);
        expect(Array.isArray(emptyConfig.userCharacter.objectives)).toBe(true);
    });

    describe('getCompletedTip', () => {
        it('returns feedback when available', async () => {
            const mockResult: RoleplayResult = {
                type: 'graded' as const,
                gradeType: 'graded-numeric' as const,
                activityType: 'roleplay' as const,
                grade0to100: 100,
                resultData: {
                    conversation: []
                },
                activityConfig: {
                    type: 'roleplay' as const,
                    version: '0.0.0' as const,
                    setting: {
                        name: 'test setting',
                        description: 'test description'
                    },
                    userCharacter: {
                        objectives: []
                    },
                    characters: []
                },
                feedback: {
                    markdownFeedback: 'Great job on the roleplay!'
                }
            };
            
            const tip = await server.getCompletedTip(mockResult);
            expect(tip).toBe('Great job on the roleplay!');
        });

        it('returns undefined when no feedback available', async () => {
            const mockResult: RoleplayResult = {
                type: 'graded' as const,
                gradeType: 'graded-numeric' as const,
                activityType: 'roleplay' as const,
                grade0to100: 100,
                resultData: {
                    conversation: []
                },
                activityConfig: {
                    type: 'roleplay' as const,
                    version: '0.0.0' as const,
                    setting: {
                        name: 'test setting',
                        description: 'test description'
                    },
                    userCharacter: {
                        objectives: []
                    },
                    characters: []
                }
            };
            
            const tip = await server.getCompletedTip(mockResult);
            expect(tip).toBeUndefined();
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
            const server = new RoleplayActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: RoleplayActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['roleplay']
            })) {
                activities.push(activity as RoleplayActivityConfig);
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
            const server = new RoleplayActivityTypeServerV2();
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

describe.each(generationStrategies)('RoleplayActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: RoleplayActivityConfig;

    beforeAll(async () => {
        activity = await generateActivity({
            from: {
                skill: {
                    name: 'Communication Skills',
                    parentSkillIds: [],
                    parentSkillContext: 'Developing effective communication skills',
                }
            },
            otherMessages: [{
                role: 'user',
                content: 'Generate a roleplay activity about effective workplace communication.'
            }]
        }, {
            subjectDefinitionString: 'Professional Communication'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'roleplay',
            version: expect.any(String),
            setting: expect.any(Object),
            characters: expect.any(Array),
            userCharacter: expect.any(Object),
        });
    });

    it('should have valid setting', () => {
        const setting = activity.setting as RoleplayActivityConfigv0_0_0['setting'];
        expect(setting.emoji).toBeDefined();
        expect(setting.emoji?.length).toBeGreaterThan(0);
        expect(setting.name.length).toBeGreaterThan(0);
        expect(setting.description.length).toBeGreaterThan(0);
    });

    it('should have appropriate characters', () => {
        const characters = activity.characters as RoleplayActivityConfigv0_0_0['characters'];
        expect(characters.length).toBeGreaterThanOrEqual(1);
        
        characters.forEach(character => {
            expect(character.public.name.length).toBeGreaterThan(0);
            expect(character.public.description.length).toBeGreaterThan(0);
            expect(character.private.personality.length).toBeGreaterThan(0);
        });
    });

    it('should have clear objectives', () => {
        const objectives = activity.userCharacter.objectives as RoleplayActivityConfigv0_0_0['userCharacter']['objectives'];
        expect(objectives.length).toBeGreaterThanOrEqual(1);
        
        objectives.forEach(objective => {
            expect(objective.objectiveDescription.length).toBeGreaterThan(0);
        });
    });

}, {
    timeout: 30_000
});

describe('RoleplayActivityTypeServerV2 Evaluation', () => {
    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new RoleplayActivityTypeServerV2();
        const config: RoleplayActivityConfig = {
            type: 'roleplay',
            version: '0.0.0',
            setting: {
                emoji: '💻',
                name: 'Computer Lab',
                description: 'A room with computers.'
            },
            characters: [{
                public: {
                    name: 'Teacher',
                    description: 'Teaches programming',
                    emoji: '👩‍🏫'
                },
                private: {
                    personality: 'Nice',
                    motivation: 'Help students learn'
                }
            }],
            userCharacter: {
                objectives: [{
                    objectiveName: 'Understand the Concept of Variables',
                    objectiveDescription: 'Demonstrate understanding of what variables are by explaining their purpose and how they are used to store data in programming.',
                    private: {
                        gradingCriteria: 'The student should be able to define a variable, describe its purpose, and provide examples of different data types that can be stored in variables.'
                    }
                }, {
                    objectiveName: 'Practice Creating Variables',
                    objectiveDescription: 'Practice creating variables with different data types and modifying their values through chat-based exercises.',
                    private: {
                        gradingCriteria: 'The student should successfully create variables of at least three different data types (e.g., integer, string, boolean) and modify their values based on given scenarios.'
                    }
                }, {
                    objectiveName: 'Apply Variables in Simple Programs',
                    objectiveDescription: 'Use variables in simple programming exercises to solve problems or perform calculations.',
                    private: {
                        gradingCriteria: 'The student should be able to write simple code snippets that use variables to perform tasks such as arithmetic operations or storing user input.'
                    }
                }]
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
        expect(result.isValid).toBe(false);
        expect(result).toHaveProperty('feedback');
        expect(Array.isArray(result.feedback.issues)).toBe(true);
    }, 10_000);

    it('should evaluate config and isValid true for good config', async () => {
        const ai = createDefaultStubAI();
        const server = new RoleplayActivityTypeServerV2();
        const config: RoleplayActivityConfig = {
            type: 'roleplay',
            version: '0.0.0',
            setting: {
                emoji: '🏛️',
                name: 'The Python Academy',
                description: 'A modern learning space where students explore programming concepts through dialogue and discovery. The room is equipped with computers, but the focus is on understanding core concepts through discussion.'
            },
            characters: [{
                public: {
                    name: 'Professor Ada',
                    description: 'An experienced Python instructor with a passion for helping students understand programming fundamentals.',
                    emoji: '👩‍🏫'
                },
                private: {
                    personality: 'Patient, encouraging, and uses analogies to explain complex concepts. Asks thought-provoking questions to guide students to their own discoveries.',
                    motivation: 'Help students learn'
                }
            }, {
                public: {
                    name: 'Student Alex',
                    description: 'A beginner programmer eager to learn but sometimes confused by new concepts.',
                    emoji: '👨‍💻'
                },
                private: {
                    personality: 'Curious, not afraid to ask questions, and willing to try new things even if they might be wrong.',
                    motivation: 'Learn programming'
                }
            }],
            userCharacter: {
                objectives: [{
                    objectiveName: 'Understand the Concept of Variables',
                    objectiveDescription: 'Demonstrate understanding of what variables are by explaining their purpose and how they are used to store data in programming.',
                    private: {
                        gradingCriteria: 'The student should be able to define a variable, describe its purpose, and provide examples of different data types that can be stored in variables.'
                    }
                }, {
                    objectiveName: 'Practice Creating Variables',
                    objectiveDescription: 'Practice creating variables with different data types and modifying their values through chat-based exercises.',
                    private: {
                        gradingCriteria: 'The student should successfully create variables of at least three different data types (e.g., integer, string, boolean) and modify their values based on given scenarios.'
                    }
                }, {
                    objectiveName: 'Apply Variables in Simple Programs',
                    objectiveDescription: 'Use variables in simple programming exercises to solve problems or perform calculations.',
                    private: {
                        gradingCriteria: 'The student should be able to write simple code snippets that use variables to perform tasks such as arithmetic operations or storing user input.'
                    }
                }]
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

        console.log('RESULT:', JSON.stringify(result, null, 2));

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(true);
        expect(result).toHaveProperty('feedback');
        expect(result.feedback.issues).toBeNull();
    }, 10_000);
}); 
