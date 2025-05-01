import React, {
  useEffect,
  useState,
} from "react";

import {
  FastForward,
  FastRewind,
  Pause,
  PlayArrow,
  QueueMusic,
  SkipNext,
  SkipPrevious,
  Timer as TimerIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  Typography,
} from "@mui/material";

import {Txt} from "../typography/Txt";

interface PodcastControlsProps {
  isPaused: boolean;
  isAudioAvailable: boolean;
  currentDialogueIndex: number;
  transcriptLength: number;
  isNextTopicLoading: boolean;
  speed: number;
  onPlayPause: () => void;
  onSkipToPrevious: () => void;
  onSeekPrevious: () => void;
  onSeekNext: () => void;
  onSkipToNext: () => void;
  onSpeedChange: (speed: number) => void;
  onQueueOpen: () => void;
}

export const PodcastControls: React.FC<PodcastControlsProps> = ({
  isPaused,
  isAudioAvailable,
  currentDialogueIndex,
  transcriptLength,
  isNextTopicLoading,
  speed,
  onPlayPause,
  onSkipToPrevious,
  onSeekPrevious,
  onSeekNext,
  onSkipToNext,
  onSpeedChange,
  onQueueOpen,
}) => {
  const [isSpeedDialogOpen, setIsSpeedDialogOpen] = useState(false);
  const [tempSpeed, setTempSpeed] = useState(speed);

  useEffect(() => {
    setTempSpeed(speed);
  }, [speed]);

  const handleOpenSpeedDialog = () => setIsSpeedDialogOpen(true);
  const handleCloseSpeedDialog = () => {
    setIsSpeedDialogOpen(false);
    onSpeedChange(tempSpeed);
  };

  const handleSpeedChange = (event: Event, newValue: number | number[]) => {
    setTempSpeed(newValue as number);
  };

  const speedMarks = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 1.75, label: '1.75x' },
    { value: 2, label: '2x' },
  ];

  return (
    <Box sx={{ 
      mt: 2, 
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      width: '100%',
    }}>
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
        <IconButton onClick={handleOpenSpeedDialog} sx={{ position: 'relative' }}>
          <TimerIcon sx={{opacity: 0}}/>
          <Typography
            variant="body2"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'inherit',
            }}
          >
            {speed}x
          </Typography>
        </IconButton>
      </Box> {/* Empty box for left side spacing */}
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton onClick={onSkipToPrevious} disabled={!isAudioAvailable}>
          <SkipPrevious />
        </IconButton>
        <IconButton onClick={onSeekPrevious} disabled={currentDialogueIndex <= 0 || !isAudioAvailable}>
          <FastRewind />
        </IconButton>
        <IconButton 
          onClick={onPlayPause} 
          disabled={!isAudioAvailable}
          sx={{
            width: isPaused ? 64 : 48,
            height: isPaused ? 64 : 48,
            backgroundColor: isPaused ? 'primary.main' : 'transparent',
            '&:hover': {
              backgroundColor: isPaused ? 'primary.dark' : 'action.hover',
            },
            transition: 'all 0.3s',
            mx: 1,
          }}
        >
          {isPaused ? 
            <PlayArrow sx={{ fontSize: 40, color: 'white' }} /> : 
            <Pause sx={{ fontSize: 24 }} />
          }
        </IconButton>
        <IconButton onClick={onSeekNext} disabled={currentDialogueIndex >= transcriptLength - 1 || !isAudioAvailable}>
          <FastForward />
        </IconButton>
        <IconButton onClick={onSkipToNext} disabled={!isAudioAvailable || isNextTopicLoading}>
          <SkipNext />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Dialog open={isSpeedDialogOpen} onClose={handleCloseSpeedDialog}>
          <DialogTitle>
            <Txt startIcon={<TimerIcon />}>Adjust Speed</Txt>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ width: 300, mt: 2 }}>
              <Slider
                value={tempSpeed}
                onChange={handleSpeedChange}
                aria-labelledby="speed-slider"
                step={null}
                marks={speedMarks}
                min={0.5}
                max={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSpeedDialog}>Apply</Button>
          </DialogActions>
        </Dialog>

        <IconButton
          onClick={onQueueOpen}
          aria-label="Open queue"
        >
          <QueueMusic />
        </IconButton>
      </Box>
    </Box>
  );
};
