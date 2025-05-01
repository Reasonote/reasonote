import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ActivityCard,
} from "@/app/app/course-teaser/ActivityCard";
import {MoreActivitiesCard} from "@/app/app/course-teaser/MoreActivitiesCard";
import {ShimmerLoadingTxt} from "@/components/typography/ShimmerLoadingTxt";
import {TypingTxt} from "@/components/typography/TypingTxt";
import {
  Box,
  Card,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

export interface Subtopic {
  id: string;
  title: string;
  description: string;
  emoji: string;
  activities: Activity[];
}

export interface SubtopicSectionProps {
  topicName: string;
  subtopic: Subtopic;
  isActive: boolean;
  isVisible: boolean;
  onCreateAccountClick?: () => void;
  onActivityClick?: (activity: Activity) => void;
  isLoading?: boolean;
}

export function SubtopicSection({ 
  topicName,
  subtopic, 
  isActive,
  isVisible,
  onCreateAccountClick,
  onActivityClick,
  isLoading,
}: SubtopicSectionProps) {
  const theme = useTheme();
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const activitiesContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll state when switching away
  useEffect(() => {
    if (!isActive) {
      setUserHasScrolled(false);
    }
  }, [isActive]);

  // Auto-scroll effect
  useEffect(() => {
    if (!userHasScrolled && activitiesContainerRef.current && subtopic.activities.length > 0) {
      activitiesContainerRef.current.scrollTo({
        top: activitiesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [userHasScrolled, subtopic.activities.length]);

  // Handle user interaction
  useEffect(() => {
    const container = activitiesContainerRef.current;
    if (!container) return;

    const handleUserInteraction = () => setUserHasScrolled(true);
    
    container.addEventListener('wheel', handleUserInteraction);
    container.addEventListener('touchstart', handleUserInteraction);

    return () => {
      container.removeEventListener('wheel', handleUserInteraction);
      container.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Handle activity click
  const handleActivityClick = (activity: Activity) => {
    if (onActivityClick) {
      onActivityClick(activity);
    } else if (onCreateAccountClick) {
      // Fallback to onCreateAccountClick if onActivityClick is not provided
      onCreateAccountClick();
    }
  };

  return (
    <Card
      elevation={isActive ? 2 : 1}
      sx={{ 
        opacity: isActive ? 1 : 0.7,
        transition: 'all 0.3s ease-in-out',
        height: 'calc(100% - 20px)',
        width: '100%',
        display: 'flex',
        backgroundImage: {xs: 'none', sm: 'linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.07))'},
        bgcolor: { xs: 'transparent', sm: 'background.paper' },
        boxShadow: { xs: 'none', sm: theme.shadows[isActive ? 2 : 1] },
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderRadius: { xs: 0, sm: 1 },
        position: 'relative',
      }}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          <Stack 
            spacing={2}
            sx={{ 
              height: '100%',
              width: '100%',
              flex: 1,
              p: { xs: 0, sm: 2, md: 3 },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack spacing={1} flexShrink={0} sx={{ px: { xs: 2, sm: 0 } }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  mb: -0.5,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {topicName} <span style={{ fontSize: '0.8em' }}>›</span>
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    lineHeight: 1
                  }}
                >
                  ✨
                </Typography>
                <ShimmerLoadingTxt
                  variant="h4"
                  sx={{ 
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                    lineHeight: 1.2,
                    width: '60%'
                  }}
                >
                  Getting Started
                </ShimmerLoadingTxt>
              </Stack>
              <ShimmerLoadingTxt
                variant="body1"
                sx={{
                  fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '1rem' },
                  lineHeight: 1.4,
                  width: '80%'
                }}
              >
                Building your personalized learning path...
              </ShimmerLoadingTxt>
            </Stack>
            
            <Box sx={{ 
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <Stack 
                spacing={{ xs: 1.5, sm: 2 }}
                sx={{ 
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  px: { xs: 2, sm: 2 },
                  mx: { xs: 0, sm: -2 },
                  pb: { xs: 2, sm: 2 },
                }}
              >
                {/* Skeleton activities */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card
                    key={index}
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="text" width="40%" height={24} />
                      </Stack>
                      <Skeleton variant="text" width="70%" height={20} />
                    </Stack>
                  </Card>
                ))}
              </Stack>
              
              <Box sx={{ 
                px: { xs: 2, sm: 2 },
                pb: { xs: 2, sm: 2 },
                mt: 2,
              }}>
                <MoreActivitiesCard onClick={onCreateAccountClick} />
              </Box>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Main Content */}
      <Stack 
        spacing={2}
        sx={{ 
          height: '100%',
          width: '100%',
          flex: 1,
          p: { xs: 0, sm: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack spacing={1} flexShrink={0} sx={{ px: { xs: 2, sm: 0 } }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              mb: -0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {topicName} <span style={{ fontSize: '0.8em' }}>›</span>
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography 
              variant="h4" 
              sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1
              }}
            >
              {subtopic.emoji}
            </Typography>
            {subtopic.id === 'blank' ? (
              <ShimmerLoadingTxt
                variant="h4"
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                  lineHeight: 1.2,
                  width: '60%'
                }}
              >
                {subtopic.title}
              </ShimmerLoadingTxt>
            ) : (
              <TypingTxt 
                variant="h4" 
                animationDuration={200}
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                  lineHeight: 1.2
                }}
              >
                {subtopic.title}
              </TypingTxt>
            )}
          </Stack>
          {subtopic.id === 'blank' ? (
            <ShimmerLoadingTxt
              variant="body1"
              sx={{
                fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '1rem' },
                lineHeight: 1.4,
                width: '80%'
              }}
            >
              {subtopic.description}
            </ShimmerLoadingTxt>
          ) : (
            <Typography 
              variant="body1"
              sx={{
                fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '1rem' },
                lineHeight: 1.4
              }}
            >
              {subtopic.description}
            </Typography>
          )}
        </Stack>
        
        <Box sx={{ 
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <Stack 
            ref={activitiesContainerRef}
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ 
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              px: { xs: 2, sm: 2 },
              mx: { xs: 0, sm: -2 },
              pb: { xs: 2, sm: 2 },
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {subtopic.activities.length > 0 ? (
              subtopic.activities.map((activity) => (
                <ActivityCard 
                  key={activity.id} 
                  activity={activity} 
                  onClick={() => handleActivityClick(activity)}
                />
              ))
            ) : (
              // Skeleton activities
              Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width="40%" height={24} />
                    </Stack>
                    <Skeleton variant="text" width="70%" height={20} />
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
          
          <Box sx={{ 
            px: { xs: 2, sm: 2 },
            pb: { xs: 2, sm: 2 },
            mt: 2,
          }}>
            <MoreActivitiesCard onClick={onCreateAccountClick} />
          </Box>
        </Box>
      </Stack>
    </Card>
  );
} 