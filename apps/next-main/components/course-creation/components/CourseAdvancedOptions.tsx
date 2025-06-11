import React from "react";

import {
  GraduationCap,
  Mountain,
  Sprout,
  TreePine,
} from "lucide-react";

import {Txt} from "@/components/typography/Txt";
import {
  Button,
  Stack,
} from "@mui/material";

// Placeholder component for now - will be expanded in future interactions
export function CourseAdvancedOptions() {
  return (
    <Stack gap={3}>
      <Txt variant="h6" color="text.primary">
        Advanced Options
      </Txt>
      
      {/* Level Selection */}
      <Stack gap={2}>
        <Txt variant="subtitle1">
          <Stack direction="row" spacing={1} alignItems="center">
            <GraduationCap size={16} />
            <span>Learning Level</span>
          </Stack>
        </Txt>
        <Stack direction="row" spacing={2} justifyContent="center">
          {([
            { level: 'beginner', icon: <Sprout size={16} /> },
            { level: 'intermediate', icon: <TreePine size={16} /> },
            { level: 'advanced', icon: <Mountain size={16} /> },
          ] as const).map(({ level, icon }) => (
            <Button
              key={level}
              variant="outlined"
              startIcon={icon}
              sx={{
                textTransform: 'capitalize',
                minWidth: 120,
                borderRadius: 2,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                },
              }}
            >
              {level}
            </Button>
          ))}
        </Stack>
      </Stack>

      {/* Placeholder for future features */}
      <Stack 
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Txt variant="body1" color="text.secondary">
          🎯 Additional options coming soon
        </Txt>
        <Txt variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Learning goals, activity preferences, and course settings
        </Txt>
      </Stack>
    </Stack>
  );
} 