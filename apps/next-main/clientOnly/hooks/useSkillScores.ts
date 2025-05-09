import {
  useCallback,
  useEffect,
} from "react";

import {z} from "zod";

import {SkillScoresRoute} from "@/app/api/skill-scores/routeSchema";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {createSimpleLogger} from "@lukebechtel/lab-ts-utils";

import {useEntityCache} from "./useEntityCache";
import {useRsnUserId} from "./useRsnUser";

/** Type returned by the get_linked_skills_with_scores Supabase RPC function */
export type UseSkillScoresReturnType = z.infer<typeof SkillScoresRoute.responseSchema>;

/**
 * Hook to fetch and cache skill scores for a given topic or skill ID
 * @param {Object} params - Hook parameters
 * @param {string} params.topicOrId - Either a skill UUID or topic name to fetch scores for
 * @returns {Object} Entity cache result containing:
 *   - data: The skill scores data if successful
 *   - error: Any error that occurred during fetch
 *   - loading: Whether the data is currently being fetched
 *   - refetch: Function to manually trigger a refresh of the data
 */
export function useSkillScores({ topicOrId }: { topicOrId: string }) {
  const { sb } = useSupabase();
  const userId = useRsnUserId();

  const logger = createSimpleLogger({prefix: "useSkillScores"});

  const fetchFn = useCallback(async (id: string) => {
    if (!userId) return null;
    // Use the API route instead of the client function
    const result = await SkillScoresRoute.call({
      topicOrId: id
    });
    
    if (result.error) {
      console.error("Error fetching skill scores:", result.error);
      throw result.error;
    }
    
    return result.data as UseSkillScoresReturnType;
  }, [userId]);


  const useEntityCacheResult = useEntityCache<UseSkillScoresReturnType | null, UseSkillScoresReturnType | null>({
    queryName: "skillScores",
    id: topicOrId,
    fetchFn,
    transformFn: ({ rawData }) => {
      return rawData;
    },
  });

  useEffect(() => {
    // useEffect if userId changes, and we aren't already refetching, refetch the data
    if (!useEntityCacheResult.loading && !useEntityCacheResult.data && userId) {
      console.debug('useSkillScores: refetching skill scores', userId);
      useEntityCacheResult.refetch();
    }
  }, [userId]);

  logger.log('useEntityCacheResult', useEntityCacheResult.data);

  return useEntityCacheResult;
}