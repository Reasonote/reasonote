import {useCallback} from "react";

import {motion} from "framer-motion";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  useTheme,
} from "@mui/material";
import {alpha} from "@mui/material/styles";

import {SubtopicProgressBadge} from "./SubtopicProgressBadge";

export type LevelType = 'BEGINNER_TO_INTERMEDIATE' | 'INTERMEDIATE_TO_ADVANCED' | 'MASTERED';

interface SubtopicAdvancementDialogProps {
  open: boolean;
  onClose: () => void;
  levelType: LevelType;
  topicName: string;
  onSuggestionAction?: () => void;
}

// Updated color schemes with colors that better match the badges
const LEVEL_CONFIGS = {
  BEGINNER_TO_INTERMEDIATE: {
    title: 'Bronze Badge Unlocked!',
    gradientStart: '#5d4a30', // Warmer brown that better matches bronze badge
    gradientEnd: '#7d6540', // Lighter warm brown
    message: 'Your understanding of {topicName} is growing stronger.',
    suggestion: 'Ready to challenge yourself with more complex activities?',
    buttonText: 'Continue Learning',
    suggestionText: 'Try Interleaving Practice',
    emoji: '🔄', // Interleaving symbol
    badgeScore: 40, // Score for BEGINNER level (just achieved)
  },
  INTERMEDIATE_TO_ADVANCED: {
    title: 'Silver Badge Unlocked!',
    gradientStart: '#4a4a4a', // Lighter gray that complements silver
    gradientEnd: '#6a6a6a', // Even lighter gray
    message: 'Your knowledge of {topicName} is becoming expert-level.',
    suggestion: 'Consider exploring related topics to broaden your understanding.',
    buttonText: 'Continue Mastering',
    suggestionText: 'Explore Related Topics',
    emoji: '🔍', // Exploration symbol
    badgeScore: 80, // Score for INTERMEDIATE level (just achieved)
  },
  MASTERED: {
    title: 'Topic Mastered!',
    gradientStart: '#6b5a20', // Lighter gold-brown
    gradientEnd: '#8b7a40', // Even lighter gold-brown
    message: 'Congratulations! You have mastered {topicName}.',
    suggestion: 'If you need a break, might we suggest going for a walk while you listen to a custom podcast about this topic to consolidate your learning?',
    buttonText: 'Continue Learning',
    suggestionText: 'Try Podcast Mode',
    emoji: '🎧', // Podcast symbol
    badgeScore: 100, // Score for ADVANCED level (mastered)
  }
};

export function SubtopicAdvancementDialog({
  open,
  onClose,
  levelType,
  topicName,
  onSuggestionAction
}: SubtopicAdvancementDialogProps) {
  const isSmallDevice = useIsSmallDevice();
  const theme = useTheme();
  const config = LEVEL_CONFIGS[levelType];

  const handleSuggestionClick = useCallback(() => {
    onSuggestionAction?.();
    onClose();
  }, [onSuggestionAction, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${config.gradientStart}, ${config.gradientEnd})`,
          color: '#fff',
          maxHeight: '60vh',
          boxShadow: theme.shadows[10],
          borderRadius: 2,
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          pb: 0,
          pt: isSmallDevice ? 2 : 3
        }}>
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <Box
              sx={{
                fontSize: isSmallDevice ? '3rem' : '4rem',
                mb: isSmallDevice ? 0.5 : 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <SubtopicProgressBadge
                score={config.badgeScore}
                size={isSmallDevice ? 60 : 80}
                id={`level-advancement-${levelType}`}
                showTooltip={false}
              />
            </Box>
          </motion.div>
          <Txt
            variant={isSmallDevice ? "h5" : "h4"}
            component="div"
            sx={{
              fontWeight: 'bold',
              color: 'inherit',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {config.title}
          </Txt>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={isSmallDevice ? 2 : 3} sx={{ mt: isSmallDevice ? 1 : 2 }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Box sx={{
                bgcolor: alpha('#fff', 0.15),
                p: isSmallDevice ? 2 : 3,
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <Stack spacing={2}>
                  <Txt
                    color="inherit"
                    sx={{
                      opacity: 0.95,
                      fontWeight: 500,
                      fontSize: isSmallDevice ? '1rem' : '1.1rem'
                    }}
                  >
                    {config.message.replace('{topicName}', topicName)}
                  </Txt>
                  <Txt
                    color="inherit"
                    sx={{
                      opacity: 0.9,
                      fontStyle: 'italic',
                      fontSize: isSmallDevice ? '0.9rem' : '1rem'
                    }}
                    startIcon={
                      <Box component="span" sx={{ fontStyle: 'normal' }}>
                        {config.emoji}
                      </Box>
                    }
                  >
                    {config.suggestion}
                  </Txt>
                </Stack>
              </Box>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Stack
                direction={isSmallDevice ? "column" : "row"}
                spacing={2}
                justifyContent="center"
                sx={{ mt: isSmallDevice ? 1 : 2 }}
              >
                <Button
                  fullWidth={isSmallDevice}
                  variant="contained"
                  onClick={onClose}
                  sx={{
                    bgcolor: alpha('#fff', 0.9),
                    color: config.gradientStart,
                    fontWeight: 'bold',
                    px: isSmallDevice ? 3 : 4,
                    py: isSmallDevice ? 1 : 1.5,
                    boxShadow: theme.shadows[2],
                    '&:hover': {
                      bgcolor: '#fff',
                      boxShadow: theme.shadows[4],
                    }
                  }}
                >
                  {config.buttonText}
                </Button>
                {onSuggestionAction && (
                  <Button
                    fullWidth={isSmallDevice}
                    variant="outlined"
                    onClick={handleSuggestionClick}
                    sx={{
                      borderColor: alpha('#fff', 0.7),
                      color: '#fff',
                      px: isSmallDevice ? 3 : 4,
                      py: isSmallDevice ? 1 : 1.5,
                      '&:hover': {
                        borderColor: '#fff',
                        bgcolor: alpha('#fff', 0.1),
                      }
                    }}
                    startIcon={<Box component="span">{config.emoji}</Box>}
                  >
                    {config.suggestionText}
                  </Button>
                )}
              </Stack>
            </motion.div>
          </Stack>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
} 