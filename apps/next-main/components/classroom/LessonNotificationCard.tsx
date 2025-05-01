import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Stack, Typography, CircularProgress } from '@mui/material';
import { ChevronRight, BookOpen } from 'lucide-react';

interface LessonNotificationCardProps {
  isLoading: boolean;
  onClick?: () => void;
  lessonCount?: number;
}

export const LessonNotificationCard: React.FC<LessonNotificationCardProps> = ({
  isLoading,
  onClick,
  lessonCount = 0
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          onClick={!isLoading ? onClick : undefined}
          sx={{
            p: 1,
            cursor: isLoading ? 'default' : 'pointer',
            bgcolor: isLoading ? 'grey.100' : 'primary.main',
            '&:hover': !isLoading ? {
              transform: 'scale(1.02)',
              transition: 'transform 0.2s ease-in-out'
            } : {},
            transition: 'all 0.2s ease-in-out',
            maxWidth: '300px',
            margin: '0 auto'
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <BookOpen size={20} color={isLoading ? 'gray' : 'white'} />
            <Stack flex={1}>
              <Typography variant="body2" color={isLoading ? 'text.secondary' : 'white'}>
                {isLoading ? 'Generating lessons' : `${lessonCount} New Lesson${lessonCount !== 1 ? 's' : ''}`}
              </Typography>
              <Typography variant="caption" color={isLoading ? 'text.secondary' : 'white'}>
                {isLoading ? 'Just a moment' : 'Click to view'}
              </Typography>
            </Stack>
            {isLoading ? (
              <CircularProgress size={16} />
            ) : (
              <ChevronRight size={20} color="white" />
            )}
          </Stack>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}; 