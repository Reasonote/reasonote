import React from "react";

import {posthog} from "posthog-js";

import {
  AccountTree,
  CloseFullscreen,
  OpenInFull,
  School as SchoolIcon,
} from "@mui/icons-material";
import {
  Badge,
  IconButton,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";

import {CustomTabPanel} from "../tabs/CustomTab";
import {LessonPanel} from "./LessonPanel";
import {SkillTreePanel} from "./SkillTreePanel";

interface ArtifactsPanelProps {
  showTabs?: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobile: boolean;
  selectedLessonId: string | null;
  onPickLesson: (lessonId: string | null) => void;
  onActivityComplete: (res: any) => void;
  onLessonComplete: () => void;
  usingSkillId: string | null;
  courseId: string | null;
  skillTreeResult: any;
  lastLessonIdGroup: string[] | null;
  hasNewLessons?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onCreateLesson?: (skillId: string) => void;
}

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({
  showTabs = true,
  currentTab,
  setCurrentTab,
  isMobile,
  selectedLessonId,
  onPickLesson,
  onActivityComplete,
  onLessonComplete,
  usingSkillId,
  courseId,
  skillTreeResult,
  lastLessonIdGroup,
  hasNewLessons = false,
  isExpanded = false,
  onToggleExpand,
  onCreateLesson,
}) => {
  const handlePickLesson = (lessonId: string | null) => {
    if (lessonId) {
      posthog.capture('classroom_lesson_opened', {
        lessonId,
        skillId: usingSkillId
      }, {
        send_instantly: true,
      });
    }
    onPickLesson(lessonId);
  };

  const handleLessonComplete = () => {
    posthog.capture('classroom_lesson_completed', {
      lessonId: selectedLessonId,
      skillId: usingSkillId
    }, {
      send_instantly: true,
    });
    onLessonComplete();
  };

  const handleActivityComplete = (res: any) => {
    onActivityComplete(res);
  };

  const handleTabChange = (newTab: string) => {
    posthog.capture('classroom_tab_switched', {
      skillId: usingSkillId,
      fromTab: currentTab,
      toTab: newTab
    }, {
      send_instantly: true,
    });
    setCurrentTab(newTab);
  };

  const lessonPanel = (
    <LessonPanel
      lessons={[]}
      skillId={usingSkillId ?? ""}
      courseId={courseId ?? ""}
      selectedLessonId={selectedLessonId}
      onPickLesson={handlePickLesson}
      onActivityComplete={handleActivityComplete}
      onLessonComplete={handleLessonComplete}
      lastLessonIdGroup={lastLessonIdGroup}
    />
  );

  if (!showTabs) {
    return lessonPanel;
  }

  return (
    <Stack flex={1} sx={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <Stack direction="row" alignItems="center">
        {!isMobile && onToggleExpand && (
            <IconButton 
              size="small" 
              onClick={onToggleExpand}
              sx={{ 
                ml: 0.5, 
                mr: 0.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              {isExpanded ? <CloseFullscreen /> : <OpenInFull />}
            </IconButton>
          )}
          <Tabs
            sx={{ minHeight: "40px", height: "40px", flex: 1 }}
            value={currentTab}
            onChange={(e, newValue) => handleTabChange(newValue)}
          >
            <Tab
              sx={{ minHeight: "40px", height: "40px", }}
              value={'lesson'}
              label={
                <Badge color="error" variant="dot" invisible={!hasNewLessons}>
                  Lesson
                </Badge>
              }
              icon={<SchoolIcon />}
              iconPosition="start"
              data-testid="lesson-tab"
            />
            {!isMobile && (
              <Tab
                sx={{ minHeight: "40px", height: "40px", }}
                value={'skill-tree'}
                label="Skill Tree"
                icon={<AccountTree />}
                iconPosition="start"
              />
            )}
        </Tabs>
      </Stack>
      <Stack sx={{ 
          minHeight: '30px', 
          height: '100%',
          maxHeight: '100%',
          width: '100%', 
          flex: 1, 
          overflowY: 'auto', 
          border: 'gray 1px solid', 
          borderRadius: '5px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <CustomTabPanel key={'lesson'} currentValue={currentTab} value={'lesson'} boxProps={{sx: {height: '100%', maxHeight: '100%'}}} divProps={{style: {height: '100%', maxHeight: '100%'}}}>
            {lessonPanel}
          </CustomTabPanel>
          {!isMobile && (
            <CustomTabPanel key={'skill-tree'} currentValue={currentTab} value={'skill-tree'} boxProps={{sx: {height: '100%', maxHeight: '100%'}}} divProps={{style: {height: '100%', maxHeight: '100%'}}}>
              <SkillTreePanel 
                usingSkillId={usingSkillId} 
                skillTreeResult={skillTreeResult} 
                onCreateLesson={onCreateLesson}
              />
            </CustomTabPanel>
          )}
      </Stack>
    </Stack>
  );
};