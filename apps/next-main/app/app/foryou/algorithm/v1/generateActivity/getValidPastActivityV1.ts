import {
  GetActivitySkillWithResultsDocument,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";

import {FYPV1Context} from "../FYPV1Context";

export interface GetValidPastActivityV1Args { 
    skill: {
      id: string;
    },
    ctx: FYPV1Context;
    validActivityTypes: string[];
}

export async function getValidPastActivityV1({
    skill,
    ctx,
    validActivityTypes
}: GetValidPastActivityV1Args){
    const {ac, userId, activityQueue, recentActivityResults} = ctx;

    const activitySkillWithResultsResult = await ac.query({
        query: GetActivitySkillWithResultsDocument,
        variables: {
          filter: {
            skill: {
              eq: skill.id,
            },
          },
          userActivityResultCollectionFilter: {
            user: {
                eq: userId,
            }
          },
          orderBy: {
            createdDate: OrderByDirection.DescNullsLast,
          }
        },
    });

    const activitySkillsWithResults = activitySkillWithResultsResult.data.activitySkillCollection?.edges.map((e) => e.node);

    const validPastActivity = activitySkillsWithResults?.find((node) => {
        const activityResults = node.activity?.userActivityResultCollection?.edges?.map((e) => e.node);

        if (!activityResults){
            return false;
        }

        // First, we check if this activity has been added to the queue already.
        const isAlreadyInQueue = activityQueue.some((activity) => {
            return activity.activity.id === node.activity?.id;
        }) || activityQueue.some((activity) => {
            return activity.activity.id === node.activity?.id;
        })

        if (isAlreadyInQueue){
            return false;
        }

        // First, we check if this activity was shown in the past 3 cards.
        // If it was, we should not show it again.
        const wasShownRecently = recentActivityResults.slice(0,2).some((result) => {
            return result.activity?.id === node.activity?.id;
        })

        if (wasShownRecently){
            return false;
        }

        // Make sure it's of the right type.
        const isCorrectType = validActivityTypes.some((type) => {
            return node.activity?.type === type;
        })
        if (!isCorrectType){
            return false;
        }

        // We need to go through the first three activityResults ordered by their createdDate (from newest to oldest).
        // The user needs three perfect scores in a row to repair the activity.
        // Here, we are checking if the most recent three scores are perfect.
        // If they are, we should not show this activity.
        const recentSkillActivityResults = activityResults.slice(0, 1);

        const isUnrepaired =  recentSkillActivityResults.some((result) => result.scoreNormalized !== undefined && result.scoreNormalized !== null && result.scoreNormalized < 0.99)

        if (!isUnrepaired){
            return false;
        }

        return true;
    })

    return validPastActivity;
}