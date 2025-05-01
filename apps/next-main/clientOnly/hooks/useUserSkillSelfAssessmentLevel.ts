import _ from "lodash";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useQuery} from "@apollo/client";
import {
  SkillLevel,
  SkillLevelSchema,
} from "@reasonote/core";
import {GetUserSkillFlatDocument} from "@reasonote/lib-sdk-apollo-client";

import {useRsnUserId} from "./useRsnUser";

export function useUserSkillSelfAssessmentLevel(params: { skillId: string } | undefined) {
    const rsnUserId = useRsnUserId();
    const {supabase: sb} = useSupabase();
    const {data, loading, error, refetch} = useQuery(GetUserSkillFlatDocument, {
        variables: {
            filter: {
                skill: {
                    eq: params?.skillId ?? null,
                },
                rsnUser: {
                    eq: rsnUserId ?? null
                }
            },
        },
        skip: !params?.skillId || !rsnUserId,
    })
    const skillId = params?.skillId;

    const userSkill = data?.userSkillCollection?.edges?.[0]?.node;
    const userSkillSelfAssessmentLevelParsed = SkillLevelSchema.safeParse(userSkill?.selfAssignedLevel);
    const userSkillSelfAssessmentLevel = userSkillSelfAssessmentLevelParsed.success ? userSkillSelfAssessmentLevelParsed.data : undefined;

    return {
        data: userSkillSelfAssessmentLevel,
        isLoading: loading,
        error: error ? error : null,
        refetch,
        mutate: async (newLevel: SkillLevel) => {
            if (!rsnUserId){
                console.warn('No rsnUserId found, cannot update user skill self assessment level');
                return
            };

            if (!skillId){
                console.warn('No skillId found, cannot update user skill self assessment level');
                return
            };

            await sb.from('user_skill').upsert({
                id: userSkill?.id,
                skill: skillId,
                rsn_user: rsnUserId,
                self_assigned_level: newLevel
            }).select("*");

            await refetch();
        }
    }
}