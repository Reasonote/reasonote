import _lodash from 'lodash';
import seedrandom from 'seedrandom';
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

// Seeded Lodash function
const seedLodash = (seed: string) => {
    const orig = Math.random;
    seedrandom(seed, { global: true });
    const lodash = _lodash.runInContext();
    Math.random = orig;
    return lodash;
};

const _ = seedLodash('SEED');

const SUBJECTS = ['Organic Chemistry', 'Economics', 'Physics', 'Literature', 'Computer Science'];
const INTERESTS = ['Soccer', 'Cooking', 'Photography', 'Gardening'];

function setupTest(subject: string, interest: string) {
    const ai = createDefaultStubAI();
    
    const mockReq: ActivityGenerateRequestFullyDefined = {
        subject: {
            skills: [{
                name: subject
            }]
        },
        context: {
            user: {
                feelings: [
                    {
                        id: '1',
                        feeling: 'likes',
                        subject_name: interest,
                        subject_type: 'interest'
                    }
                ]
            }
        },
    };

    return { ai, mockReq};
}

async function runTest(subject: string, interest: string) {
    const { ai, mockReq} = setupTest(subject, interest);
    const generator = streamGenActivitiesV1({ ai, req: mockReq });

    const activities: any[] = [];
    for await (const activity of generator) {
        activities.push(activity);
    }

    const activitiesWithEvals = await Promise.all(activities.map(async (activity, idx) => {
        const previousActivities = activities.slice(0, idx);

        const criticalSection = `
        <CRITICAL>
            <CONCEPT_INTRODUCTION_GUIDELINES>
                1. New concepts can be introduced if they logically follow from previously introduced broader concepts.
                2. Not every prerequisite needs to be explicitly mentioned by name in previous activities.
                3. Consider the natural progression of ideas within the subject area.
                4. Assume reasonable prior knowledge based on the broader topic introduction.
                5. Evaluate whether the new concept is a natural next step given what has been covered so far.
            </CONCEPT_INTRODUCTION_GUIDELINES>
        </CRITICAL>
        `;
        
        const ret = idx === 0 ? undefined : await ai.genObject({
            schema: z.object({
                answerReasoning: z.string(),
                conceptIntroductionIsAppropriate: z.boolean().describe(`This should be set to true if:
                    1. EXPLICIT INTRODUCTION: All prerequisite concepts in this activity have already been explicitly mentioned by name in previous activities.
                    2. IMPLICIT INTRODUCTION: The concepts being introduced logically follow from broader concepts or ideas presented in previous activities, even if not explicitly named.
                    3. REASONABLE PROGRESSION: The new concepts represent a natural and reasonable next step in learning about the subject, given what has been covered so far.
                    4. ASSUMED PRIOR KNOWLEDGE: For introductory activities on a topic, some basic concepts can be assumed as prior knowledge for a middle-of-the-road high school student.
                    
                    Note: This should be true even if the concepts are being introduced for the first time, as long as their introduction is appropriate given the context and previous activities.
                `)
            }),
            system: `
            <YOUR_ROLE>
                You are given an activity, and a list of the activities that came before it.

                You are to determine if the activity 

                An activity can be responsible for introducing concepts, or it can be responsible for using concepts that were introduced in a previous activity.

                ${criticalSection}
            </YOUR_ROLE>

            <CONTEXT>
                The user is a middle-of-the-road high-school student trying to learn about the subject: 
                ${JSON.stringify(mockReq.subject, null, 2)}
            </CONTEXT>

            ---------------------------------------
            
            <FINAL_ACTIVITY>
            ${JSON.stringify(activity, null, 2)}
            </FINAL_ACTIVITY>
            
            <PREVIOUS_ACTIVITIES>
            ${previousActivities.map(activity => JSON.stringify(activity, null, 2)).join('\n')}
            </PREVIOUS_ACTIVITIES>

            ---------------------------------------

            ${criticalSection}
            `,
            model: 'openai:gpt-4o-mini'
        });

        return {
            previousActivities,
            activity,
            evaluation: ret?.object
        };
    }));

    const actsWithBadEvals = activitiesWithEvals.filter(actWithEval => actWithEval.evaluation !== undefined && actWithEval.evaluation.conceptIntroductionIsAppropriate === false);

    expect(actsWithBadEvals.length).toBe(0);

    // One of the activities should make reference to the user's interest
    expectInterestsMentioned({interests: [interest], activities, ai});
}

describe('streamGenActivitiesV1 -- dependencies-matrix', () => {
    const runComplexTests = process.env.RUN_COMPLEX_TESTS === 'true';

    if (runComplexTests) {
        describe.concurrent('Complex test matrix', () => {
            const testMatrix = SUBJECTS.flatMap(subject => 
                INTERESTS.flatMap(interest => ({ subject, interest }))
            );

            testMatrix.forEach(({ subject, interest }) => {
                it(`Will not rush through definitions for ${subject} with interest in ${interest}`, async () => {
                    await runTest(subject, interest);
                }, { timeout: 90_000 });
            });
        });
    } else {
        it('Will not rush through definitions (default case)', async () => {
            await runTest('Economics', 'Soccer');
        }, { timeout: 90_000 });
    }
});