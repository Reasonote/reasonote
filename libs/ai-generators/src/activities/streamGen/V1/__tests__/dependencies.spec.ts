import {
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { streamGenActivitiesV1 } from '../streamGenActivitiesV1';
import { ActivityGenerateRequestFullyDefined } from '../types';

// Mock the ActivitySchema
const ActivitySchema = z.object({
    // Add properties as needed
    type: z.string(),
    content: z.string(),
});

describe('streamGenActivitiesV1 -- dependencies simple', () => {
    it('Will not rush you through definitions', async () => {
        // Mock AI and request objects
        const ai = createDefaultStubAI();
        
        const subject = {
            skills: [{
                name: 'Economics'
            }]
        }
        
        const mockReq: ActivityGenerateRequestFullyDefined = {
            subject,
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
        for await (const activity of generator) {
            console.log('yielded', activity);
            activities.push(activity);
        }

        // For every activity but the first, perform a check to see if the concepts are correctly introduced
        

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

                <EVALUATION_GUIDELINES>
                    When creating activities that *evaluate the user's knowledge*, make sure that:
                    1. The evaluation covers only the information that has been introduced in previous activities.
                    2. The evaluation is not too difficult or unfair, and that the user has a chance to succeed.
                    3. The evaluation is not too easy or boring, and that the user has a chance to learn from it.
                </EVALUATION_GUIDELINES>
            </CRITICAL>
            `
            
            const ret = idx === 0 ? undefined : await ai.genObject({
                schema: z.object({
                    // activityIntroducesNewConcepts: z.array(z.string()),
                    // activityExpectsConceptsToBeUnderstood: z.array(z.string()),
                    answerReasoning: z.string(),
                    conceptIntroductionIsAppropriate: z.boolean().nullish().describe(`
                        If this is an informational activity, this should be set to true if:
                            1. EXPLICIT INTRODUCTION: All prerequisite concepts in this activity have already been explicitly mentioned by name in previous activities.
                            2. IMPLICIT INTRODUCTION: The concepts being introduced logically follow from broader concepts or ideas presented in previous activities, even if not explicitly named.
                            3. REASONABLE PROGRESSION: The new concepts represent a natural and reasonable next step in learning about the subject, given what has been covered so far.
                            4. ASSUMED PRIOR KNOWLEDGE: For introductory activities on a topic, some basic concepts can be assumed as prior knowledge for a middle-of-the-road high school student.
                        
                        Note: This should be true even if the concepts are being introduced for the first time, as long as their introduction is appropriate given the context and previous activities.
                    `),
                    evaluationIsAppropriate: z.boolean().nullish().describe(`
                        IF THIS IS AN EVALUATION ACTIVITY:
                        This should be set to true if:
                        1. The evaluation covers only the information that has been introduced in previous activities.
                        2. The evaluation is not too difficult or unfair, and that the user has a chance to succeed.
                        3. The evaluation is not too easy or boring, and that the user has a chance to learn from it.
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
                    ${JSON.stringify(subject, null, 2)}
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
            })

            return {
                previousActivities,
                activity,
                evaluation: ret?.object
            }
        }));

        const actsWithBadConceptIntroduction = activitiesWithEvals.filter(actWithEval => actWithEval.evaluation?.conceptIntroductionIsAppropriate === false);
        const actsWithBadEvaluation = activitiesWithEvals.filter(actWithEval => actWithEval.evaluation?.evaluationIsAppropriate === false);

        console.log(JSON.stringify({ actsWithBadConceptIntroduction, actsWithBadEvaluation }, null, 2));

        expect(actsWithBadConceptIntroduction.length).toBe(0);
        expect(actsWithBadEvaluation.length).toBe(0);

        // One of the activities should make reference to the user's interest
        expect(activities.some(activity => JSON.stringify(activity).toLowerCase().includes('soccer'))).toBe(true);
    }, { timeout: 90_000 });
});