"use client";
import React from "react";

import {
  CoreMessage,
  CoreUserMessage,
  DeepPartial,
} from "ai";
import _ from "lodash";
import {
  CheckCircleIcon,
  CheckIcon,
  EditIcon,
  SearchIcon,
  UndoIcon,
} from "lucide-react";
import {ErrorBoundary} from "react-error-boundary";

import {AnswerChoice} from "@/components/activity/components/AnswerChoice";
import {
  AnswerChoiceAdd,
} from "@/components/activity/components/AnswerChoiceAdd";
import {
  BotFormWrapper,
} from "@/components/chat/Messages/BotForm/BotFormWrapper";
import {
  BotMessage,
  BotMessageProps,
} from "@/components/chat/Messages/BotMessage/BotMessage";
import {SystemMessage} from "@/components/chat/Messages/SystemMessage";
import {UserMessage} from "@/components/chat/Messages/UserMessage";
import {LessonIcon} from "@/components/icons/LessonIcon";
import {Txt} from "@/components/typography/Txt";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Badge,
  Button,
  CircularProgress,
  Fade,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {CoreAssistantMessageWithId} from "@reasonote/lib-ai-common";

import {ToolCoreMessage} from "../chat/Messages/V2/ToolMessage/ToolMessage";
import {CurUserAvatar} from "../users/profile/CurUserAvatar";
import {UserSkill} from "./schema";

export function UserOptions({ options, friendlyText, submitAnswers, answersSubmitted, showAddOptionButton, selectedAnswers, setSelectedAnswers, }: { options: { emoji?: string, text?: string }[], selectedAnswers: string[], showAddOptionButton?: boolean, setSelectedAnswers: (selectedAnswers: string[]) => void, answersSubmitted: boolean, submitAnswers: () => void, friendlyText?: string }) {
  const allOptions = [...(options.map(o => ({ emoji: o.emoji || '', text: o.text || '' }))), ...(selectedAnswers ? selectedAnswers.map(s => ({ emoji: '✏️', text: s })) : [])].reduce((acc, curr) => {
    if (!acc.some(o => o.text === curr.text)) {
      acc.push(curr)
    }
    return acc
  }, [] as { emoji: string, text: string }[])

  const theme = useTheme();

  return options.length > 0 ?
    (
      answersSubmitted ?
        <UserActionMessage
          icon={<CheckCircleIcon color={theme.palette.text.secondary} size={12} />}
          text="Answers submitted"
        />
        :
        <BotFormWrapper>
          <Stack gap={1}>
            {friendlyText ? <Txt textAlign={'center'} fontStyle={'italic'}>{friendlyText}</Txt> : null}
            <Grid container spacing={2}>
              {allOptions.map((option, i) => {
                return <Grid item xs={12} sm={12} key={i}>
                  <AnswerChoice
                    answerChoice={`${option.emoji} ${option.text}`}
                    isCorrectAnswer={false}
                    isUserAnswer={false}
                    isSelected={selectedAnswers.includes(option.text)}
                    answersSubmitted={answersSubmitted}
                    onSelectChange={function (selected: boolean): void {
                      setSelectedAnswers(selected ? [...selectedAnswers, option.text] : selectedAnswers.filter((s) => s !== option.text))
                    }}
                    isSmallDevice={false}
                    animateTyping
                  />
                </Grid>
              })}
              {
                showAddOptionButton && (
                  <Fade in={showAddOptionButton}>
                    <Grid item xs={12} sm={12}>
                      <AnswerChoiceAdd
                        primaryText="Add Option"
                        secondaryText="Click here or chat back to add your own option."
                        placeholder="I want..."
                        onAddChoice={(choice) => {
                          setSelectedAnswers([...selectedAnswers, choice])
                        }}
                      />
                    </Grid>
                  </Fade>
                )
              }

            </Grid>

            <Button variant="contained" onClick={submitAnswers} disabled={selectedAnswers.length === 0}>Submit Answers</Button>
          </Stack>
        </BotFormWrapper>
    ) : null
}

