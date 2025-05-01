import {
  useEffect,
  useState,
} from "react";

import {SubTopic} from "@/components/practice_v2/PracticeV2Main";
import {useSupabase} from "@/components/supabase/SupabaseProvider";

export function useSubtopicsForSkill(skillId: string, userId: string | null) {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [allSubTopics, setAllSubTopics] = useState<SubTopic[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubTopics = async () => {
      if (!userId || !skillId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('skill_link')
          .select(`
            upstream_skill:upstream_skill (
              id,
              _name,
              _description,
              emoji
            )
          `)
          .eq('downstream_skill', skillId)
          .eq('_type', 'subtopic');

        if (error) throw error;

        const upstreamSkillIds = data
          //@ts-ignore
          ?.map(link => link.upstream_skill?.id)
          .filter((id): id is string => !!id);
        
        const skillPaths = upstreamSkillIds?.map(id => [skillId, id]);

        const { data: activityData } = await supabase
          .rpc('get_activities_for_skill_paths', {
            p_skill_paths: skillPaths || [],
            p_generated_for_user: userId,
            p_activity_type: 'slide'
          });

        const topics = data.map(link => ({
          //@ts-ignore
          id: link.upstream_skill?.id || '',
          //@ts-ignore
          name: link.upstream_skill?._name || '',
          //@ts-ignore
          description: link.upstream_skill?._description || '',
          //@ts-ignore
          emoji: link.upstream_skill?.emoji || '',
          activities: activityData
            ?.filter(activity =>
              Array.isArray(activity.generated_for_skill_paths) &&
              activity.generated_for_skill_paths.some(path =>
                //@ts-ignore
                JSON.stringify(path) === JSON.stringify([skillId, link.upstream_skill?.id])
              )
            )
            .map(activity => ({
              id: activity.id,
              type: activity._type || ''
            })) || []
        }));

        setAllSubTopics(topics);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch subtopics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubTopics();
  }, [userId, skillId, supabase]);

  return {
    isLoading,
    allSubTopics,
    error,
    setAllSubTopics  // Expose this in case we need to update the topics
  };
} 