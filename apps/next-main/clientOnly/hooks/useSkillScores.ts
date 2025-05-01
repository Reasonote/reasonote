import {
  useCallback,
  useEffect,
} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {isTypedUuidV4} from "@lukebechtel/lab-ts-utils";
import {Database} from "@reasonote/lib-sdk";

import {useEntityCache} from "./useEntityCache";
import {useRsnUserId} from "./useRsnUser";

/** Type returned by the get_linked_skills_with_scores Supabase RPC function */
export type UseSkillScoresReturnType =
  Database["public"]["Functions"]["get_linked_skills_with_scores"]["Returns"];

/** Type returned by the get_linked_skills_with_scores_v2 Supabase RPC function */
type SkillScoresV2ReturnType = {
  skill_id: string;
  skill_name: string;
  skill_emoji: string;
  skill_links: {
    id: string;
    to: string;
  }[];
  user_activity_result_ids: string[];
  skill_score: number;
};

/**
 * Fetches skill scores from Supabase for a given skill/topic and user
 * @param {string} id - Either a UUID of a skill or a topic name
 * @param {ReturnType<typeof useSupabase>["sb"]} sb - Supabase client instance
 * @param {string | null} userId - Current user's ID
 * @returns {Promise<UseSkillScoresReturnType | null>} Skill scores data or null if invalid input
 */
async function fetchSkillScores(id: string, sb: ReturnType<typeof useSupabase>["sb"], userId: string | null) {
  const isId = isTypedUuidV4(id);

  /**
   * Looks up a skill ID by topic name
   * @param {string} topicName - Name of the topic to look up
   * @returns {Promise<string | null>} Skill ID if found, null otherwise
   */
  async function getTopicId(topicName: string) {
    const res = await sb.from("skill").select("id").eq("_name", topicName).single();
    return res.data?.id ?? null;
  }

  const skillId = isId ? id : await getTopicId(id);
  if (!skillId || !userId) return null;

  const res = await sb.rpc("get_linked_skills_with_scores_v2", {
    input_skill_id: skillId,
    user_id: userId,
    direction: 'upstream'
  });

  if (res.error) throw res.error;
  
  // Transform v2 response to match the format of the original function
  const data = res.data as SkillScoresV2ReturnType[];
  
  // Create a map of skill IDs to their data
  const skillMap = new Map<string, SkillScoresV2ReturnType>();
  data.forEach(item => skillMap.set(item.skill_id, item));
  
  // Create a graph representation of skills and their connections
  const graph = new Map<string, {to: string, linkId: string}[]>();
  data.forEach(item => {
    if (!graph.has(item.skill_id)) {
      graph.set(item.skill_id, []);
    }
    
    item.skill_links.forEach(link => {
      const existing = graph.get(item.skill_id) || [];
      existing.push({to: link.to, linkId: link.id});
      graph.set(item.skill_id, existing);
    });
  });
  
  // Perform BFS to find paths from input skill to all other skills
  const paths = new Map<string, {skillPath: string[], linkPath: string[]}>();
  
  // Initialize with the root skill
  paths.set(skillId, {skillPath: [skillId], linkPath: []});
  
  // Queue for BFS
  const queue: string[] = [skillId];
  const visited = new Set<string>([skillId]);
  
  while (queue.length > 0) {
    const currentSkillId = queue.shift()!;
    const currentPath = paths.get(currentSkillId)!;
    
    // Process all links from this skill
    const links = graph.get(currentSkillId) || [];
    for (const link of links) {
      if (!visited.has(link.to)) {
        visited.add(link.to);
        
        // Create new path by extending the current path
        const newSkillPath = [...currentPath.skillPath, link.to];
        const newLinkPath = [...currentPath.linkPath, link.linkId];
        
        // Store the path
        paths.set(link.to, {
          skillPath: newSkillPath,
          linkPath: newLinkPath
        });
        
        // Add to queue for further exploration
        queue.push(link.to);
      }
    }
  }
  
  // Transform data using the computed paths
  const transformedData = data.map(item => {
    const path = paths.get(item.skill_id) || {skillPath: [item.skill_id], linkPath: []};
    
    return {
      skill_id: item.skill_id,
      skill_name: item.skill_name,
      path_to: path.skillPath,
      path_to_links: path.linkPath,
      min_normalized_score_upstream: item.skill_score,
      max_normalized_score_upstream: item.skill_score,
      average_normalized_score_upstream: item.skill_score,
      stddev_normalized_score_upstream: 0,
      activity_result_count_upstream: item.user_activity_result_ids.length,
      all_scores: item.user_activity_result_ids.length > 0 ? [item.skill_score] : [],
      num_upstream_skills: path.skillPath.length - 1, // Number of skills in the path excluding itself
      level_on_parent: 'INTRO', // Default value
      level_path: Array(path.skillPath.length - 1).fill('INTRO') // Fill with default values
    };
  });

  return transformedData as UseSkillScoresReturnType;
}

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

  const fetchFn = useCallback(async (id: string) => {
    if (!userId) return null;
    return fetchSkillScores(id, sb, userId);
  }, [sb, userId]);


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

  return useEntityCacheResult;
}