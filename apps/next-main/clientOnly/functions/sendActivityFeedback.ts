import {ApolloClient} from "@apollo/client";
import {
  createUserActivityFeedbackFlatMutDoc,
  getUserActivityFeedbackFlatQueryDoc,
  updateUserActivityFeedbackFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";

export async function upsertActivityFeedback({ac, rsnUserId, feedback}: {ac: ApolloClient<any>, rsnUserId: string, feedback: {activityId: string, value: number, description?: string}}){
    // 1. Check to see if we already have feedback from this user for this activity
    const existingFeedback = await ac.query({
        query: getUserActivityFeedbackFlatQueryDoc,
        variables: {
            filter: {
                activity: {
                    eq: feedback.activityId
                },
                createdBy: {
                    eq: rsnUserId
                }
            },
        },
        fetchPolicy: "network-only"
    });

    const existingFeedbackData = existingFeedback.data?.userActivityFeedbackCollection?.edges?.[0]?.node;

    // IF YES: update the existing feedback
    if (existingFeedbackData) {
        const ret = await ac.mutate({
            mutation: updateUserActivityFeedbackFlatMutDoc,
            variables: {
                filter: {
                    id: {
                        eq: existingFeedbackData.id
                    }
                },
                set: {
                    value: feedback.value,
                    description: feedback.description,
                    id: existingFeedbackData.id,
                },
                atMost: 1
            }
        });

        return ret;
    }
    else {
        const ret = await ac.mutate({
            mutation: createUserActivityFeedbackFlatMutDoc,
            variables: {
                objects: [
                    {
                        activity: feedback.activityId,
                        value: feedback.value,
                        description: feedback.description,
                    }
                ]
            }
        })

        return ret;
    }
}