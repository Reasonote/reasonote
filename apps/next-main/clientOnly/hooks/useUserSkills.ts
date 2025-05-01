import {
  useEffect,
  useState,
} from "react";

import _ from "lodash";

import {useSupabase} from "@/components/supabase/SupabaseProvider";

import {useRsnUser} from "./useRsnUser";

export function useUserSkills() {
  const { rsnUserId } = useRsnUser();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [skills, setSkills] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    nodeId: string;
    emoji: string;
    updatedDate: string;
    createdDate: string;
  }>>([]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      if (!rsnUserId) {
        return;
      }
      const { data, error } = await supabase
        .from('skill_set')
        .select(`
          id,
          skill_set_skill!inner (
            id,
            skill (
              id,
              _name,
              _description,
              emoji,
              created_date,
              updated_date
            )
          )
        `)
        .eq('for_user', rsnUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // This is the "empty set" error, and we can just return safely.
          setError(null);
          setSkills([]);
          return;
        }
        else {
          throw error;
        }
      }

      // Transform the data to match the expected format
      const transformedSkills = data?.skill_set_skill.map(item => ({
        id: item.skill?.id ?? '',
        nodeId: item.skill?.id ?? '',
        name: item.skill?._name ?? '',
        description: item.skill?._description ?? '',
        createdDate: item.skill?.created_date ?? '',
        updatedDate: item.skill?.updated_date ?? '',
        emoji: item.skill?.emoji ?? '',
      })).filter((item) => !!item.id) ?? [];

      // Sort by createdDate in descending order
      const sortedSkills = _.orderBy(transformedSkills, ['createdDate'], ['desc']);
      
      setSkills(sortedSkills);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rsnUserId) {
      fetchSkills();
    }
  }, [rsnUserId]);

  return {
    skills,
    loading,
    error,
    refetch: fetchSkills,
  };
}
