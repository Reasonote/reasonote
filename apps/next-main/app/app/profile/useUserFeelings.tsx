import {UserFeeling} from "@reasonote/core";

import {useAcUpdateHelper} from "@/clientOnly/hooks/useAcUpdateHelper";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useMutation} from "@apollo/client";
import {
  createUserSettingFlatMutDoc,
  getUserSettingFlatQueryDoc,
  updateUserSettingFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

export function useUserFeelings(){
    const {rsnUser} = useRsnUser();
    const [userSettingInsert] = useMutation(createUserSettingFlatMutDoc);
    const [userSettingUpdate] = useMutation(updateUserSettingFlatMutDoc);

    const {
        data,
        updater,
        queryResult,
    } = useAcUpdateHelper({
        queryOpts: {
            query: getUserSettingFlatQueryDoc,
            variables: {
                filter: {
                    rsnUser: { eq: rsnUser.data?.id },
                },
            },
        },
        updateFn: async (
          value: {
            subject_name: string;
            subject_type: string;
            feeling: string;
          }[], obj
        ) => {
          const refetched = await queryResult.refetch();
    
          if (refetched.data.userSettingCollection?.edges?.length === 0) {
            await userSettingInsert({
              variables: {
                objects: [
                  {
                    feelings: JSON.stringify(value),
                    rsnUser: rsnUser.data?.id,
                  },
                ],
              },
            });
          } else {
            const itemId = refetched.data.userSettingCollection?.edges?.[0]?.node?.id;
    
            if (!itemId) {
              console.error(`No item id found for user setting`);
              return;
            }
    
            await userSettingUpdate({
              variables: {
                set: {
                  feelings: JSON.stringify(value),
                },
                filter: {
                  id: { eq: itemId },
                },
                atMost: 1,
              },
            });
          }

          await queryResult.refetch();
        },
        statePopulator: (obj) => {
          const parsed = JSONSafeParse(obj.userSettingCollection?.edges?.[0]?.node?.feelings)?.data;

          return parsed ?? [];
        },
        resetDeps: [rsnUser.data?.id],
        throttleWait: 1000,
    });

    return {
        data,
        updater,
        push: (newItems: UserFeeling[]) => {
            updater([...data, ...newItems])
        },
        queryResult,
    }
}