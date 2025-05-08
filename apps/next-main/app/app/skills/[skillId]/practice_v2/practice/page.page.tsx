"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {GenerateSubtopicsRoute} from "@/app/api/subtopics/generate/routeSchema";
import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {PracticeSessionV2} from "@/components/practice_v2/PracticeSessionV2";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  CircularProgress,
  Stack,
} from "@mui/material";
import {ActivityTypesPublic} from "@reasonote/core";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

interface SubTopic {
  id: string;
  name: string;
  description: string;
  emoji: string;
  activities: {
    id: string;
    type: string;
  }[];
}

function useSubskillsWithTypeLesson(skillId: string) {
  const { sb } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allSubTopics, setAllSubTopics] = useState<SubTopic[]>([]);

  useEffect(() => {
    async function fetchSubskills() {
      try {
        setIsLoading(true);
        const { data: skillData, error: skillError } = await sb
          .from('skill')
          .select('*')
          .eq('root_skill_id', skillId)
          .eq('_type', 'lesson');

        if (skillError) {
          throw skillError;
        }

        const subTopics = skillData.map((t): SubTopic => ({
          id: t.id,
          name: t._name,
          description: t._description || '',
          emoji: t.emoji || '',
          activities: [],
        }));

        setAllSubTopics(subTopics);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubskills();
  }, [skillId, sb]);

  return { isLoading, error, allSubTopics };
}

export default function PracticeSessionPage({ params }: { params: { skillId: string } }) {
  const { skillId } = params;
  const { update: updateSubtopicIds, value: subtopicIds } = useSearchParamHelper('subtopicIds');
  const { update: updateAllowedActivityTypes, value: allowedActivityTypes } = useSearchParamHelper('allowedActivityTypes');
  const userId = useRsnUserId();
  const router = useRouter();
  const [selectedSubTopics, setSelectedSubTopics] = useState<SubTopic[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  function setAllowedActivityTypes(allowedActivityTypes: string[]) {
    updateAllowedActivityTypes(allowedActivityTypes.join(','));
  }

  const { isLoading, allSubTopics, error } = useSubskillsWithTypeLesson(skillId as string);
  const { sb } = useSupabase();

  useEffect(() => {
    if (!allowedActivityTypes || allowedActivityTypes === '') {
      console.log('No allowedActivityTypes, setting to all', [...ActivityTypesPublic]);
      setAllowedActivityTypes([...ActivityTypesPublic]);
    }
  }, [allowedActivityTypes]);

  useAsyncEffect(async () => {
    // Wait for the subtopics to load to make sure we are using the correct logic if it is a subtopic
    if (allSubTopics.length === 0) {
      return;
    }
    const filteredSubTopics = allSubTopics.filter(t => subtopicIds?.split(',').includes(t.id));

    // TODO: replace this logic with a more resilient method, probably small refactor
    if (filteredSubTopics.length === 0) {
      const subtopicIdsArray = subtopicIds?.split(',') || [];
      const { data: skillData, error: skillError } = await sb.from('skill')
        .select('*')
        .in('id', subtopicIdsArray);

      if (skillError) {
        console.error('Error fetching skill data', skillError);
        return;
      }

      if (!skillData || skillData.length === 0) {
        return;
      }

      if (subtopicIds) {
        setSelectedSubTopics(skillData.map((t): SubTopic => {
          return {
            id: t.id,
            name: t._name,
            description: t._description || '',
            emoji: t.emoji || '',
            activities: [],
          }
        }))
      }
    }
    else {
      setSelectedSubTopics(filteredSubTopics);
    }
  }, [subtopicIds, allSubTopics]);

  const handleSubtopicsInRotationChange = useCallback((subTopics: SubTopic[]) => {
    if (allSubTopics.length === 0) {
      return;
    }
    updateSubtopicIds(subTopics.map(t => t.id).join(','));
  }, [allSubTopics, updateSubtopicIds]);

  const handleGenerateTopics = useCallback(async () => {
    if (!userId || isGeneratingTopics) return;
    
    setIsGeneratingTopics(true);
    try {
      const generatedTopics: SubTopic[] = [];
      
      // Generate topics using the API
      for await (const topicData of GenerateSubtopicsRoute.callArrayStream({
        skillId: skillId as string,
        numTopics: 5, // Generate 5 topics initially
      })) {
        if (topicData.topic) {
          // Create the subtopic in the database
          const { data: newSkill, error } = await sb.from('skill').insert({
            _name: topicData.topic.name,
            _description: topicData.topic.description,
            emoji: topicData.topic.emoji,
            _type: 'lesson',
            root_skill_id: skillId as string,
          }).select().single();
          
          if (error) {
            console.error('Error creating subtopic:', error);
            continue;
          }
          
          // Create the skill link
          await sb.from('skill_link').insert({
            upstream_skill: newSkill.id,
            downstream_skill: skillId as string,
            _type: 'subtopic',
          });
          
          // Add to our local state
          const newTopic: SubTopic = {
            id: newSkill.id,
            name: newSkill._name,
            description: newSkill._description || '',
            emoji: newSkill.emoji || '',
            activities: [],
          };
          
          generatedTopics.push(newTopic);
        }
      }
      
      // Update the local state with the new topics
      if (generatedTopics.length > 0) {
        // Force a refetch of all subtopics
        const { data: refreshedTopics, error } = await sb
          .from('skill')
          .select('*')
          .eq('root_skill_id', skillId)
          .eq('_type', 'lesson');
        
        if (!error && refreshedTopics) {
          const updatedTopics = refreshedTopics.map((t): SubTopic => ({
            id: t.id,
            name: t._name,
            description: t._description || '',
            emoji: t.emoji || '',
            activities: [],
          }));
          
          // Select the first few generated topics
          setSelectedSubTopics(generatedTopics.slice(0, 3));
          updateSubtopicIds(generatedTopics.slice(0, 3).map(t => t.id).join(','));
        }
      }
    } catch (error) {
      console.error('Error generating topics:', error);
    } finally {
      setIsGeneratingTopics(false);
    }
  }, [userId, skillId, sb, isGeneratingTopics, updateSubtopicIds]);

  if (isLoading || isGeneratingTopics) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100vh" spacing={2}>
        <CircularProgress />
        <Txt>{isGeneratingTopics ? 'Generating topics...' : 'Loading practice session...'}</Txt>
      </Stack>
    );
  }

  return (
    <PracticeSessionV2
      skillId={skillId as string}
      allSubTopics={allSubTopics}
      subTopics={selectedSubTopics}
      onBack={() => router.push(`/app/skills/${skillId}?tab=practice`)}
      allowedActivityTypes={allowedActivityTypes?.split(',') ?? [...ActivityTypesPublic]}
      setAllowedActivityTypes={setAllowedActivityTypes}
      onSubtopicsInRotationChange={handleSubtopicsInRotationChange}
      onGenerateTopics={handleGenerateTopics}
    />
  );
} 