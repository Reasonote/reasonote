import React, {useState} from "react";

import {AnimatePresence} from "framer-motion";

import {
  FillSubskillTreeRouteResponse,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Box,
  Theme,
  useMediaQuery,
} from "@mui/material";
import {ReasonoteLicenseType} from "@reasonote/core";

import {
  FriendlyNotifierPopover,
} from "../notifications/FriendlyNotifierPopover";
import {
  FriendlyNotifierWrapper,
} from "../notifications/FriendlyNotifierWrapper";
import {ArtifactsPanel} from "./ArtifactsPanel";
import {ClassroomComponentDumbDesktop} from "./ClassroomComponentDumbDesktop";
import {ClassroomComponentDumbMobile} from "./ClassroomComponentDumbMobile";

interface ClassroomComponentDumbProps {
  messages: any[];
  isGenerating: boolean;
  contextChatCall: (userMessage?: string) => Promise<void>;
  bot: any;
  userMessage: string;
  setUserMessage: React.Dispatch<React.SetStateAction<string>>;
  toolCallState: any;
  setToolCallState: React.Dispatch<React.SetStateAction<any>>;
  showLessonPanel: boolean;
  setShowLessonPanel: React.Dispatch<React.SetStateAction<boolean>>;
  currentTab: 'lesson' | 'skill-tree';
  setCurrentTab: (tab: 'lesson' | 'skill-tree') => void;
  selectedLessonId: string | null;
  onPickLesson: (lessonId: string | null) => void;
  lastLessonIdGroup: string[] | null;
  onActivityComplete: (res: any) => void;
  onLessonComplete: () => void;
  usingSkillId: string | null;
  courseId: string | null;
  skillTreeResult: FillSubskillTreeRouteResponse | null;
  isGeneratingLessons?: boolean;
  lessonCount?: number;
  onViewLessons: () => void;
  onCreateLesson?: (skillId: string) => void;
  isOverLimit?: boolean;
  licenseType?: ReasonoteLicenseType;
}

export function ClassroomComponentDumb(props: ClassroomComponentDumbProps) {
  const [isArtifactsPanelExpanded, setIsArtifactsPanelExpanded] = useState(false);
  const isSmallDevice = useIsSmallDevice();

  const {
    showLessonPanel,
    setShowLessonPanel,
    currentTab,
    setCurrentTab,
    selectedLessonId,
    onPickLesson,
    lastLessonIdGroup,
    onActivityComplete,
    onLessonComplete,
    usingSkillId,
    courseId,
    skillTreeResult,
    isGeneratingLessons = false,
    lessonCount = 0,
    onCreateLesson,
    onViewLessons,
    isOverLimit,
    licenseType,
    ...sharedProps
  } = props;

  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  const artifactsPanel = (
    <ArtifactsPanel
      showTabs={!isMobile}
      currentTab={currentTab}
      setCurrentTab={setCurrentTab as any}
      isMobile={isMobile}
      onCreateLesson={onCreateLesson}
      selectedLessonId={selectedLessonId}
      onPickLesson={(lessonId) => {
        if (lessonId) {
          setIsArtifactsPanelExpanded(true);
        }
        onPickLesson(lessonId);
      }}
      onActivityComplete={onActivityComplete}
      onLessonComplete={onLessonComplete}
      usingSkillId={usingSkillId}
      courseId={courseId}
      skillTreeResult={skillTreeResult}
      lastLessonIdGroup={lastLessonIdGroup}
      hasNewLessons={isGeneratingLessons || lessonCount > 0}
      isExpanded={isArtifactsPanelExpanded}
      onToggleExpand={() => setIsArtifactsPanelExpanded(!isArtifactsPanelExpanded)}
    />
  );

  return (
    <>
      <Box sx={{ 
        opacity: isOverLimit ? 0.5 : 1,
        pointerEvents: isOverLimit ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
        filter: isOverLimit ? 'blur(2px)' : 'none',
        height: '100%',
      }}>
        {isMobile ? (
          <ClassroomComponentDumbMobile
            {...sharedProps}
            selectedLessonId={selectedLessonId}
            showLessonPanel={showLessonPanel}
            setShowLessonPanel={setShowLessonPanel}
            artifactsPanel={artifactsPanel}
            isGeneratingLessons={isGeneratingLessons}
            lessonCount={lessonCount}
            setCurrentTab={(tab: string) => setCurrentTab(tab as 'lesson' | 'skill-tree')}
            onViewLessons={onViewLessons}
          />
        ) : (
          <ClassroomComponentDumbDesktop
            {...sharedProps}
            artifactsPanel={artifactsPanel}
            isGeneratingLessons={isGeneratingLessons}
            lessonCount={lessonCount}
            onViewLessons={onViewLessons}
            isArtifactsPanelExpanded={isArtifactsPanelExpanded}
          />
        )}
      </Box>

      <AnimatePresence>
        {isOverLimit && (
          <FriendlyNotifierWrapper isVisible={!!isOverLimit}>
            <FriendlyNotifierPopover
              title={licenseType === 'Reasonote-Anonymous' ? 'Keep Learning!' : "Let's Keep Learning!"}
              subtitle={
                licenseType === 'Reasonote-Anonymous' 
                  ? <>
                    To keep making lessons, please create a free account.
                  </>
                  : <>
                    You've hit your daily limit of lessons.
                    <br />
                    To keep making lessons, please upgrade.
                  </>
              }
              features={[
                { icon: '📚', label: 'More lessons per day' },
                { icon: '🎯', label: 'Advanced learning features' },
                { icon: '🎧', label: 'More podcasts per day' },
                { icon: '💖', label: '...and more!' }
              ]}
              licenseType={licenseType ?? 'Reasonote-Free'}
              illustration="/images/illustrations/step_to_the_sun.svg"
            />
          </FriendlyNotifierWrapper>
        )}
      </AnimatePresence>
    </>
  );
}