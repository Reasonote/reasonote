import _ from "lodash";

import {useTheme} from "@emotion/react";
import {CoreToolMessageWithId} from "@reasonote/lib-ai-common";

/**
 * Toolcallid => state
 */
export type ToolCallStateMap = Record<string, any>;

export function ToolCoreMessage({ message, toolCallState, setToolCallState, submitToolAnswers, isThinking, botThinkingIcon, isLastMessage, ...props }: {
  message: CoreToolMessageWithId
  toolCallState: ToolCallStateMap
  setToolCallState: (updater: (state: ToolCallStateMap) => ToolCallStateMap) => void
  submitToolAnswers: (toolCallId: string, answers: any) => void,
  isThinking?: boolean,
  botThinkingIcon?: React.ReactNode,
  isLastMessage?: boolean
}) {
  const theme = useTheme();

  if (_.isString(message.content)) {
    return null;
  }
  else {
    return null;
  }
}