export function UpdateSubjectContextToolCallMessage({ subjectContext, botName, botIcon }: { subjectContext: DeepPartial<UserSkill> | null, botName: string, botIcon: string }) {
  const reasonsUpdated = (subjectContext?.interest_reasons?.length ?? 0) > 0;
  const levelsUpdated = (subjectContext?.self_assigned_level?.length ?? 0) > 0;
  const specificsUpdated = (subjectContext?.specifics?.length ?? 0) > 0;
  const anyUpdates = reasonsUpdated || levelsUpdated || specificsUpdated;
  const theme = useTheme();

  const UpdateTxt = ({ children }) => {
    return <Txt variant="caption" color={theme.palette.text.secondary} fontStyle={'italic'} startIcon={<EditIcon size={12} color={theme.palette.text.secondary} />}>{children}</Txt>
  }

  const updatedStrings = [
    (reasonsUpdated ? 'Reasons' : null),
    (levelsUpdated ? 'Levels' : null),
    (specificsUpdated ? 'Specifics' : null)
  ].filter(notEmpty).join(', ')

  return anyUpdates ? <BotActionMessage
    avatar={botIcon}
    icon={<EditIcon size={16} color={theme.palette.text.secondary} />}
    text={`Updated ${updatedStrings}`}
  />
    : null
}


function UserActionMessage({icon, text}: {icon: React.ReactNode, text: string}){
  const theme = useTheme();

  return <Txt startIcon={<Badge badgeContent={<CurUserAvatar sx={{ width: 12, height: 12 }} />}>{icon}</Badge>} variant="caption" color={theme.palette.text.secondary} fontStyle={'italic'} stackOverrides={{justifyContent: 'end'}}>
    {text}
  </Txt>
}

function BotActionMessage({avatar, icon, text}: {avatar: React.ReactNode | string, icon: React.ReactNode, text: string}){
  const theme = useTheme();

  return <Txt startIcon={<Badge badgeContent={avatar}>{icon}</Badge>} variant="caption" color={theme.palette.text.secondary} fontStyle={'italic'}>
    {text}
  </Txt>
}

/**
 * Toolcallid => state
 */
export type ToolCallStateMap = Record<string, any>;

