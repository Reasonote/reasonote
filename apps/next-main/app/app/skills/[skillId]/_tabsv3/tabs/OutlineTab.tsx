'use client'

import {
  useEffect,
  useState,
} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";

export const OutlineTabRenderer = ({
  skillId,
  loading: propsLoading,
  error: propsError
}: ToolTabRendererProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [skillData, setSkillData] = useState<{
    name: string;
    description: string | null;
    emoji: string | null;
    metadata: any;
  } | null>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    const fetchSkillData = async () => {
      if (!skillId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('skill')
          .select('name:_name, description:_description, emoji, metadata')
          .eq('id', skillId)
          .single();

        if (error) throw error;
        setSkillData(data);
      } catch (err) {
        console.error('Error fetching skill data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch skill data'));
      } finally {
        setLoading(false);
      }
    };

    fetchSkillData();
  }, [skillId, supabase]);

  if (propsLoading || loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error || propsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {error?.message || propsError?.message || 'An error occurred'}
        </Typography>
      </Box>
    );
  }

  if (!skillData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No outline available for this skill.</Typography>
      </Box>
    );
  }

  return (
    <Stack sx={{ height: '100%', p: 2 }} spacing={3}>
      <Paper elevation={0} sx={{ p: 3, backgroundColor: 'background.paper' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            {skillData.emoji && (
              <Txt variant="h4">{skillData.emoji}</Txt>
            )}
            <Txt variant="h4">{skillData.name}</Txt>
          </Stack>
          
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {skillData.description || 'No description available.'}
          </Typography>

          {skillData.metadata?.learningObjectives && (
            <Stack spacing={1}>
              <Typography variant="h5">Learning Objectives</Typography>
              <Typography variant="body1">
                {skillData.metadata?.learningObjectives.map((objective: string) => (
                  <Typography key={objective} variant="body1">
                    • {objective}
                  </Typography>
                ))}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export const OutlineTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <OutlineTabRenderer {...props} />}
  </ToolTabLayout>
); 