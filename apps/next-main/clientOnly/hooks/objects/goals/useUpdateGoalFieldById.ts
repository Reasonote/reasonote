import { useCallback } from "react";

import { useApolloClient, useMutation } from "@apollo/client";
import {
  getGoalFlatQueryDoc,
  updateGoalFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import { GoalUpdateInput } from "@reasonote/lib-sdk-apollo-client/src/codegen/codegen-generic-client/graphql";

export function useUpdateGoalFieldId() {
  const client = useApolloClient();
  const [updateGoal] = useMutation(updateGoalFlatMutDoc);

  const ret = useCallback(
    async <F extends keyof GoalUpdateInput>(
      id: string,
      update: Partial<GoalUpdateInput>
    ) => {
      const { data } = await client.query({
        query: getGoalFlatQueryDoc,
        variables: {
          filter: {
            id: { eq: id },
          },
          first: 1,
        },
      });

      const matchingGoal = data.goalCollection?.edges[0]?.node;

      // Update the goal in the cache
      await updateGoal({
        variables: {
          atMost: 1,
          filter: {
            id: { eq: id },
          },
          set: {
            ...update,
          },
        },
        optimisticResponse: {
          updateGoalCollection: {
            __typename: "GoalUpdateResponse",
            affectedCount: 1,
            records: [
              //@ts-ignore
              {
                __typename: "Goal",
                // Spread the goal as it exists right now (in the cache)
                ...matchingGoal,
                // Spread the update on top of it
                ...update,
              },
            ],
          },
        },
      });
    },
    [updateGoal]
  );

  return ret;
}
