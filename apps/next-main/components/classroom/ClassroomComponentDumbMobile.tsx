import React from "react";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Stack,
} from "@mui/material";
import {CoreMessageWithId} from "@reasonote/lib-ai-common";

import ChatTypingIndicator from "../chat/ChatTypingIndicator";
import {ClassroomIcon} from "../icons/ClassroomIcon";
import {LessonIcon} from "../icons/LessonIcon";
import {Txt} from "../typography/Txt";
import {ClassroomChat} from "./ClassroomChat";
import {ToolCallStateMap} from "./ClassroomChatMessages";
import {LessonNotificationCard} from "./LessonNotificationCard";

interface ClassroomComponentDumbMobileProps {
  messages: CoreMessageWithId[];
  isGenerating: boolean;
  contextChatCall: (message: string) => void;
  bot: {
    name: string;
    description: string;
    avatar: string;
  };
  userMessage: string;
  setUserMessage: (message: string) => void;
  toolCallState: ToolCallStateMap;
  setToolCallState: (state: ToolCallStateMap) => void;
  showLessonPanel: boolean;
  setShowLessonPanel: (show: boolean) => void;
  artifactsPanel: React.ReactNode;
  selectedLessonId: string | null;
  isGeneratingLessons: boolean;
  lessonCount: number;
  setCurrentTab: (tab: string) => void;
  onViewLessons: () => void;
}

export const ClassroomComponentDumbMobile: React.FC<ClassroomComponentDumbMobileProps> = ({
  messages,
  isGenerating,
  contextChatCall,
  bot,
  userMessage,
  setUserMessage,
  toolCallState,
  setToolCallState,
  showLessonPanel,
  setShowLessonPanel,
  artifactsPanel,
  selectedLessonId,
  isGeneratingLessons,
  lessonCount,
  setCurrentTab,
  onViewLessons,
}) => {
  const handleShowLessons = () => {
    setShowLessonPanel?.(true);
    setCurrentTab('lesson');
    onViewLessons?.();
  };

  return (
    <Stack
      sx={{ 
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: '100%',
      }}
    >
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
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
              if (ev.key === 'Enter' && ev.shiftKey === false){
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
        </Box>
        <Stack 
          sx={{ 
            position: 'absolute', 
            bottom: 80,
            left: 0,
            right: 0,
            padding: 2,
            zIndex: 1000, // Ensure it's above the chat but below the lesson panel
          }}
        >
          {(isGeneratingLessons || lessonCount > 0) && (
            <LessonNotificationCard
              isLoading={isGeneratingLessons}
              lessonCount={lessonCount}
              onClick={handleShowLessons}
            />
          )}
        </Stack>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 1000,
          }}
        >
          <Badge 
            color="error" 
            variant="dot" 
            invisible={!(isGeneratingLessons || lessonCount > 0)}
          >
            <Button
              variant="contained"
              onClick={handleShowLessons}
              startIcon={<LessonIcon />}
            >
              Lessons
            </Button>
          </Badge>
        </Box>
        {showLessonPanel && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1100,
              overflow: 'auto',
              height: '100%',
            }}
          >
            <Card sx={{p: 0, height: '100%', width: '100%'}}>
              <Stack spacing={2} height="100%">
                {
                  !selectedLessonId && (
                    <Breadcrumbs
                      separator={<NavigateNextIcon fontSize="small" />}
                      aria-label="breadcrumb"
                      sx={{
                        height: 'fit-content',
                        padding: 0,
                      }}
                    >
                      <Txt
                        color="inherit"
                        onClick={() => setShowLessonPanel?.(false)}
                        sx={{ cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                        startIcon={<ClassroomIcon size={20}/>}
                      >
                        Classroom
                      </Txt>
                      <Txt color="text.primary" startIcon={<LessonIcon fontSize="small"/>}>Lessons</Txt>
                    </Breadcrumbs>
                  )
                }
                
                <Box sx={{height: '100%'}}>
                  {artifactsPanel}
                </Box>
              </Stack>
            </Card>
          </Box>
        )}
      </Box>
    </Stack>
  );
};