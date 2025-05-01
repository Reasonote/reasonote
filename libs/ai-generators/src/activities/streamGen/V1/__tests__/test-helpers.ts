import * as _lodash from 'lodash';
import seedrandom from 'seedrandom';
import { expect } from 'vitest';
import { z } from 'zod';

import { AIGenerator } from '@reasonote/lib-ai-common';

/**
 * Collects activities from a generator and ensures that they are emitted at most every 10 seconds.
 * @param generator 
 * @returns 
 */
export async function collectActivities(generator: AsyncGenerator<any, any, any>) {
    const activities: any[] = [];
    let lastActivityTime = Date.now();
    for await (const activity of generator) {
      const now = Date.now();
      expect(now - lastActivityTime).toBeLessThanOrEqual(10_000);
      lastActivityTime = now;
      activities.push(activity);
    }
    return activities;
}

/**
 * Asserts that all activities in a stream have valid dependencies.
 * @param subject 
 * @param activities 
 * @param ai 
 */
export async function expectValidDependencies({subject, activities, ai}: {subject: any, activities: any[], ai: AIGenerator}) {    
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
        `
        
        const ret = idx === 0 ? undefined : await ai.genObject({
            schema: z.object({
                // activityIntroducesNewConcepts: z.array(z.string()),
                // activityExpectsConceptsToBeUnderstood: z.array(z.string()),
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

    const actsWithBadEvals = activitiesWithEvals.filter(actWithEval => actWithEval.evaluation !== undefined && actWithEval.evaluation.conceptIntroductionIsAppropriate === false);

    expect(actsWithBadEvals.length).toBe(0);
}


export async function expectInterestsMentioned({interests, activities, ai}: {interests: string[], activities: any[], ai: AIGenerator}) {  
    // First, we see if any of the interests were mentioned by name.
    const mentionedByName = interests.some(interest => activities.some(activity => JSON.stringify(activity).includes(interest)));
    
    if (mentionedByName) {
        // Success!
        return;
    }

    // If not, we try to see if any of the interests were mentioned implicitly.
    const ret = await ai.genObject({
            schema: z.object({
                // activityIntroducesNewConcepts: z.array(z.string()),
                // activityExpectsConceptsToBeUnderstood: z.array(z.string()),
                answerReasoning: z.string(),
                interestsMentioned: z.boolean().describe(`This should be set to true if the activities correctly mentions the user's interests.`)
            }),
            system: `
            <YOUR_ROLE>
                You are given a list of activities, and a list of the activities that came before it.

                You are to determine if the activity mentions the user's interests.

                It's enough if the interest is mentioned by name, or if it's implicitly mentioned by reference.

                Not all the interests have to be mentioned.
            </YOUR_ROLE>

            <CONTEXT>
                The user is a middle-of-the-road high-school student with the following interests:
                ${interests.map(interest => JSON.stringify(interest, null, 2)).join('\n')}
            </CONTEXT>


            ---------------------------------------
            
            <ACTIVITIES>
            ${activities.map(activity => JSON.stringify(activity, null, 2)).join('\n')}
            </ACTIVITIES>

            ---------------------------------------

            Remember -- it's enough if AT LEAST ONE interest is mentioned, or if it's implicitly mentioned by reference.

            `,
            model: 'openai:gpt-4o-mini'
    })

    console.log(ret?.object);

    expect(ret?.object.interestsMentioned).toBe(true);
}



// Seeded Lodash function
export const seedLodash = (seed: string) => {
    const orig = Math.random;
    seedrandom(seed, { global: true });
    const lodash = _lodash.runInContext();
    Math.random = orig;
    return lodash;
};