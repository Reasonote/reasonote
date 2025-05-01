import {useCallback} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  calculateLevel,
  LevelInfo,
} from "@/utils/xpCalculations";

import {useEntityCache} from "./useEntityCache";
import {useRsnUserId} from "./useRsnUser";

export type UseUserXPReturnType = {
    dailyXp: number;
    levelInfo: LevelInfo;
};

async function fetchUserXP(id: string, sb: ReturnType<typeof useSupabase>["sb"], userId: string) {
    const isAllSkills = id === 'all';
    // Always fetch total daily XP across all skills
    const { data: totalData, error: dailyError } = await sb.rpc('get_total_user_xp', {
        user_id: userId,
    });

    if (dailyError) {
        console.error('Error fetching daily XP:', dailyError);
        return null;
    }

    const dailyXp = totalData?.[0]?.daily_xp || 0;
    let levelInfo: LevelInfo;

    if (!isAllSkills) {
        // Fetch skill-specific XP
        const { data: xpData, error } = await sb
            .from('user_skill_sysdata')
            .select('total_xp')
            .eq('rsn_user', userId)
            .eq('skill', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching skill XP:', error);
            return null;
        }

        levelInfo = calculateLevel(xpData?.total_xp || 0);
    } else {
        levelInfo = calculateLevel(totalData[0]?.total_xp || 0);
    }

    return { dailyXp, levelInfo };
}

export function useUserXP(skillId?: string) {
    const { sb } = useSupabase();
    const userId = useRsnUserId();

    const fetchFn = useCallback(async (id: string) => {
        if (!userId) return null;
        return fetchUserXP(id, sb, userId);
    }, [sb, userId]);

    return useEntityCache<UseUserXPReturnType | null, UseUserXPReturnType | null>({
        queryName: 'userXP',
        id: skillId || 'all',
        fetchFn,
        transformFn: ({ rawData }) => {
            return rawData;
        },
    });
}