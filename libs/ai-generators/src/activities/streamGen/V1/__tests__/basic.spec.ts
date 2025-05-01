import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { streamGenActivitiesV1 } from '../streamGenActivitiesV1';
import { ActivityGenerateRequestFullyDefined } from '../types';
import { expectInterestsMentioned } from './test-helpers';

// Mock the ActivitySchema
const ActivitySchema = z.object({
    // Add properties as needed
    type: z.string(),
    content: z.string(),
});

describe('streamGenActivitiesV1 basic', () => {
    it('should yield activities following special instructions', async () => {
        // Mock AI and request objects
        const ai = createDefaultStubAI();

        const mockReq = {
            specialInstructions: 'Please make four activities, gradually introducing the concept of derivatives. The first one a slide, the third a flash card, the second a multiple choice, and the fourth a matching activity.',
            subject: {
                skills: [{
                    name: 'Calculus'
                }]
            },
            context: {
                user: {

                }
            }
        };

        const generator = streamGenActivitiesV1({ ai, req: mockReq });

        const activities: any[] = [];
        let lastActivityTime = Date.now();
        for await (const activity of generator) {
            const now = Date.now();
            expect(now - lastActivityTime).toBeLessThanOrEqual(12_000);
            lastActivityTime = now;

            console.log(JSON.stringify(activity, null, 2));

            activities.push(activity);
        }

        console.log(JSON.stringify(activities, null, 2));

        // Should ideally be equal, but sometimes it gets giddy, and there's not much wrong with that tbh.
        expect(activities.length).toBeGreaterThanOrEqual(4);
        expect(['slide', 'slide-group'].includes(activities[0].type)).toBe(true);
        expect(JSON.stringify(activities[0]).toLowerCase()).toContain('derivative')
        expect(activities[1].type).toBe('multiple-choice');
        expect(JSON.stringify(activities[1]).toLowerCase()).toContain('derivative')
        expect(activities[2].type).toBe('flashcard');
        expect(JSON.stringify(activities[2]).toLowerCase()).toContain('derivative')
        expect(activities[3].type).toBe('term-matching');
        expect(JSON.stringify(activities[3]).toLowerCase()).toContain('derivative')
    }, { timeout: 30_000 });


    it('Produces analogies to user interests', async () => {
        // Mock AI and request objects
        const ai = createDefaultStubAI();

        const mockReq: ActivityGenerateRequestFullyDefined = {
            specialInstructions: `
            Please make four activities, gradually introducing the concepts. 
            
            The first one a slide, the third a flash card, the second a multiple choice, and the fourth a matching activity.
            

            ALSO:
            At least one activity should make reference one of the user's interests.
            `,
            subject: {
                skills: [{
                    name: 'Physics'
                }]
            },
            context: {
                user: {
                    feelings: [
                        {
                            id: '1',
                            feeling: 'likes',
                            subject_name: 'Soccer',
                            subject_type: 'sport'
                        }
                    ]
                }
            },
        };

        const generator = streamGenActivitiesV1({ ai, req: mockReq });

        const activities: any[] = [];
        let lastActivityTime = Date.now();
        for await (const activity of generator) {
            const now = Date.now();
            expect(now - lastActivityTime).toBeLessThanOrEqual(12_000);
            lastActivityTime = now;

            activities.push(activity);
        }

        console.log(JSON.stringify(activities, null, 2));

        expect(activities.length).toBeGreaterThanOrEqual(4);
        expect(['slide', 'slide-group'].includes(activities[0].type)).toBe(true);
        expect(activities[1].type).toBe('multiple-choice');
        expect(activities[2].type).toBe('flashcard');
        expect(activities[3].type).toBe('term-matching');

        // One of the activities should make reference to the user's interest
        expectInterestsMentioned({interests: ['soccer'], activities, ai});
    }, { timeout: 30_000 });

    it('Produces analogies to user interests -- hard-to-connect subjects, no prompting', async () => {
        // Mock AI and request objects
        const ai = createDefaultStubAI();

        const mockReq: ActivityGenerateRequestFullyDefined = {
            specialInstructions: `
            Please make four activities, gradually introducing the concepts. 
            
            The first one a slide, the third a flash card, the second a multiple choice, and the fourth a matching activity.
            `,
            subject: {
                skills: [{
                    name: 'Economics'
                }]
            },
            context: {
                user: {
                    feelings: [
                        {
                            id: '1',
                            feeling: 'likes',
                            subject_name: 'Soccer',
                            subject_type: 'sport'
                        }
                    ]
                }
            },
        };

        const generator = streamGenActivitiesV1({ ai, req: mockReq });

        const activities: any[] = [];
        let lastActivityTime = Date.now();
        for await (const activity of generator) {
            const now = Date.now();
            expect(now - lastActivityTime).toBeLessThanOrEqual(10_000);
            lastActivityTime = now;

            activities.push(activity);
        }

        console.log(JSON.stringify(activities, null, 2));

        expect(activities.length).toBeGreaterThanOrEqual(4);
        expect(['slide', 'slide-group'].includes(activities[0].type)).toBe(true);
        expect(activities[1].type).toBe('multiple-choice');
        expect(activities[2].type).toBe('flashcard');
        expect(activities[3].type).toBe('term-matching');

        // One of the activities should make reference to the user's interest
        expectInterestsMentioned({interests: ['soccer'], activities, ai});
    }, { timeout: 30_000 }); 
});