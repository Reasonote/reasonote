import { expect } from 'vitest';

import { expectAI } from '../../../testUtils/expectAI';
import {
  GetLessonOverviewBaseArgs,
  LessonOverviewItem,
} from '../types';

type TestCaseFields = ('slides' | 'practice')[];

// Define base test case type without the const arrays
type TestCaseData = Omit<GetLessonOverviewBaseArgs, 'ai' | 'fieldsToGet'> & {
    fieldsToGet: TestCaseFields;
};

export const TEST_CASES: Record<string, TestCaseData> = {
    basicAlgebra: {
        lessonContext: `
            This lesson is about basic algebra.
            Learning objectives:
            - Can solve linear equations
            - Can understand variables
        `,
        fieldsToGet: ['slides', 'practice'],
        skillContext: {
            name: 'Algebra',
            aiContext: 'Basic algebra fundamentals including variables and equations',
            resources: 'Example problems and explanations of algebraic concepts'
        }
    },
    slidesOnly: {
        lessonContext: 'A basic math lesson',
        fieldsToGet: ['slides'],
        skillContext: {
            name: 'Math',
            aiContext: 'Basic mathematics'
        }
    },
    withExisting: {
        lessonContext: 'A lesson about programming',
        fieldsToGet: ['slides', 'practice'],
        skillContext: {
            name: 'Programming',
            aiContext: 'Basic programming concepts'
        },
        existingActivities: {
            slides: [
                {
                    type: 'slide',
                    titleEmoji: '📚',
                    title: 'Existing Introduction',
                    content: 'This is an existing slide'
                }
            ],
            activities: [
                {
                    type: 'multiple-choice',
                    question: 'Existing question?'
                }
            ]
        }
    }
} as const;

export type TestCase = keyof typeof TEST_CASES;

export function runSharedTests(
    description: string,
    getItems: (testCase: TestCase) => Promise<LessonOverviewItem[]>
) {
    describe(description, () => {
        describe('basic request', () => {
            let items: LessonOverviewItem[];
            
            beforeAll(async () => {
                items = await getItems('basicAlgebra');
            }, 60_000);

            it('has pedagogically sound slide sequence', async () => {
                const slides = items.filter(item => item.type === 'slide');
                await expectAI(
                    `The slides should form a coherent learning sequence where:
                    - Each slide builds on previous concepts
                    - Technical terms are introduced before being used
                    - Examples follow concept introductions
                    - The progression is logical and natural`,
                    slides
                );
            });

            it('has appropriate activity difficulty progression', async () => {
                const activities = items.filter(item => item.type !== 'slide');
                await expectAI(
                    `The activities should show clear difficulty progression where:
                    - Early activities are simple and foundational
                    - Middle activities combine concepts
                    - Final activities require mastery
                    - No advanced concepts appear before basics`,
                    activities
                );
            });

            it('yields items with required properties', () => {
                for (const item of items) {
                    if (item.type === 'slide') {
                        expect(item.titleEmoji).toBeDefined();
                        expect(item.title).toBeDefined();
                        expect(item.content).toBeDefined();
                    } else {
                        expect(item.type).toBeDefined();
                    }
                }
            });

            describe('slides', () => {
                let slides: LessonOverviewItem[];
                
                beforeAll(() => {
                    slides = items.filter(item => item.type === 'slide');
                });

                it('has correct number of slides', () => {
                    expect(slides.length).toBeGreaterThanOrEqual(5);
                    expect(slides.length).toBeLessThanOrEqual(8);
                });

                it('starts with introduction slide', () => {
                    expect(slides[0].title.toLowerCase()).toContain('introduction');
                });

                it('ends with summary slide', () => {
                    expect(slides[slides.length - 1].title.toLowerCase()).toContain('summary');
                });
            });

            describe('activities', () => {
                let activities: LessonOverviewItem[];
                
                beforeAll(() => {
                    activities = items.filter(item => item.type !== 'slide');
                });

                // it('has correct number of activities', () => {
                //     expect(activities.length).toBeGreaterThanOrEqual(12);
                //     expect(activities.length).toBeLessThanOrEqual(18);
                // });

                it('ends with complex/mastery activity', () => {
                    const lastActivity = activities[activities.length - 1];
                    expect(JSON.stringify(lastActivity).toLowerCase()).toMatch(/roleplay|teach-the-ai|short-answer/);
                });
            });
        });

        describe('slides only', () => {
            let items: LessonOverviewItem[];

            beforeAll(async () => {
                items = await getItems('slidesOnly');
            }, 30000);

            it('yields only slides', () => {
                expect(items.every(item => item.type === 'slide')).toBe(true);
            });

            it('maintains slide count constraints', () => {
                expect(items.length).toBeGreaterThanOrEqual(5);
                expect(items.length).toBeLessThanOrEqual(8);
            });
        });

        describe('existing activities', () => {
            let items: LessonOverviewItem[];

            beforeAll(async () => {
                items = await getItems('withExisting');
            }, 30000);

            it('does not duplicate existing slide content', () => {
                const slideContents = items
                    .filter(item => item.type === 'slide')
                    .map(slide => slide.content)
                    .join(' ');
                
                expect(slideContents).not.toContain('This is an existing slide');
            });

            it('maintains context in new content', () => {
                const slideContents = items
                    .filter(item => item.type === 'slide')
                    .map(slide => slide.content)
                    .join(' ');
                
                expect(slideContents.toLowerCase()).toContain('programming');
            });
        });
    });
} 