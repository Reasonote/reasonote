import React from "react";

import {FileText} from "lucide-react";

import {Txt} from "@/components/typography/Txt";
import {
  Card,
  Chip,
  CircularProgress,
  Stack,
  useTheme,
} from "@mui/material";

import {ProcessingState} from "../types/courseCreation.types";

interface CourseProcessingOverlayProps {
  processingState?: ProcessingState;
  courseName?: string;
}

export function CourseProcessingOverlay({ 
  processingState, 
  courseName 
}: CourseProcessingOverlayProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        maxWidth: '48rem',
        width: '100%',
        padding: 4,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        border: `2px solid ${theme.palette.primary.main}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Stack spacing={4} alignItems="center">
        <CircularProgress size={60} color="primary" />
        
        <Stack spacing={2} alignItems="center">
          <Txt variant="h5" color="primary">
            Creating your course...
          </Txt>
          
          {courseName && (
            <Txt
              variant="body1"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                fontStyle: 'italic',
                maxWidth: '100%',
                wordBreak: 'break-word',
                backgroundColor: 'background.default',
                padding: '12px 16px',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              "{courseName}"
            </Txt>
          )}
          
          {processingState?.type === "document" && processingState.fileNames && (
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ gap: 1 }}>
              {processingState.fileNames.map((fileName, index) => (
                <Chip
                  key={index}
                  icon={<FileText size={16} />}
                  label={fileName}
                  variant="outlined"
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    borderColor: theme.palette.divider,
                    '& .MuiChip-label': {
                      maxWidth: '160px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiChip-icon': {
                      color: theme.palette.text.secondary,
                      marginLeft: '8px',
                    }
                  }}
                />
              ))}
            </Stack>
          )}
          
          <Txt variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            This should only take a few seconds...
          </Txt>
        </Stack>
      </Stack>
    </Card>
  );
} 