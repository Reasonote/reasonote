import React from "react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import {
  SimpleSkillChipWithAutoEmoji,
} from "../chips/SkillChip/SkillChipWithAutoEmoji";

interface PodcastNextTopicDialogProps {
  open: boolean;
  onClose: () => void;
  onAddToQueue: (topic: string) => Promise<void>;
  isLoading: boolean;
  suggestedTopics: string[];
}

export const PodcastNextTopicDialog: React.FC<PodcastNextTopicDialogProps> = ({
  open,
  onClose,
  onAddToQueue,
  isLoading,
  suggestedTopics,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Choose Next Topic</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Loading next topic...</Typography>
          </Box>
        ) : (
          <>
            <Typography>Select a topic to add to your podcast queue:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {suggestedTopics.map((topic, index) => (
                <SimpleSkillChipWithAutoEmoji
                  key={index}
                  onClick={() => onAddToQueue(topic)}
                  clickable
                  skillName={topic}
                />
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
