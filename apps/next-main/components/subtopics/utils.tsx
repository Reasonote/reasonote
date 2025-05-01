import {z} from "zod";

import {ActivityGenerateRoute} from "@/app/api/activity/generate/routeSchema";
import {
  SubTopicSchema,
} from "@reasonote/ai-generators/src/skills/getSubtopics/types";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

export async function generateSlideForSubtopic(
  subtopicId: string, 
  skillId: string,
  setAllSubTopics?: React.Dispatch<React.SetStateAction<any[]>>
) {
  try {
    const activities = await ActivityGenerateRoute.call({
      from: {
        skill: {
          id: subtopicId,
          parentIds: [skillId],
        },
      },
      activityTypes: ['slide'],
      additionalInstructions: `This should be a short slide that is relevant to the skill and the subtopic.
      It should introduce the subtopic and provide a brief overview of what the user will practice in this subtopic.
      It should be engaging and interesting to the user and should be a good introduction to the subtopic.
      It should be enough content that the user will want to practice it for 10-15 minutes.
      `,
    });

    if (activities?.data?.activities && setAllSubTopics) {
      setAllSubTopics(prev =>
        prev.map(topic =>
          topic.id === subtopicId
            ? {
              ...topic, activities: [...topic.activities, ...activities.data.activities.map(a => ({
                id: a.id,
                type: a.activityConfig.type
              }))]
            }
            : topic
        )
      );
    }

    return activities?.data?.activities;
  } catch (error) {
    console.error('Error generating activities for subtopic:', error);
    return null;
  }
}

export async function saveSubTopicAsSkill(
  subtopic: z.infer<typeof SubTopicSchema>,
  userId: string,
  skillId: string,
  supabase: SupabaseClient<Database>,
  setAllSubTopics?: React.Dispatch<React.SetStateAction<any[]>>
) {
  try {
    // First, get the root skill id of the parentSkillIds
    const { data: parentSkillIds } = await supabase
      .from('skill')
      .select('root_skill_id')
      .eq('id', skillId);

    const rootSkillId = parentSkillIds?.[0]?.root_skill_id;

    // Check for existing similar skills
    const { data: existingSkills } = await supabase
      .from('skill')
      .select('*')
      .eq('for_user', userId)
      .eq('created_by', userId)
      .eq('root_skill_id', rootSkillId ?? skillId)
      .ilike('_name', subtopic.name);

    if (existingSkills && existingSkills.length > 0) {
      console.log('Similar skill already exists:', subtopic.name);
      // Check if it already has slide activities
      const { data: slideActivities } = await supabase
        .from('activity')
        .select('id,type_config')
        .eq('generated_for_skill_paths', [skillId, existingSkills[0].id])
        .eq('_type', 'slide');



      if (slideActivities && slideActivities.length > 0) {
        return {
          ...existingSkills[0],
          //@ts-ignore
          activity_ids: slideActivities?.map(a => ({id: a.id, activityConfig: {type: a.type_config?.type, version: a.type_config?.version}})) || []
        };
      } else {
        console.log('No slide found for skill:', existingSkills[0].id);
        generateSlideForSubtopic(existingSkills[0].id, skillId, setAllSubTopics);
        return {
          ...existingSkills[0],
          activity_ids: []
        };
      }
    }

    // Create new skill
    const { data: newSkill, error: skillError } = await supabase
      .from('skill')
      .insert({
        _name: subtopic.name,
        _description: subtopic.description,
        created_by: userId,
        for_user: userId,
        emoji: subtopic.emoji,
        root_skill_id: rootSkillId ?? skillId,
        metadata: {
          genData: {
            expertQuestions: subtopic.expertQuestions
          }
        }
      })
      .select()
      .single();

    if (skillError) throw skillError;

    // Create skill link
    const { error: linkError } = await supabase
      .from('skill_link')
      .insert({
        upstream_skill: newSkill.id,
        downstream_skill: skillId,
        _type: 'subtopic',
        created_by: userId,
      });

    if (linkError) throw linkError;

    // Start activity generation in background
    generateSlideForSubtopic(newSkill.id, skillId, setAllSubTopics);

    return {
      ...newSkill,
      activity_ids: [], // Start with empty activities, they'll be added later
    };
  } catch (error) {
    console.error('Error saving subtopic:', error);
    throw error;
  }
}
