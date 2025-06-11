import React, {useCallback} from "react";

import {
  Box,
  Button,
  Collapse,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";

import {useCourseCreation} from "../context/CourseCreationContext";
import {CourseAdvancedOptions} from "./CourseAdvancedOptions";
import {CourseContentSelector} from "./CourseContentSelector";

interface CourseFullFormProps {
  emoji: string;
  onBack: () => void;
}

export function CourseFullForm({ emoji, onBack }: CourseFullFormProps) {
  const theme = useTheme();
  const { state, canProgress, createCourse } = useCourseCreation();
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false);

  const handleCreateCourse = useCallback(async () => {
    try {
      await createCourse();
    } catch (error) {
      console.error('Failed to create course:', error);
      // Error handling is done in the context
    }
  }, [createCourse]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Emoji Background */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '8rem',
          opacity: 0.03,
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {emoji}
      </Box>

      {/* Content */}
      <Stack
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 4,
          gap: 4,
        }}
      >
        {/* Content Selection */}
        <CourseContentSelector />

        {/* Create Course Button */}
        <Button
          variant="contained"
          size="large"
          disabled={!canProgress}
          onClick={handleCreateCourse}
          sx={{
            py: 2,
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
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
          Create course
        </Button>

        {/* Advanced Options Toggle */}
        <Button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          sx={{
            color: 'text.secondary',
            fontSize: '0.875rem',
            textTransform: 'none',
            py: 1,
            fontWeight: 500,
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'text.primary',
            },
          }}
        >
          {showAdvancedOptions ? 'Hide advanced options' : 'Show advanced options'}
        </Button>

        {/* Advanced Options (Collapsible) */}
        <Collapse in={showAdvancedOptions}>
          <Divider sx={{ mb: 3 }} />
          <Box 
            sx={{ 
              p: 3, 
              backgroundColor: theme.palette.background.default, 
              borderRadius: '8px',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CourseAdvancedOptions />
          </Box>
        </Collapse>
      </Stack>
    </Box>
  );
} 