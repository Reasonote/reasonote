import _ from "lodash";

import {UserSkill} from "@/components/classroom/schema";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {getUserSkillFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";

import {useRsnUserId} from "./useRsnUser";

export function useUserSkillData(skillId: string | undefined) {
  const { supabase } = useSupabase();
  const ac = useApolloClient();
  const rsnUserId = useRsnUserId();
  const userSkillQuery = useQuery(
    getUserSkillFlatQueryDoc,
    {
      variables: {
        filter: {
          skill: {
            eq: skillId ?? 'fake',
          },
          rsnUser: {
            eq: rsnUserId ?? 'fake',
          },
        },
      },
    }
  );

  const updateUserSkill = async (skillId: string | undefined, updateData: Partial<UserSkill>, ignoreNulls = true) => {
    if (!skillId) return;
    if (!rsnUserId) return;

    try {
      // If updateData has an empty key, ignore it
      const updateDataToUse = ignoreNulls ? _.omitBy(updateData, (v) => v === undefined || v === null) : updateData;

      const { data, error } = await supabase
        .from('user_skill')
        .upsert({
          ..._.mapKeys(updateDataToUse, (v, k) => _.snakeCase(k)),
          skill: skillId,
          rsn_user: rsnUserId,
        }, {
          onConflict: 'skill,rsn_user'
        });

      if (error) throw error;

      // Refetch to ensure we have the latest data
      await userSkillQuery.refetch();

      return data;
    } catch (error) {
      console.error('Error updating user skill:', error);
    }
  };

  return {
    data: _.mapKeys(userSkillQuery.data?.userSkillCollection?.edges[0]?.node, (v, k) => _.snakeCase(k)),
    updateUserSkill,
    loading: userSkillQuery.loading,
    error: userSkillQuery.error,
    refetch: userSkillQuery.refetch,
  };
}