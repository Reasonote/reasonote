import React, {useState} from "react";

import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";

import {CourseAdvancedOptions} from "./components/CourseAdvancedOptions";
import {CourseBasicInfo} from "./components/CourseBasicInfo";
import {CourseContentSelector} from "./components/CourseContentSelector";
import {CourseProcessingOverlay} from "./components/CourseProcessingOverlay";
import {
  CourseCreationProvider,
  useCourseCreation,
} from "./context/CourseCreationContext";

function CourseCreationCardContent() {
  const theme = useTheme();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const { state, canProgress, createCourse } = useCourseCreation();

  // Show processing overlay if currently processing
  if (state.isProcessing) {
    return (
      <CourseProcessingOverlay 
        processingState={state.processingState}
        courseName={state.courseName}
      />
    );
  }

  const handleCreateCourse = async () => {
    try {
      await createCourse();
    } catch (error) {
      console.error('Failed to create course:', error);
      // Error handling is done in the context
    }
  };

  return (
    <Card 
      sx={{
        maxWidth: '48rem',
        width: '100%',
        minHeight: 'min-content',
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      <Stack spacing={0} sx={{ width: '100%' }}>
        {/* Part 1: Main Course Creation (Always Visible) */}
        <Stack 
          spacing={3} 
          sx={{
            p: 4,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {/* Header */}
          <Stack gap={1}>
            <Txt variant="h5" color="text.primary" sx={{ fontWeight: 600 }}>
              Create Your Course
            </Txt>
            <Txt variant="body2" color="text.secondary">
              Upload documents, import Anki decks, or build content manually to create a personalized learning experience.
            </Txt>
          </Stack>

          {/* Course Basic Info (Name Input) */}
          <CourseBasicInfo />

          {/* Content Selection */}
          <CourseContentSelector />

          {/* Main Action Button */}
          <Button
            variant="contained"
            size="large"
            disabled={!canProgress}
            sx={{
              py: 2,
              borderRadius: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            }}
            onClick={handleCreateCourse}
          >
            Create Course
          </Button>

          {/* Advanced Options Toggle */}
          <Button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            sx={{
              color: 'text.secondary',
              fontSize: '0.9rem',
              textTransform: 'none',
              py: 1,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            startIcon={showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          >
            {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>
        </Stack>

        {/* Part 2: Advanced Options (Collapsible) */}
        <Collapse in={showAdvancedOptions}>
          <Divider />
          <Box sx={{ p: 3, backgroundColor: 'background.default' }}>
            <CourseAdvancedOptions />
          </Box>
        </Collapse>
      </Stack>
    </Card>
  );
}

export function CourseCreationCard() {
  return (
    <CourseCreationProvider>
      <Stack alignItems="center" sx={{ width: '100%', p: 2 }}>
        <CourseCreationCardContent />
      </Stack>
    </CourseCreationProvider>
  );
} 