'use client'

import {useState} from "react";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  Box,
  Card,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

interface SkillScoreData {
  skill_id: string;
  skill_name: string;
  path_to?: string[];
  path_from?: string[];
  min_normalized_score: number;
  max_normalized_score: number;
  average_normalized_score: number;
  activity_result_count: number;
  num_skills: number;
  level_on_parent: string | null;
  level_path: string[];
}

export default function SkillRelationshipTesting() {
  const [skillId, setSkillId] = useState("");
  const [upstreamSkills, setUpstreamSkills] = useState<SkillScoreData[]>([]);
  const [downstreamSkills, setDownstreamSkills] = useState<SkillScoreData[]>([]);
  const {supabase} = useSupabase();

  const rsnUserId = useRsnUserId();

  useAsyncEffect(async () => {
    if (!skillId.trim()) {
      console.log('No skill ID provided');
      setUpstreamSkills([]);
      setDownstreamSkills([]);
      return;
    }

    if (!rsnUserId) {
      console.log('No user ID provided');
      setUpstreamSkills([]);
      setDownstreamSkills([]);
      return;
    }

    // Fetch upstream skills
    const { data: upstream } = await supabase.rpc('get_linked_skills_with_scores', {
      user_id: rsnUserId,
      input_skill_id: skillId,
    });

    // Fetch downstream skills
    const { data: downstream } = await supabase.rpc('get_downstream_skills_with_scores', {
      user_id: rsnUserId,
      input_skill_id: skillId,
    });

    if (upstream) {
      setUpstreamSkills(upstream.map(skill => ({
        skill_id: skill.skill_id,
        skill_name: skill.skill_name,
        path_to: skill.path_to,
        min_normalized_score: skill.min_normalized_score_upstream,
        max_normalized_score: skill.max_normalized_score_upstream,
        average_normalized_score: skill.average_normalized_score_upstream,
        activity_result_count: skill.activity_result_count_upstream,
        num_skills: skill.num_upstream_skills,
        level_on_parent: skill.level_on_parent,
        level_path: skill.level_path,
      })));
    }

    if (downstream) {
      setDownstreamSkills(downstream.map(skill => ({
        skill_id: skill.skill_id,
        skill_name: skill.skill_name,
        path_from: skill.path_from,
        min_normalized_score: skill.min_normalized_score_downstream,
        max_normalized_score: skill.max_normalized_score_downstream,
        average_normalized_score: skill.average_normalized_score_downstream,
        activity_result_count: skill.activity_result_count_downstream,
        num_skills: skill.num_downstream_skills,
        level_on_parent: skill.level_on_parent,
        level_path: skill.level_path,
      })));
    }
  }, [skillId, rsnUserId]);

  const SkillCard = ({ skill, type }: { skill: SkillScoreData, type: 'upstream' | 'downstream' }) => (
    <Card sx={{ p: 2, mb: 1 }}>
      <Stack gap={1}>
        <Typography variant="h6">{skill.skill_name}</Typography>
        <Typography variant="body2" color="text.secondary">ID: {skill.skill_id}</Typography>
        <Typography variant="body2">
          Path {type === 'upstream' ? 'to' : 'from'}: {(type === 'upstream' ? skill.path_to : skill.path_from)?.join(' → ') || 'Root'}
        </Typography>
        {skill.level_path?.length > 0 && (
          <Typography variant="body2">
            Level Path: {skill.level_path.join(' → ')}
          </Typography>
        )}
        <Typography variant="body2">
          Scores: Min={skill.min_normalized_score?.toFixed(2) || 'N/A'}, 
          Max={skill.max_normalized_score?.toFixed(2) || 'N/A'}, 
          Avg={skill.average_normalized_score?.toFixed(2) || 'N/A'}
        </Typography>
        <Typography variant="body2">
          Activity Count: {skill.activity_result_count || 0}
        </Typography>
        <Typography variant="body2">
          Number of {type} skills: {skill.num_skills}
        </Typography>
      </Stack>
    </Card>
  );

  return (
    <Box p={3}>
      <Stack gap={3}>
        <Typography variant="h4">Skill Relationship Testing</Typography>
        
        <TextField
          label="Skill ID"
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          placeholder="Enter skill ID..."
          fullWidth
        />

        <Stack direction="row" gap={2}>
          {/* Upstream Skills */}
          <Stack flex={1}>
            <Typography variant="h5" mb={2}>Upstream Skills ({upstreamSkills.length})</Typography>
            {upstreamSkills.map(skill => (
              <SkillCard key={skill.skill_id} skill={skill} type="upstream" />
            ))}
            {upstreamSkills.length === 0 && skillId && (
              <Typography color="text.secondary">No upstream skills found</Typography>
            )}
          </Stack>

          {/* Downstream Skills */}
          <Stack flex={1}>
            <Typography variant="h5" mb={2}>Downstream Skills ({downstreamSkills.length})</Typography>
            {downstreamSkills.map(skill => (
              <SkillCard key={skill.skill_id} skill={skill} type="downstream" />
            ))}
            {downstreamSkills.length === 0 && skillId && (
              <Typography color="text.secondary">No downstream skills found</Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}