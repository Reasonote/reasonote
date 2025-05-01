import React from "react";

import {motion} from "framer-motion";

import {
  Card,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

interface LoadingSubtopicSectionProps {
  topicName: string;
}

export function LoadingSubtopicSection({ topicName }: LoadingSubtopicSectionProps) {
  const theme = useTheme();
  
  return (
    <Card
      sx={{ 
        opacity: 0.7,
        position: 'relative',
        height: '100%',
        bgcolor: 'background.paper',
        elevation: 1,
      }}
    >
      <Stack 
        spacing={3} 
        sx={{ 
          height: '100%',
          p: { xs: 2, sm: 3 },
        }}
      >
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Stack spacing={1}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                mb: -1,
                opacity: 0.7 
              }}
            >
              {topicName} <span style={{ fontSize: '0.8em' }}>›</span>
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Skeleton variant="text" width={32} height={40} sx={{ minWidth: 32 }} />
              <Skeleton variant="text" width="40%" height={40} />
            </Stack>
            <Skeleton variant="text" width="70%" height={24} />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                opacity: 0.7,
                fontStyle: 'italic',
                mt: 1
              }}
            >
              Next topic loading...
            </Typography>
          </Stack>
        </motion.div>
      </Stack>
    </Card>
  );
} 