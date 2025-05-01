import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import {
  ShortAnswerActivityConfig,
  ShortAnswerResult,
} from '@reasonote/activity-definitions';
import { ActivityGenerateRequest } from '@reasonote/core';
import { AI } from '@reasonote/lib-ai';

import { createDefaultStubAI } from '../../../DefaultStubAI';
import { ActivityGeneratorV2 } from '../../ActivityGeneratorV2.priompt';
import {
  createHydratedValuesOverride,
  stubHydratedValues,
} from '../../test-utils';
import { ShortAnswerActivityTypeServerV2 } from './server';

describe('ShortAnswerActivityTypeServerV2', () => {
    const server = new ShortAnswerActivityTypeServerV2();
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
                    generalFeedback: 'Well-structured question with clear grading criteria',
                },
            },
        }),
    } as unknown as AI;

    describe('getGenConfig', () => {
        it('provides correct generation configuration', async () => {
            const mockRequest = {
                from: {
                    skill: {
                        name: 'Test Skill',
                        parentSkillIds: [],
                        parentSkillContext: '',
                    }
                }
            };

            const config = await server.getGenConfig(mockRequest, mockAI);

            // Check schema
            expect(config.schema instanceof z.ZodObject).toBe(true);
            const schema = config.schema as z.ZodObject<any>;
            expect(Object.keys(schema.shape)).toEqual([
                'type',
                'version',
                'questionText',
                'gradingCriteria'
            ]);
            
            // Check instructions
            const primaryInstructions = await config.primaryInstructions(mockRequest);
            expect(primaryInstructions).toBeDefined();
            expect(primaryInstructions).toContain('<INSTRUCTIONS');
            expect(primaryInstructions).toContain('<OVERVIEW');
            expect(primaryInstructions).toContain('<QUESTION');
            expect(primaryInstructions).toContain('<GRADING_CRITERIA');

            const finalInstructions = await config.finalInstructions?.(mockRequest);
            expect(finalInstructions).toBeDefined();
            expect(finalInstructions).toContain('<FINAL_INSTRUCTIONS');
            expect(finalInstructions).toContain('<QUESTION_QUALITY');
            expect(finalInstructions).toContain('<GRADING_CRITERIA_VALIDATION');
            expect(finalInstructions).toContain('<DIFFICULTY_BALANCE');
        });
    });

    describe('createEmptyConfig', () => {
        it('creates empty configuration with correct structure', () => {
            const emptyConfig = server.createEmptyConfig();
            
            expect(emptyConfig).toEqual({
                version: "0.0.0",
                type: 'short-answer',
                questionText: "",
                gradingCriteria: ""
            });
        });
    });

    describe('getCompletedTip', () => {
        it('returns feedback when available', async () => {
            const mockResult: ShortAnswerResult = {
                type: 'graded' as const,
                gradeType: 'graded-numeric' as const,
                activityType: 'short-answer' as const,
                grade0to100: 100,
                resultData: {
                    userAnswer: 'test answer'
                },
                activityConfig: {
                    type: 'short-answer' as const,
                    version: '0.0.0' as const,
                    questionText: 'test question',
                    gradingCriteria: 'test criteria'
                },
                feedback: {
                    aboveTheFoldAnswer: 'Great explanation of the concept!'
                },
                submitResult: {
                    details: {
                        shortExplanation: 'Great explanation of the concept!',
                        explanation: 'Great explanation of the concept!'
                    }
                }
            };
            
            const tip = await server.getCompletedTip(mockResult);
            expect(tip).toBe('Great explanation of the concept!');
        });

        it('returns undefined when no feedback available', async () => {
            const mockResult: ShortAnswerResult = {
                type: 'graded' as const,
                gradeType: 'graded-numeric' as const,
                activityType: 'short-answer' as const,
                grade0to100: 100,
                resultData: {
                    userAnswer: 'test answer'
                },
                activityConfig: {
                    type: 'short-answer' as const,
                    version: '0.0.0' as const,
                    questionText: 'test question',
                    gradingCriteria: 'test criteria'
                },
                submitResult: {
                    details: {
                        shortExplanation: 'Great explanation of the concept!',
                        explanation: 'Great explanation of the concept!'
                    }
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
            const server = new ShortAnswerActivityTypeServerV2();
            const generator = new ActivityGeneratorV2({
                activityTypeServers: [server],
                ai,
                getHydratedValuesOverride: createHydratedValuesOverride({
                    subjectDefinitionString: override?.subjectDefinitionString
                })
            });
            const activities: ShortAnswerActivityConfig[] = [];

            for await (const activity of generator.generateActivities({
                ...request,
                validActivityTypes: ['short-answer']
            })) {
                activities.push(activity as ShortAnswerActivityConfig);
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
            const server = new ShortAnswerActivityTypeServerV2();
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

describe.each(generationStrategies)('ShortAnswerActivityTypeServerV2 Generation using $name', ({ generateActivity }) => {
    let activity: ShortAnswerActivityConfig;

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
                content: 'Generate a short answer question about variables and data types in programming.'
            }]
        }, {
            subjectDefinitionString: 'JavaScript Fundamentals'
        });
        console.log('GENERATED ACTIVITY:', JSON.stringify(activity, null, 2));
    }, 30_000);

    it('should have correct basic structure', () => {
        expect(activity).toMatchObject({
            type: 'short-answer',
            version: expect.any(String),
            questionText: expect.any(String),
            gradingCriteria: expect.any(String)
        });
    });

    it('should have non-empty content', () => {
        expect(activity.questionText.length).toBeGreaterThan(0);
        expect(activity.gradingCriteria.length).toBeGreaterThan(0);
    });

    // it('should use proper markdown formatting', () => {
    //     // Check for markdown formatting in question or grading criteria
    //     const hasMarkdownFormatting = /[*_`]/.test(activity.questionText) || /[*_`]/.test(activity.gradingCriteria);
    //     expect(hasMarkdownFormatting).toBe(true);
    // });

    it('should have well-structured grading criteria', () => {
        // Check for sections in grading criteria
        expect(activity.gradingCriteria).toMatch(/key points|excellent|poor|grading|criteria/i);
        
        // Check for bullet points or numbered lists
        const hasListStructure = /^[-*]|\d+\./.test(activity.gradingCriteria);
        expect(hasListStructure).toBe(true);
    });
}, {
    timeout: 30_000
}); 

describe('ShortAnswerActivityTypeServerV2 LaTeX Handling', () => {
    it('should handle LaTeX content correctly in postProcessConfig', async () => {
        const ai = createDefaultStubAI();
        const server = new ShortAnswerActivityTypeServerV2();
        const config: ShortAnswerActivityConfig = {
            type: 'short-answer',
            version: '0.0.0',
            questionText: "Explain why the following equation represents exponential growth: $\\frac{dy}{dx} = ky$ where k is a constant. Include the solution and its interpretation.",
            gradingCriteria: `
                Key points to address:
                1. Identify that this is a first-order differential equation
                2. Show that the solution is $y = Ce^{kx}$ where C is a constant
                3. Explain why $e^{kx}$ represents exponential growth when k > 0
                4. Interpret the role of k as the growth rate

                Example of excellent answer:
                "This equation shows that the rate of change ($\\frac{dy}{dx}$) is proportional to the current value (y), with k as the proportionality constant. The solution $y = Ce^{kx}$ demonstrates exponential growth because..."

                Grading breakdown:
                - Correct identification of equation type: 25%
                - Accurate solution with proper LaTeX notation ($y = Ce^{kx}$): 25%
                - Clear explanation of exponential nature: 25%
                - Interpretation of parameters: 25%
            `
        };

        const processedConfig = await server.postProcessConfig({
            config,
            request: {
                from: {
                    skill: {
                        name: 'Differential Equations',
                        parentSkillIds: [],
                        parentSkillContext: 'Understanding exponential growth and decay',
                    }
                }
            },
            ai
        });

        // Verify LaTeX commands are properly formatted (single backslash in output)
        expect(processedConfig.questionText).toContain('\\frac{dy}{dx}');
        expect(processedConfig.questionText).toContain('ky');
        expect(processedConfig.gradingCriteria).toContain('Ce^{kx}');
        expect(processedConfig.gradingCriteria).toContain('\\frac{dy}{dx}');

        // Verify LaTeX is wrapped in <latex> tags
        expect(processedConfig.questionText).toMatch(/<latex>\\frac{dy}{dx} = ky<\/latex>/);
        expect(processedConfig.gradingCriteria).toMatch(/<latex>y = Ce\^{kx}<\/latex>/);
        expect(processedConfig.gradingCriteria).toMatch(/<latex>\\frac{dy}{dx}<\/latex>/);

        // Verify $ delimiters are replaced
        expect(processedConfig.questionText).not.toContain('$');
        expect(processedConfig.gradingCriteria).not.toContain('$');
    }); 

    it('should preserve code blocks and backticks', async () => {
        const ai = createDefaultStubAI();
        const server = new ShortAnswerActivityTypeServerV2();
        const config: ShortAnswerActivityConfig = {
            type: 'short-answer',
            version: '0.0.0',
            questionText: `
                Consider the following code and its mathematical representation:
                \`\`\`python
                def f(x):
                    return x * 2
                \`\`\`
                
                This can be written mathematically as $f(x) = 2x$. Explain the relationship between the code and the mathematical notation.
            `,
            gradingCriteria: `
                Key points:
                - Code uses multiplication (\`*\`) which corresponds to mathematical notation $\\cdot$ or implicit multiplication
                - Function definition \`def f(x)\` corresponds to mathematical $f(x)$
                - Return statement maps to the equation $f(x) = 2x$
            `
        };

        const processedConfig = await server.postProcessConfig({
            config,
            request: {
                from: {
                    skill: {
                        name: 'Mathematical Programming',
                        parentSkillIds: [],
                        parentSkillContext: 'Understanding mathematical notation in programming',
                    }
                }
            },
            ai
        });

        // Verify code blocks are preserved (with indentation)
        expect(processedConfig.questionText).toMatch(/```python\n\s*def f\(x\):\n\s*return x \* 2\n\s*```/);
        
        // Verify inline code is preserved
        expect(processedConfig.gradingCriteria).toContain('`*`');
        expect(processedConfig.gradingCriteria).toContain('`def f(x)`');
        
        // Verify LaTeX is properly wrapped (single backslash in output)
        expect(processedConfig.questionText).toMatch(/<latex>f\(x\) = 2x<\/latex>/);
        expect(processedConfig.gradingCriteria).toMatch(/<latex>\\cdot<\/latex>/);
        expect(processedConfig.gradingCriteria).toMatch(/<latex>f\(x\)<\/latex>/);
        expect(processedConfig.gradingCriteria).toMatch(/<latex>f\(x\) = 2x<\/latex>/);

        // Verify $ delimiters are replaced
        expect(processedConfig.questionText).not.toContain('$');
        expect(processedConfig.gradingCriteria).not.toContain('$');
    });
}, {
    timeout: 10000
}); 

describe('ShortAnswerActivityTypeServerV2 Evaluation', () => {
    // beforeAll(() => {
    //     vi.spyOn(ActivityGeneratorV2.prototype, 'getHydratedValues').mockImplementation(() => Promise.resolve(stubHydratedValues()));
    // });

    // afterAll(() => {
    //     vi.restoreAllMocks();
    // });

    it('should evaluate config and provide feedback for bad config', async () => {
        const ai = createDefaultStubAI();
        const server = new ShortAnswerActivityTypeServerV2();
        const config: ShortAnswerActivityConfig = {
            type: 'short-answer',
            version: '0.0.0',
            questionText: 'What is a variable?',
            gradingCriteria: 'Student should know what a variable is.'
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
        const server = new ShortAnswerActivityTypeServerV2();
        const config: ShortAnswerActivityConfig = {
            type: 'short-answer',
            version: '0.0.0',
            questionText: "Explain why Python is considered a *dynamically typed* language. Include a code example to support your explanation.",
            gradingCriteria: `
                Key points that must be addressed:
                1. Definition of dynamic typing (variables can change types)
                2. Contrast with static typing
                3. Code example showing type changing
                4. Practical implications

                Example of excellent answer:
                "Python is dynamically typed because variable types are determined at runtime and can change. Unlike statically typed languages where you declare types upfront, Python variables can hold different types of data at different times. For example:
                x = 5          # x is an integer
                x = 'hello'    # now x is a string
                This flexibility makes Python more concise but requires careful attention to type changes."

                Example of poor answer:
                "Python is dynamic and variables can change."

                Grading breakdown:
                - Clear explanation of dynamic typing: 40%
                - Valid code example: 30%
                - Practical implications: 30%
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