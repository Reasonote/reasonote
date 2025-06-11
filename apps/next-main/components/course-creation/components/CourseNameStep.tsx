import React, {useState} from "react";

import {X} from "lucide-react";

import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";

import {useCourseCreation} from "../context/CourseCreationContext";

interface CourseNameStepProps {
  onNameConfirmed: (courseName: string) => void;
  showEmoji: boolean;
  emoji: string;
  onClose: () => void;
}

export function CourseNameStep({ 
  onNameConfirmed, 
  showEmoji, 
  emoji, 
  onClose 
}: CourseNameStepProps) {
  const theme = useTheme();
  const { setCourseName } = useCourseCreation();
  const [localCourseName, setLocalCourseName] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalCourseName(value);
    setCourseName(value);
  };

  const handleConfirm = () => {
    const finalName = localCourseName.trim() || 'My Course';
    setCourseName(finalName);
    setHasConfirmed(true);
    onNameConfirmed(finalName);
  };

  const handleSkip = () => {
    const defaultName = 'My Course';
    setLocalCourseName(defaultName);
    setCourseName(defaultName);
    setHasConfirmed(true);
    onNameConfirmed(defaultName);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && localCourseName.trim()) {
      handleConfirm();
    }
  };

  const isValidName = localCourseName.trim().length > 0 && localCourseName.trim().length <= 100;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: showEmoji ? '8rem' : '20rem',
        width: '100%',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header with close button */}
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ 
          p: 3,
          pb: showEmoji ? 2 : 3,
        }}
      >
        <Box /> {/* Spacer */}
        <IconButton
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <X size={20} />
        </IconButton>
      </Stack>

      {/* Emoji Background (shows after confirmation) */}
      {showEmoji && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '6rem',
            opacity: 0.08,
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'opacity 0.4s ease-in-out',
          }}
        >
          {emoji}
        </Box>
      )}

      {/* Content */}
      <Stack
        sx={{
          position: 'relative',
          zIndex: 1,
          px: 4,
          pb: 4,
          pt: showEmoji ? 1 : 2,
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: showEmoji ? '6rem' : '16rem',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        gap={showEmoji ? 1.5 : 3}
      >
        {/* Header */}
        <Stack gap={1} alignItems="center">
          <Txt 
            variant={showEmoji ? "h6" : "h4"} 
            color="text.primary" 
            sx={{ 
              fontWeight: 600,
              transition: 'all 0.4s ease-in-out',
              letterSpacing: '-0.02em',
            }}
          >
            {hasConfirmed ? localCourseName || 'My Course' : 'Create course'}
          </Txt>
          
          {!hasConfirmed && (
            <Txt 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                maxWidth: '28rem',
                lineHeight: 1.6,
                transition: 'opacity 0.3s ease-in-out',
              }}
            >
              Give your course a name that inspires you to learn, or skip and we'll generate one based on your content.
            </Txt>
          )}
        </Stack>

        {/* Name Input (hides after confirmation) */}
        {!hasConfirmed && (
          <Stack gap={3} sx={{ width: '100%', maxWidth: '40rem' }}>
            <TextField
              label="Course name"
              placeholder="e.g., Advanced React Concepts, Spanish Vocabulary, Machine Learning Basics"
              value={localCourseName}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              fullWidth
              variant="outlined"
              autoFocus
              helperText={
                localCourseName.length > 100 
                  ? `Name is too long (${localCourseName.length}/100 characters)` 
                  : undefined
              }
              error={localCourseName.length > 100}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  borderRadius: '8px',
                  backgroundColor: theme.palette.background.paper,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  color: theme.palette.text.secondary,
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '0.875rem',
                  marginTop: '8px',
                },
              }}
            />

            <Stack direction="row" gap={2} justifyContent="center" alignItems="center">
              <Button 
                onClick={handleSkip} 
                variant="text"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                  padding: '8px 16px',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'text.primary',
                  }
                }}
              >
                Skip for now
              </Button>

              <Button
                onClick={handleConfirm}
                variant="contained"
                disabled={!isValidName}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 4,
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  minWidth: '120px',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  },
                  '&:disabled': {
                    backgroundColor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                Continue
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  );
} 