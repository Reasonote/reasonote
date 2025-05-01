import { useQuery } from "@apollo/client";
import { getUserSettingFlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";

import { useRsnUser } from "./useRsnUser";

export function useRsnUserSettings() {
  const { rsnUserId } = useRsnUser();

  const userSettingResult = useQuery(getUserSettingFlatQueryDoc, {
    variables: {
      filter: {
        rsnUser: {
          eq: rsnUserId,
        },
      },
    },
  });

  const data = userSettingResult.data?.userSettingCollection?.edges?.[0]?.node;

  if (userSettingResult.loading) {
    return {
      loading: true,
      error: undefined,
      data: undefined,
    };
  } else {
    if (userSettingResult.error) {
      return {
        loading: false,
        error: userSettingResult.error,
        data: undefined,
      };
    } else {
      if (data) {
        return {
          loading: false,
          error: undefined,
          data,
        };
      } else {
        return {
          loading: false,
          error: undefined,
          data: undefined,
        };
      }
    }
  }
}