export function BotCoreMessage({ message, botInfo, toolCallState, setToolCallState, submitToolAnswers, isThinking, botThinkingIcon, isLastMessage, ...props }: {
  message: CoreAssistantMessageWithId
  botInfo: {
    name: string;
    description: string;
    avatar: string;
  }
  toolCallState: ToolCallStateMap
  setToolCallState: (updater: (state: ToolCallStateMap) => ToolCallStateMap) => void
  submitToolAnswers: (toolCallId: string, answers: any) => void,
  isThinking?: boolean,
  botThinkingIcon?: React.ReactNode,
  isLastMessage?: boolean
} & Partial<BotMessageProps>) {
  const theme = useTheme();

  if (_.isString(message.content)) {
    return <BotMessage
      {...props}
      key={message.id}
      msg={{ content: message.content }}
      i={0}
      overrideName={botInfo.name}
      overrideIcon={botInfo.avatar}
      isThinking={isThinking}
      thinkingIcon={botThinkingIcon}
    />
  }
  else {
    return <div>
      {_.flatten(message.content.map((part, i) => {
        if (part.type === "text") {
          if (part.text.trim().length < 1) {
            return null;
          }
          return <BotMessage  {...props} key={`${message.id}-${i}-txt`} msg={{ content: part.text }} i={i} overrideName={botInfo.name} overrideIcon={botInfo.avatar} />
        }
        else if (part.type === "tool-call") {
          const state = toolCallState[part.toolCallId]
          
          if (!part.toolName) {
            return <div>Unknown Tool Call: {part.toolCallId} <pre>{JSON.stringify(part, null, 2)}</pre></div>
          }

          if (part.toolName.toLowerCase() === 'offeruseroptions') {
            // TODO: move types into a client library
            // const offerUserOptions = part.args as z.infer<OfferUserOptionsTool['args']>;
            const offerUserOptions = part.args as any;

            return <Stack gap={2}>
              {offerUserOptions?.options && offerUserOptions?.friendlyText ?
                <UserOptions
                  key={`user-options`}
                  // Unless we're done, we don't want to show the final option because it may be in progress.
                  options={offerUserOptions?.options.filter(notEmpty)}
                  selectedAnswers={state?.selectedAnswers ?? []}
                  setSelectedAnswers={(selectedAnswers) => {
                    setToolCallState((state) => ({
                      ...state,
                      [part.toolCallId]: {
                        selectedAnswers: selectedAnswers,
                        answersSubmitted: false
                      }
                    }))
                  }}
                  friendlyText={offerUserOptions.friendlyText}
                  answersSubmitted={state?.answersSubmitted ?? false}
                  submitAnswers={() => {
                    setToolCallState((state) => ({
                      ...state,
                      [part.toolCallId]: {
                        answersSubmitted: true
                      }
                    }))
                    submitToolAnswers(part.toolCallId, state?.selectedAnswers ?? [])
                  }}
                  showAddOptionButton={offerUserOptions?.finalEndText ? true : false}
                />
                : null
              }
            </Stack>
          }

          if (part.toolName.toLowerCase() === "updateuserskill") {
            return <UpdateSubjectContextToolCallMessage
              key={`update-subject-context`}
              subjectContext={part.args as DeepPartial<UserSkill>}
              botName={botInfo.name}
              botIcon={botInfo.avatar}
            />
          }

          if (part.toolName.toLowerCase() === "suggestlessons" && !!part.args ) {
            return message.complete ?
              <BotActionMessage
                avatar={botInfo.avatar}
                icon={<LessonIcon fontSize="small" sx={{ color: theme.palette.text.secondary, width: 16, height: 16 }} />}
                text="Generated Lessons"
              />
              :
              <BotActionMessage
                avatar={botInfo.avatar}
                icon={<CircularProgress size={16} />}
                text="Generating Lessons"
              />
          }

          // if (part.toolName === "json" && part.args) {
          //   const { message: msg, outputs, z_eot } = part.args as DeepPartial<CombinedGen>;

          //   const isDone = notEmpty(z_eot);

          //   const selectedAnswers = state ? state.selectedAnswers : []
          //   const answersSubmitted = state ? state.answersSubmitted : false

          //   return <Stack gap={2} key={`${message.id}-${i}-msg`}>
          //     <BotMessage
          //       {...props}
          //       key={`${message.id}-${i}-msg`}
          //       msg={{ content: msg }}
          //       i={i}
          //       overrideName={botInfo.name}
          //       overrideIcon={botInfo.avatar}
          //       isThinking={isLastMessage && isThinking}
          //       thinkingIcon={botThinkingIcon}
          //     />
          //     {
          //       outputs?.updateUserSkill ?
          //         <UpdateSubjectContextToolCallMessage
          //           key={`update-subject-context`}
          //           subjectContext={outputs.updateUserSkill}
          //           botName={botInfo.name}
          //           botIcon={botInfo.avatar}
          //         />
          //         : null
          //     }
          //     {outputs?.offerUserOptions && outputs.offerUserOptions.options && outputs.offerUserOptions.friendlyText ?
          //       <UserOptions
          //         key={`user-options`}
          //         // Unless we're done, we don't want to show the final option because it may be in progress.
          //         options={isDone ? outputs.offerUserOptions.options.filter(notEmpty) : outputs.offerUserOptions.options.slice(0, -1).filter(notEmpty)}
          //         selectedAnswers={selectedAnswers}
          //         setSelectedAnswers={(selectedAnswers) => {
          //           setToolCallState((state) => ({
          //             ...state,
          //             [part.toolCallId]: {
          //               selectedAnswers: selectedAnswers,
          //               answersSubmitted: false
          //             }
          //           }))
          //         }}
          //         friendlyText={outputs.offerUserOptions.friendlyText}
          //         answersSubmitted={answersSubmitted}
          //         submitAnswers={() => {
          //           setToolCallState((state) => ({
          //             ...state,
          //             [part.toolCallId]: {
          //               answersSubmitted: true
          //             }
          //           }))
          //           submitToolAnswers(part.toolCallId, selectedAnswers)
          //         }}
          //         showAddOptionButton={outputs?.offerUserOptions?.finalEndText ? true : false}
          //       />
          //       : null
          //     }
          //     {outputs?.suggestLessons ?
          //       <div
          //           {...props}
          //           key={`${message.id}-${i}-suggest-lessons`}
          //         >
          //           {
          //             isDone ?
          //               <BotActionMessage
          //                 avatar={botInfo.avatar}
          //                 icon={<LessonIcon fontSize="small" sx={{ color: theme.palette.text.secondary, width: 16, height: 16 }} />}
          //                 text={`Generated ${outputs.suggestLessons.lessons?.length ?? ''} lessons`}
          //               />
          //               :
          //               <BotActionMessage
          //                 avatar={botInfo.avatar}
          //                 icon={<CircularProgress size={16} />}
          //                 text="Generating Lessons"
          //               />
          //           }
          //         </div> 
          //         : 
          //         null
          //     }

          //     {/* {outputs?.showActivities ? <BotMessageWrapper
          //         {...props}
          //         key={`${message.id}-${i}-ready-to-start`}
          //       >Lesson Marked Ready to Start</BotMessageWrapper> : null} */}
          //   </Stack>
          // }
          if (part.toolName === 'thought') {
            if (part.args && typeof part.args === 'object' && 'thought' in part.args) {
              return <BotMessage
                key={`${message.id}-${i}-msg`}
                msg={{ content: part.args.thought as string }}
                i={i}
                overrideName={botInfo.name}
                overrideIcon={botInfo.avatar}
                isThinking={isThinking}
                thinkingIcon={botThinkingIcon}
              />
            }
          }

          if (part.toolName.toLowerCase() === 'searchrn') {
            return <BotActionMessage
              avatar={botInfo.avatar}
              icon={<SearchIcon size={16} color={theme.palette.text.secondary} />}
              text="Searching"
            />
          }
        }
      })).filter(notEmpty)}
    </div>
  }
}

