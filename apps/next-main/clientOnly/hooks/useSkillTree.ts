import {useCallback} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {tryUntilAsync} from "@lukebechtel/lab-ts-utils";
import {SkillTree} from "@reasonote/core";
import {Database} from "@reasonote/lib-sdk";

import {rsnUserIdVar} from "../state/userVars";
import {useEntityCache} from "./useEntityCache";
import {useRsnUserId} from "./useRsnUser";

/** Type returned by the get_linked_skills_with_scores Supabase RPC function */
export type UseSkillTreeReturnType =
  Database["public"]["Functions"]["get_linked_skills"]["Returns"];

/**
 * Fetches skill tree from Supabase for a given skill/topic and user
 * @param {string} id - Either a UUID of a skill or a topic name
 * @param {ReturnType<typeof useSupabase>["sb"]} sb - Supabase client instance
 * @param {string | null} userId - Current user's ID
 * @returns {Promise<UseSkillTreeReturnType | null>} Skill tree data or null if invalid input
 */
async function fetchSkillTree(id: string, sb: ReturnType<typeof useSupabase>["sb"], userId: string | null) {
  if (!id || !userId) return null;

  const res = await sb.rpc("get_linked_skills", {
    input_skill_id: id,
    user_id: userId,
    direction: 'upstream',
  });
  if (res.error) throw res.error;
  return res.data;
}

/**
 * Hook to fetch and cache skill tree for a given topic or skill ID
 * @param {Object} params - Hook parameters
 * @param {string} params.topicOrId - Either a skill UUID or topic name to fetch scores for
 * @returns {Object} Entity cache result containing:
 *   - data: The skill scores data if successful
 *   - error: Any error that occurred during fetch
 *   - loading: Whether the data is currently being fetched
 *   - refetch: Function to manually trigger a refresh of the data
 */
export function useSkillTree({ id }: { id: string }) {
  const { sb } = useSupabase();

  // Do this such that the rsnUserId is fetched
  useRsnUserId();

  const fetchFn = useCallback(async (id: string) => {
    // Wait until rsnUserId is fetched. If not available,
    // We should warn and return null
    const userId = await tryUntilAsync<string>({
      func: async () => {
        const result = rsnUserIdVar()

        if (!result){
          throw new Error('No result found')
        }

        return result;
      },
      tryLimits: {
        maxTimeMS: 10_000
      }
    })

    if (!userId) {
      console.warn('No userId found');
      return null;
    }

    return fetchSkillTree(id, sb, userId);
  }, [sb]);

  return useEntityCache<UseSkillTreeReturnType | null, SkillTree | null>({
    queryName: "skillTree",
    id,
    fetchFn,
    transformFn: ({ rawData }) => {
        if (!rawData) return null;
        const skillTree = SkillTree.fromUseSkillTreeReturnType(rawData as any);

        return skillTree;
    },
  });
}