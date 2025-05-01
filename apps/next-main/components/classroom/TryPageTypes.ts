import {CoreMessageWithId} from "@reasonote/lib-ai-common";

import {ClassroomBots} from "./ClassroomBots";
import {ToolCallStateMap} from "./ClassroomChatMessages";

export interface ClassroomComponentProps {
  messages: CoreMessageWithId[];
  isGenerating: boolean;
  contextChatCall: (message?: string) => void;
  bot: typeof ClassroomBots[number];
  userMessage: string;
  setUserMessage: (message: string) => void;
  toolCallState: ToolCallStateMap;
  setToolCallState: (state: ToolCallStateMap) => void;
  showLessonPanel?: boolean;
  setShowLessonPanel?: (show: boolean) => void;
  selectedLessonId: string | null;
  setSelectedLessonId: (lessonId: string | null) => void;
}