import { useCallback } from "react";

import { useApolloClient, useMutation } from "@apollo/client";

/**
 *
 * TODO:
 *
 * This should be able to generate this....
 */

export function useUpdateFieldByIdGeneric<T extends { id: string }>(
  mutDoc: any,
  getDoc: any,
  getCollName: string,
  updateCollName: string,
  updateCollTypename: string,
  recordTypename: string
) {
  const client = useApolloClient();
  const [mutate] = useMutation(mutDoc);

  const ret = useCallback(
    async <F extends keyof T>(id: string, field: F, newValue: T[F]) => {
      const { data } = await client.query({
        query: getDoc,
        variables: {
          filter: {
            id: { eq: id },
          },
          first: 1,
        },
      });

      const matchingItem = data[getCollName]?.edges[0]?.node;

      // Update the goal in the cache
      await mutate({
        variables: {
          atMost: 1,
          filter: {
            id: { eq: id },
          },
          set: {
            [field]: newValue,
          },
        },
        optimisticResponse: {
          [updateCollName]: {
            __typename: updateCollTypename,
            affectedCount: 1,
            records: [
              //@ts-ignore
              {
                __typename: recordTypename,
                // Get the goal as it exists right now (in the cache)
                ...matchingItem,
                [field]: newValue,
              },
            ],
          },
        },
      });
    },
    [mutate]
  );

  return ret;
}
