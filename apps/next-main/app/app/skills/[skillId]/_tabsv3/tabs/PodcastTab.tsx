'use client'

import {useState} from "react";

import {
  PodcastGenerationForm,
} from "@/components/podcast/PodcastGenerationForm";
import {PodcastPlayer} from "@/components/podcast/PodcastPlayer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import {ModuleTreeView} from "../ModuleTreeView";
import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";

export const PodcastTabRenderer = ({
  skillId,
  skillTree,
  loading,
  error
}: ToolTabRendererProps) => {
  const [activePodcastId, setActivePodcastId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const onClickLesson = async (lessonId: string) => {
    setActiveSkillId(lessonId);
    setShowGenerator(true);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading podcast: {error.message}</Typography>
      </Box>
    );
  }

  // Show the tree view if no skill is selected or podcast generation not started
  if (!showGenerator) {
    return (
      <Stack sx={{ height: '100%', p: 2 }}>
        <ModuleTreeView
          rootSkillId={skillId}
          loading={loading}
          error={error}
          activeModuleId={activeModuleId}
          activeLessonSkillId={activeSkillId}
          onModuleSelect={setActiveModuleId}
          onLessonSelect={setActiveSkillId}
          lessonActionList={
            <Button variant="contained" color="primary" onClick={() => activeSkillId && onClickLesson(activeSkillId)}>
              Listen to Podcast
            </Button>
          }
        />
      </Stack>
    );
  }

  // Show podcast generator or player once a skill is selected and button clicked
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        {activePodcastId ? (
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => setActivePodcastId(null)}
            variant="outlined"
            size="small"
          >
            Back to Form
          </Button>
        ) : (
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => {
              setShowGenerator(false);
              setActivePodcastId(null);
            }}
            variant="outlined"
            size="small"
          >
            Back to Topics
          </Button>
        )}
      </Stack>
      
      {activePodcastId ? (
        <PodcastPlayer podcastId={activePodcastId} />
      ) : (
        <PodcastGenerationForm 
          skillPath={activeSkillId ? [activeSkillId] : undefined} 
          onAfterGenerate={(podcastId) => {
            setActivePodcastId(podcastId);
          }}
          overrideComponentTitle={`Generate A Podcast`}
        />
      )}
    </Box>
  );
};

export const PodcastTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <PodcastTabRenderer {...props} />}
  </ToolTabLayout>
); 