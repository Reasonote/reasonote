import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {motion} from "framer-motion";

import {ActivityTypeIcon} from "@/components/activity/ActivityTypeIndicator";
import {
  Card,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

export interface Activity {
  id: string;
  type: 'flashcard' | 'multiple-choice' | 'fill-in-the-blank' | 'teach-the-ai' | 'roleplay' | 'slide' | 'short-answer' | 'term-matching' | 'choose-the-blank';
  title: string;
  description: string;
}

// Keep track of which activities have been seen across renders
const seenActivities = new Set<string>();

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasBeenSeen, setHasBeenSeen] = React.useState(seenActivities.has(activity.id));
  const [isHighlighted, setIsHighlighted] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    if (hasBeenSeen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          seenActivities.add(activity.id);
          setHasBeenSeen(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.5, // Card must be 50% visible to be considered "seen"
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [activity.id, hasBeenSeen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      initial={hasBeenSeen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        ref={cardRef}
        onClick={onClick}
        sx={{
          p: 2,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '10px',
          position: 'relative',
          overflow: 'hidden',
          transform: isHighlighted ? 'translateY(-5px)' : 'translateY(0)',
          boxShadow: isHighlighted ? theme.shadows[4] : theme.shadows[1],
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isHighlighted ? theme.palette.primary.main : theme.palette.divider,
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.shadows[4],
            borderWidth: '2px',
            borderColor: theme.palette.primary.main,
            '&::before': {
              animation: 'shimmer 0.8s forwards',
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `linear-gradient(45deg, ${theme.palette.background.paper}00 0%, ${theme.palette.background.paper}33 50%, ${theme.palette.background.paper}00 100%)`,
            transform: 'translateX(-100%)',
            animation: isHighlighted ? 'shimmer 0.8s forwards' : 'none',
          },
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ActivityTypeIcon 
              activityType={activity.type} 
              iconProps={{ 
                sx: { 
                  fontSize: 20,
                  color: theme.palette.text.secondary
                }
              }} 
            />
            <Typography variant={
              isMobile ? 'body2' : 'h6'
            }>{activity.title}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {activity.description}
          </Typography>
        </Stack>
      </Card>
    </motion.div>
  );
} 