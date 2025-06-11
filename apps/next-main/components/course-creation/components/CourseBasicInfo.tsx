import React, {useState} from "react";

import {Txt} from "@/components/typography/Txt";
import {
  Button,
  Stack,
  TextField,
} from "@mui/material";

import {useCourseCreation} from "../context/CourseCreationContext";

export function CourseBasicInfo() {
  const { state, setCourseName } = useCourseCreation();
  const [localCourseName, setLocalCourseName] = useState(state.courseName || '');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalCourseName(value);
    setCourseName(value);
  };

  const handleSkip = () => {
    setLocalCourseName('');
    setCourseName('');
  };

  const isValidName = localCourseName.trim().length <= 100;

  return (
    <Stack gap={2}>
      <Txt variant="h6" color="text.primary">
        Course Name (Optional)
      </Txt>
      
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
            fontSize: '1rem',
            borderRadius: 2,
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.875rem',
          }
        }}
      />

      {localCourseName.trim().length > 0 && isValidName && (
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

      <Button 
        onClick={handleSkip} 
        variant="text" 
        size="small"
        sx={{ 
          alignSelf: 'flex-start',
          textTransform: 'none',
          fontSize: '0.875rem',
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'transparent',
            textDecoration: 'underline',
          }
        }}
      >
        Skip - Generate name automatically
      </Button>
    </Stack>
  );
} 