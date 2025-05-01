import {useCallback} from "react";

import {Txt} from "@/components/typography/Txt";
import {
  ArrowDownward,
  FitnessCenter,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material";

export type DropLevelType = 'BEGINNER' | 'INTERMEDIATE';

interface SubtopicDropLevelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetLevel: DropLevelType;
  topicName?: string;
}

/**
 * A dialog component that asks the user if they want to drop to a lower difficulty level
 * when they're struggling with the current level.
 */
export function SubtopicDropLevelDialog({
  open,
  onClose,
  onConfirm,
  targetLevel,
  topicName = '',
}: SubtopicDropLevelDialogProps) {
  const handleKeepCurrentLevel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleTryLowerLevel = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="level-drop-dialog-title"
      aria-describedby="level-drop-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: '450px',
          px: 1
        }
      }}
    >
      <DialogTitle id="level-drop-dialog-title" sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Box
            sx={{
              bgcolor: 'warning.light',
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowDownward color="warning" fontSize="small" />
          </Box>
          <Txt variant="h6" sx={{ fontWeight: 500 }}>
            You seem to be struggling...
          </Txt>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <DialogContentText id="level-drop-dialog-description" sx={{ mb: 2 }}>
          Build a stronger foundation by practicing {targetLevel.toLowerCase()} level activities.
        </DialogContentText>
        <Box sx={{
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          mb: 1
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FitnessCenter color="primary" />
            <Txt>
              Learning is most effective when the difficulty matches your current understanding.
            </Txt>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
        <Button
          onClick={handleKeepCurrentLevel}
          color="primary"
          sx={{
            minWidth: '140px',
            borderRadius: 1.5
          }}
        >
          Keep Current Level
        </Button>
        <Button
          onClick={handleTryLowerLevel}
          color="primary"
          variant="contained"
          sx={{
            minWidth: '140px',
            borderRadius: 1.5
          }}
        >
          Try {targetLevel.toLowerCase()} Level
        </Button>
      </DialogActions>
    </Dialog>
  );
} 