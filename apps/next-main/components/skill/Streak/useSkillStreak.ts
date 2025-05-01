import {useState} from "react";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useAsyncMemo} from "@reasonote/lib-utils-frontend";

export function useSkillStreak(skillId: string) {
    const {sb} = useSupabase();
    const rsnUserId = useRsnUserId();
    const [refetchCount, setRefetchCount] = useState(0);

    const streakCount = useAsyncMemo(async () => {
        if (!rsnUserId) return null;
        
        const res = await sb.rpc('calculate_current_streak', {user_id: rsnUserId, input_skill_id: skillId});
        return res.data;
    }, [sb, rsnUserId, skillId, refetchCount]);

    return {
        data: streakCount,
        refetch: () => setRefetchCount((old) => old + 1),
    }
}