import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {isTypedUuidV4} from "@lukebechtel/lab-ts-utils";
import {SimpleSkillTreeFactory} from "@reasonote/lib-ai-common";

import {
  useSkillScores,
  UseSkillScoresReturnType,
} from "./useSkillScores";

interface UseSkillSimpleTreeProps {
    topicOrId: string;
}

export function useSkillSimpleTree({topicOrId}: UseSkillSimpleTreeProps) {
    const {sb} = useSupabase();
    const isId = isTypedUuidV4(topicOrId);
    const {data: skillGetResult, loading, refetch} = useSkillScores({topicOrId})
    const [lastDefinedSkillGetResult, setLastDefinedSkillGetResult] = useState<UseSkillScoresReturnType | null>(null);

    useEffect(() => {
        if (skillGetResult !== undefined && skillGetResult !== null) {
            setLastDefinedSkillGetResult(skillGetResult);
        }
    }, [skillGetResult]);

    const [skillSimpleTree, error] = useMemo(() => {
        const skillGetData = lastDefinedSkillGetResult;
        if (!skillGetData){
            return [undefined, undefined]
        }

        if(!isId){
            return [undefined, new Error('topicOrId is not a valid UUID')]
        }

        try {
            return [SimpleSkillTreeFactory.fromSkillsWithScores({
                skillId: topicOrId,
                skillsWithScores: skillGetData
            }), undefined]
        }
        catch (e) {
            console.error(e)
            return [undefined, e]
        }
    }, [lastDefinedSkillGetResult, topicOrId, isId])

    return {
        data: skillSimpleTree,
        error,
        loading,
        refetch
    }
}

