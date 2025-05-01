import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Dialog types
import {
  LevelType,
  SubtopicAdvancementDialog,
} from "../practice_v2/SubtopicAdvancementDialog";
import {
  DropLevelType,
  SubtopicDropLevelDialog,
} from "../practice_v2/SubtopicDropLevelDialog";
import {DailyGoalDialog} from "../xp/celebrations/DailyGoalDialog";
import {LevelUpDialog} from "../xp/celebrations/LevelUpDialog";

// Dialog configuration types
type DialogType = 'SubtopicAdvancement' | 'SubtopicDropLevel' | 'LevelUp' | 'DailyGoal';

interface BaseDialogConfig {
  type: DialogType;
  id: string; // Unique identifier for the dialog
  priority?: number; // Higher number = higher priority, default is 0
}

interface SubtopicAdvancementDialogConfig extends BaseDialogConfig {
  type: 'SubtopicAdvancement';
  levelType: LevelType;
  topicName: string;
  onSuggestionAction?: () => void;
  onClose?: () => void;
}

interface SubtopicDropLevelDialogConfig extends BaseDialogConfig {
  type: 'SubtopicDropLevel';
  targetLevel: DropLevelType;
  topicName?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

interface LevelUpDialogConfig extends BaseDialogConfig {
  type: 'LevelUp';
  level: number;
}

interface DailyGoalDialogConfig extends BaseDialogConfig {
  type: 'DailyGoal';
  dailyXp: number;
  currentGoal: number;
  onKeepCurrentGoal: () => void;
  onGoalUpdate: (newGoal: number, temporary: boolean) => void;
}

type DialogConfig = 
  | SubtopicAdvancementDialogConfig
  | SubtopicDropLevelDialogConfig
  | LevelUpDialogConfig
  | DailyGoalDialogConfig;

interface DialogManagerContextType {
  showDialog: (config: DialogConfig) => void;
  closeDialog: (id: string) => void;
  closeCurrentDialog: () => void;
  clearAllDialogs: () => void;
}

const DialogManagerContext = createContext<DialogManagerContextType | undefined>(undefined);

export function useDialogManager() {
  const context = useContext(DialogManagerContext);
  if (!context) {
    throw new Error('useDialogManager must be used within a DialogManagerProvider');
  }
  return context;
}

interface DialogManagerProviderProps {
  children: ReactNode;
}

export function DialogManagerProvider({ children }: DialogManagerProviderProps) {
  const [dialogQueue, setDialogQueue] = useState<DialogConfig[]>([]);
  const [currentDialog, setCurrentDialog] = useState<DialogConfig | null>(null);

  // Process the queue whenever it changes or when the current dialog is closed
  useEffect(() => {
    if (!currentDialog && dialogQueue.length > 0) {
      // Sort by priority (higher number = higher priority)
      const sortedQueue = [...dialogQueue].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      const nextDialog = sortedQueue[0];
      setCurrentDialog(nextDialog);
      setDialogQueue(sortedQueue.slice(1));
    }
  }, [dialogQueue, currentDialog]);

  const showDialog = useCallback((config: DialogConfig) => {
    // If no dialog is currently shown, show it immediately
    if (!currentDialog) {
      setCurrentDialog(config);
    } else {
      // Otherwise, add it to the queue
      setDialogQueue(prev => [...prev, config]);
    }
  }, [currentDialog]);

  const closeDialog = useCallback((id: string) => {
    if (currentDialog && currentDialog.id === id) {
      setCurrentDialog(null);
    } else {
      setDialogQueue(prev => prev.filter(dialog => dialog.id !== id));
    }
  }, [currentDialog]);

  const closeCurrentDialog = useCallback(() => {
    if (currentDialog) {
      setCurrentDialog(null);
    }
  }, [currentDialog]);

  const clearAllDialogs = useCallback(() => {
    setCurrentDialog(null);
    setDialogQueue([]);
  }, []);

  // Render the current dialog based on its type
  const renderCurrentDialog = () => {
    if (!currentDialog) return null;

    switch (currentDialog.type) {
      case 'SubtopicAdvancement':
        return (
          <SubtopicAdvancementDialog
            open={true}
            onClose={() => {
              currentDialog.onClose?.();
              closeCurrentDialog();
            }}
            levelType={currentDialog.levelType}
            topicName={currentDialog.topicName}
            onSuggestionAction={currentDialog.onSuggestionAction}
          />
        );
      case 'SubtopicDropLevel':
        return (
          <SubtopicDropLevelDialog
            open={true}
            onClose={() => {
              currentDialog.onClose?.();
              closeCurrentDialog();
            }}
            onConfirm={() => {
              currentDialog.onConfirm();
              closeCurrentDialog();
            }}
            targetLevel={currentDialog.targetLevel}
            topicName={currentDialog.topicName}
          />
        );
      case 'LevelUp':
        return (
          <LevelUpDialog
            open={true}
            onClose={closeCurrentDialog}
            level={currentDialog.level}
          />
        );
      case 'DailyGoal':
        return (
          <DailyGoalDialog
            open={true}
            onKeepCurrentGoal={() => {
              currentDialog.onKeepCurrentGoal();
              closeCurrentDialog();
            }}
            dailyXp={currentDialog.dailyXp}
            currentGoal={currentDialog.currentGoal}
            onGoalUpdate={(newGoal, temporary) => {
              currentDialog.onGoalUpdate(newGoal, temporary);
              closeCurrentDialog();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DialogManagerContext.Provider
      value={{
        showDialog,
        closeDialog,
        closeCurrentDialog,
        clearAllDialogs,
      }}
    >
      {children}
      {renderCurrentDialog()}
    </DialogManagerContext.Provider>
  );
} 