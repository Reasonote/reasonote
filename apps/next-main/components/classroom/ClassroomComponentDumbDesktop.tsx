import React, {
  useEffect,
  useRef,
} from "react";

import {
  Grid,
  Stack,
} from "@mui/material";
import {CoreMessageWithId} from "@reasonote/lib-ai-common";

import ChatTypingIndicator from "../chat/ChatTypingIndicator";
import {ClassroomChat} from "./ClassroomChat";
import {LessonNotificationCard} from "./LessonNotificationCard";

const MAX_WIDTH = '48rem';

interface ClassroomComponentDumbDesktopProps {
  messages: CoreMessageWithId[];
  isGenerating: boolean;
  contextChatCall: (message: string) => void;
  bot: any;
  userMessage: string;
  setUserMessage: (message: string) => void;
  toolCallState: any;
  setToolCallState: (state: any) => void;
  artifactsPanel: React.ReactNode;
  isGeneratingLessons: boolean;
  lessonCount: number;
  onViewLessons: () => void;
  isArtifactsPanelExpanded: boolean;
}

export const ClassroomComponentDumbDesktop: React.FC<ClassroomComponentDumbDesktopProps> = ({
  messages,
  isGenerating,
  contextChatCall,
  bot,
  userMessage,
  setUserMessage,
  toolCallState,
  setToolCallState,
  artifactsPanel,
  isGeneratingLessons,
  lessonCount,
  onViewLessons,
  isArtifactsPanelExpanded,
}) => {
  const artifactsPanelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      isArtifactsPanelExpanded &&
      artifactsPanelRef.current &&
      containerRef.current &&
      !artifactsPanelRef.current.contains(event.target as Node) &&
      containerRef.current.contains(event.target as Node)
    ) {
      const collapseButton = artifactsPanelRef.current.querySelector('button');
      collapseButton?.click();
    }
  };

  useEffect(() => {
    if (isArtifactsPanelExpanded) {
      document.addEventListener('mousedown', handleClickOutside);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const collapseButton = artifactsPanelRef.current?.querySelector('button');
          collapseButton?.click();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isArtifactsPanelExpanded]);

  return (
    <Stack
      ref={containerRef}
      direction="row"
      justifyContent="center"
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        gap: 0
      }}
    >
      <Stack
        sx={{
          maxWidth: MAX_WIDTH,
          width: isArtifactsPanelExpanded ? '0%' : '50%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isArtifactsPanelExpanded ? 0 : 1,
          visibility: isArtifactsPanelExpanded ? 'hidden' : 'visible',
          overflow: 'hidden',
        }}
      >
        <Grid container gap={0} sx={{ height: '100%' }}>
          <Grid item xs={12} sx={{ overflow: 'auto', height: '100%', position: 'relative' }}>
            <ClassroomChat
              chatMessages={messages}
              isGenerating={isGenerating}
              sendButtonClick={() => {
                contextChatCall(userMessage)
              }}
              botInfo={bot}
              botThinkingIcon={<></>}
              loadingIcon={<ChatTypingIndicator />}
              onKeyUp={(ev) => {
                if (ev.key === 'Enter' && ev.shiftKey === false) {
                  contextChatCall(userMessage)
                  setUserMessage('');
                }
              }}
              text={userMessage}
              setText={setUserMessage}
              textSendIsDisabled={userMessage.trim().length === 0}
              toolCallState={toolCallState}
              setToolCallState={setToolCallState}
              submitToolAnswers={(toolCallId, answers) => {
                contextChatCall(
                  answers.map((answer) => `- ${answer}`).join("\n")
                )
              }}
            />
            <Stack
              sx={{
                position: 'absolute',
                bottom: 80, // Above the chat input
                left: 0,
                right: 0,
                padding: 2
              }}
            >
              {(isGeneratingLessons || lessonCount > 0) && (
                <LessonNotificationCard
                  isLoading={isGeneratingLessons}
                  lessonCount={lessonCount}
                  onClick={onViewLessons}
                />
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <Stack
        ref={artifactsPanelRef}
        sx={{
          maxWidth: MAX_WIDTH,
          width: isArtifactsPanelExpanded ? '100%' : '50%',
          height: '100%',
          margin: isArtifactsPanelExpanded ? '0 auto' : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {artifactsPanel}
      </Stack>
    </Stack>
  );
};