export function UserCoreMessage({ message }: {
  message: CoreUserMessage & { id: string }
}) {
  const theme = useTheme();
  if (_.isString(message.content)) {
    // Parse for <ActionActivityCompleted
    if (message.content.trim().startsWith('<ActionActivityCompleted')) {
      // Not showing this to the user now, since it isn't very helpful.
      // Parse out the specific activity
      // const result = ActivityResultSchema.safeParse(message.content.match(/<ActionActivityCompleted activityResult="([^"]+)"/)?.[1]);
      // if (result.success) {
      //   const { data } = result;
      //   return <BotMessageWrapper>
      //     <Txt variant="caption" color={theme.palette.text.secondary} fontStyle={'italic'} startIcon={<CheckIcon size={12} color={theme.palette.text.secondary} />}>{data.type} Activity Completed</Txt>
      //   </BotMessageWrapper>
      // }
      // else {
      //   return <BotMessageWrapper>
      //     <Txt variant="caption" color={theme.palette.text.secondary} fontStyle={'italic'} startIcon={<CheckIcon size={12} color={theme.palette.text.secondary} />}>Activity Completed</Txt>
      //   </BotMessageWrapper>
      // }
      return null
    }

    if (message.content.trim().startsWith('<ActionUserRequestedNewLesson')) {
      return <UserActionMessage
        icon={<CheckIcon size={12} color={theme.palette.text.secondary} />}
        text="Lesson Requested"
      />
    }

    // Parse for <ActionUserPickedLesson
    if (message.content.trim().startsWith('<ActionUserPickedLesson')) {
      return <UserActionMessage
        icon={<LessonIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />}
        text="Lesson Chosen"
      />
    }

    if (message.content.trim().startsWith('<ActionUserLeftLesson')) {
      return <UserActionMessage
        icon={<UndoIcon size={12} color={theme.palette.text.secondary} />}
        text="Left Lesson"
      />
    }

    if (message.content.trim().length < 2) {
      return null
    }

    return <UserMessage key={message.id} msg={{ content: message.content }} />
  }
  else {
    return <div>
      {message.content.map((part, i) => {
        return JSON.stringify(part).trim().length > 0 ?
          <UserMessage key={message.id} msg={{ content: JSON.stringify(part) }} />
          : null
      })}
    </div>
  }
}

function MessageErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <Stack spacing={1} p={2} sx={{
      backgroundColor: 'error.light',
      borderRadius: 1,
      color: 'error.contrastText'
    }}>
      <Typography variant="subtitle2">
        Error displaying message:
      </Typography>
      <Typography variant="body2">
        {error.message}
      </Typography>
    </Stack>
  );
}

export function CoreMessageDisplay({ message, botInfo, toolCallState, setToolCallState, submitToolAnswers, botThinkingIcon, botIsThinking, isLastMessage }: {
  message: CoreMessage & { id: string },
  botInfo: {
    name: string;
    description: string;
    avatar: string;
  }
  toolCallState: ToolCallStateMap,
  setToolCallState: (updater: (state: ToolCallStateMap) => ToolCallStateMap) => void
  submitToolAnswers: (toolCallId: string, answers: any) => void,
  botThinkingIcon?: React.ReactNode
  botIsThinking?: boolean
  isLastMessage?: boolean
}) {
  return (
    //@ts-ignore
    <ErrorBoundary
      FallbackComponent={MessageErrorFallback}
      onReset={() => {
        // Optional: Add any reset logic here
      }}
      resetKeys={[message.id]} // Reset when message ID changes
    >
      <div>
        {message.role === "assistant" && (
          <BotCoreMessage
            message={message}
            isLastMessage={isLastMessage}
            disableEditing
            botInfo={botInfo}
            toolCallState={toolCallState}
            setToolCallState={setToolCallState}
            submitToolAnswers={submitToolAnswers}
            botThinkingIcon={botThinkingIcon}
            isThinking={botIsThinking}
          />
        )}
        {
          message.role === "tool" && (
            <ToolCoreMessage
              message={message}
              isLastMessage={isLastMessage}
              toolCallState={toolCallState}
              setToolCallState={setToolCallState}
              submitToolAnswers={submitToolAnswers}
            />
          )
        }
        {message.role === "user" && <UserCoreMessage message={message} />}
        {message.role === "system" && <SystemMessage msg={message} />}
      </div>
    </ErrorBoundary>
  );
}