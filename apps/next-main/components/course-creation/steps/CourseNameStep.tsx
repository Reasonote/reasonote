import React, {useState} from "react";

import {Txt} from "@/components/typography/Txt";
import {
  Button,
  Stack,
  TextField,
} from "@mui/material";

import {CourseNameStepProps} from "../types/courseCreation.types";

export function CourseNameStep({
  courseName = '',
  onCourseNameChange,
  onNext,
  onBack,
  onSkip,
  canProgress,
}: CourseNameStepProps) {
  const [localCourseName, setLocalCourseName] = useState(courseName);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalCourseName(value);
    onCourseNameChange(value);
  };

  const handleSkip = () => {
    setLocalCourseName('');
    onCourseNameChange('');
    onSkip();
  };

  const isValidName = localCourseName.trim().length > 0 && localCourseName.trim().length <= 100;

  return (
    <Stack gap={4} width="100%">
      {/* Header */}
      <Stack gap={1}>
        <Txt variant="h5" color="text.primary">
          Name Your Course
        </Txt>
        <Txt variant="body2" color="text.secondary">
          Give your course a memorable name, or skip to auto-generate one based on your content.
        </Txt>
      </Stack>

      {/* Course Name Input */}
      <TextField
        label="Course Name"
        placeholder="e.g., Advanced React Concepts, Spanish Vocabulary, Machine Learning Basics"
        value={localCourseName}
        onChange={handleInputChange}
        fullWidth
        variant="outlined"
        helperText={
          localCourseName.length > 100 
            ? `Name is too long (${localCourseName.length}/100 characters)` 
            : "Leave blank to auto-generate based on your content"
        }
        error={localCourseName.length > 100}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '1.1rem',
            padding: '4px',
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.875rem',
          }
        }}
      />

      {/* Navigation */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button 
          onClick={handleSkip} 
          variant="text" 
          sx={{ 
            textTransform: 'none',
            fontSize: '0.9rem',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            }
          }}
        >
          Skip - Generate name automatically
        </Button>
        
        <Button 
          onClick={onNext} 
          variant="contained"
          disabled={localCourseName.length > 100}
          sx={{
            textTransform: 'none',
            minWidth: '120px',
          }}
        >
          Next
        </Button>
      </Stack>

      {/* Additional Info */}
      {localCourseName.trim().length > 0 && (
        <Stack 
          sx={{
            backgroundColor: 'primary.light',
            padding: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.main',
            opacity: 0.8,
          }}
        >
          <Txt variant="body2" color="primary.dark">
            💡 <strong>Course Preview:</strong> "{localCourseName.trim()}"
          </Txt>
        </Stack>
      )}
    </Stack>
  );
} 