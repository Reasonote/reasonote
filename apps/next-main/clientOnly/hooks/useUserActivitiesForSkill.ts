import {useSupabase} from "@/components/supabase/SupabaseProvider";

import {useSkillScores} from "./useSkillScores";

export function useUserActivityCountForSkill({skillId}: {skillId: string}){
    const {supabase} = useSupabase();
    const skillScores = useSkillScores({topicOrId: skillId});

    const skillScore = skillScores.data?.find((score) => score.skill_id === skillId);

    return {
        data: skillScore?.activity_result_count_upstream,
        isLoading: skillScores.loading,
        error: skillScores.error,
    }
}