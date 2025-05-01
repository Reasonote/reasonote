import {useQuery} from "@apollo/client";
import {
  GetActivitySetWithActivitiesDocument,
} from "@reasonote/lib-sdk-apollo-client";

import {useRsnUser} from "./useRsnUser";

export function useUserActivities() {
  const { rsnUserId } = useRsnUser();

  const userActivitySet = useQuery(GetActivitySetWithActivitiesDocument, {
    variables: {
      filter: {
        forUser: {
          eq: rsnUserId,
        },
      },
  }});

  const activities = userActivitySet.data?.activitySetCollection?.edges?.[0]?.node?.activitySetActivityCollection?.edges.map(
    edge => ({
      ...edge.node.activity,
      nodeId: edge.node.id,
    }),
  ) ?? [];

  return {
    activities,
    loading: userActivitySet.loading,
    error: userActivitySet.error,
    refetch: userActivitySet.refetch,
  };
}
