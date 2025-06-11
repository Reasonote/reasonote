import React, {
  useCallback,
  useState,
} from "react";

import {
  Collapse,
  Dialog,
  DialogContent,
  Stack,
  useTheme,
} from "@mui/material";

import {CourseFullForm} from "./components/CourseFullForm";
import {CourseNameStep} from "./components/CourseNameStep";
import {CourseProcessingOverlay} from "./components/CourseProcessingOverlay";
import {
  CourseCreationProvider,
  useCourseCreation,
} from "./context/CourseCreationContext";

interface CreateCourseModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateCourseModalContent({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { state } = useCourseCreation();
  const [showFullForm, setShowFullForm] = useState(false);
  const [courseEmoji, setCourseEmoji] = useState<string>('📚');

  const handleNameConfirmed = useCallback((courseName: string) => {
    // Generate emoji based on course name
    const emoji = generateCourseEmoji(courseName);
    setCourseEmoji(emoji);
    setShowFullForm(true);
  }, []);

  // Show processing overlay if currently processing
  if (state.isProcessing) {
    return (
      <CourseProcessingOverlay 
        processingState={state.processingState}
        courseName={state.courseName}
      />
    );
  }

  return (
    <Stack 
      sx={{
        width: showFullForm ? { xs: '95vw', sm: '95vw', md: '800px', lg: '800px' } : { xs: '90vw', sm: '500px' },
        minHeight: showFullForm ? '32rem' : '16rem',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        mx: 'auto', // Center the content
      }}
    >
      {/* Step 1: Course Name Input (Always Visible) */}
      <CourseNameStep 
        onNameConfirmed={handleNameConfirmed}
        showEmoji={showFullForm}
        emoji={courseEmoji}
        onClose={onClose}
      />

      {/* Step 2: Full Form (Expands after name confirmation) */}
      <Collapse 
        in={showFullForm}
        timeout={600}
        easing="cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <CourseFullForm 
          emoji={courseEmoji}
          onBack={() => setShowFullForm(false)}
        />
      </Collapse>
    </Stack>
  );
}

// Generate emoji based on course name content
function generateCourseEmoji(courseName: string): string {
  const name = courseName.toLowerCase();
  
  // Programming/Tech
  if (name.includes('react') || name.includes('javascript') || name.includes('programming') || name.includes('code')) {
    return '💻';
  }
  if (name.includes('python') || name.includes('data') || name.includes('ai') || name.includes('machine learning')) {
    return '🐍';
  }
  
  // Languages
  if (name.includes('spanish') || name.includes('french') || name.includes('german') || name.includes('language')) {
    return '🗣️';
  }
  
  // Science
  if (name.includes('physics') || name.includes('chemistry') || name.includes('biology') || name.includes('science')) {
    return '🔬';
  }
  if (name.includes('math') || name.includes('calculus') || name.includes('algebra')) {
    return '📊';
  }
  
  // Business/Finance
  if (name.includes('business') || name.includes('finance') || name.includes('economics') || name.includes('marketing')) {
    return '💼';
  }
  
  // Art/Design
  if (name.includes('design') || name.includes('art') || name.includes('creative') || name.includes('drawing')) {
    return '🎨';
  }
  
  // Music
  if (name.includes('music') || name.includes('piano') || name.includes('guitar') || name.includes('instrument')) {
    return '🎵';
  }
  
  // Health/Fitness
  if (name.includes('health') || name.includes('fitness') || name.includes('exercise') || name.includes('nutrition')) {
    return '💪';
  }
  
  // History/Geography
  if (name.includes('history') || name.includes('geography') || name.includes('culture')) {
    return '📜';
  }
  
  // Default book emoji
  return '📚';
}

export function CreateCourseModal({ open, onClose }: CreateCourseModalProps) {
  const theme = useTheme();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minWidth: '400px',
          maxWidth: '100vw',
          width: 'auto',
          maxHeight: '90vh',
          m: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }
      }}
    >
      <DialogContent 
        sx={{ 
          p: 0, 
          overflow: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CourseCreationProvider>
          <CreateCourseModalContent onClose={onClose} />
        </CourseCreationProvider>
      </DialogContent>
    </Dialog>
  );
} 