'use client';

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

import React, {
  useEffect,
  useState,
} from "react";

import {motion} from "framer-motion";
import {CheckCircleIcon} from "lucide-react";
import posthog from "posthog-js";
import {Navigation} from "swiper/modules";
// Import Swiper and required modules
import {
  Swiper,
  SwiperSlide,
} from "swiper/react";
import {z} from "zod";

import {
  LoadingSubtopicSection,
} from "@/app/app/course-teaser/subtopic/LoadingSubtopicSection";
import {
  Subtopic,
  SubtopicSection,
} from "@/app/app/course-teaser/subtopic/SubtopicSection";
import {aib} from "@/clientOnly/ai/aib";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import FractalTreeLoading from "@/components/icons/FractalTreeLoading";
import {ShimmerLoadingTxt} from "@/components/typography/ShimmerLoadingTxt";
import {
  Box,
  Button,
  Card,
  Container,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {useStateWithRef} from "@reasonote/lib-utils-frontend";

// Timing constants (in milliseconds)
const ACTIVITY_REVEAL_INTERVAL = 1000; // Time between revealing each activity
const SLIDE_TRANSITION_DURATION = 500; // Duration of slide transitions
const SWIPER_RESISTANCE_RATIO = 0.85; // Resistance ratio for swiper gestures

const activityTypes = [
  'multiple-choice',
  'flashcard',
  'roleplay',
  'slide',
  'teach-the-ai',
  'short-answer',
  'term-matching',
  'choose-the-blank',
  'fill-in-the-blank'
] as const;

const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum(activityTypes),
  title: z.string(),
  description: z.string()
}).describe('An educational activity with specific type and content');

const SubtopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  emoji: z.string(),
  activities: z.array(ActivitySchema)
}).describe('A subtopic containing educational activities');

const CourseContentSchema = z.object({
  subtopics: z.array(SubtopicSchema)
}).describe('The complete course content structure');

// Carousel Component
interface CarouselProps {
  items: Subtopic[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onUserInteraction: () => void;
  topicName: string;
  onCreateAccountClick?: () => void;
}

const Carousel = ({
  items,
  currentIndex,
  onNext,
  onPrev,
  onUserInteraction,
  topicName,
  onCreateAccountClick,
}: CarouselProps) => {
  const theme = useTheme();
  const swiperRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // A subtopic is visible if it's the current one or if it's before the current one
  const isSubtopicVisible = (index: number) => {
    return index <= currentIndex;
  };

  const handleSlideChange = (swiper: any) => {
    // Only mark as user interaction if it was triggered by user touch/click
    if (swiper.touches?.diff || swiper.touches?.startX) {
      onUserInteraction(); // Notify parent of user interaction
    }
    const newIndex = swiper.activeIndex;
    if (newIndex !== currentIndex) {
      if (newIndex > currentIndex) {
        onNext();
      } else {
        onPrev();
      }
    }
  };

  React.useEffect(() => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(currentIndex, SLIDE_TRANSITION_DURATION);
    }
  }, [currentIndex]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        '.swiper': {
          width: '100%',
          height: '100%',
          px: { xs: 0, sm: 2 },
        },
        '.swiper-wrapper': {
          alignItems: 'center',
          height: '100%',
        },
        '.swiper-button-next, .swiper-button-prev': {
          color: theme.palette.primary.main,
          display: 'flex',
          width: { xs: '32px', sm: '44px' },
          height: { xs: '32px', sm: '44px' },
          '&::after': {
            fontSize: { xs: '16px', sm: '24px' },
          },
          '&.swiper-button-disabled': {
            opacity: 0,
            cursor: 'auto',
            pointerEvents: 'none',
          },
          // Position arrows closer to the edge on mobile
          '&.swiper-button-prev': {
            left: { xs: 4, sm: 10 }
          },
          '&.swiper-button-next': {
            right: { xs: 4, sm: 10 }
          },
          // Add a semi-transparent background for better visibility
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '50%',
          padding: { xs: '8px', sm: '12px' },
          transition: 'background 0.2s ease',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.5)',
          }
        },
      }}
    >
      <Swiper
        ref={swiperRef}
        modules={[Navigation]}
        spaceBetween={24}
        centeredSlides={true}
        slidesPerView={'auto'}
        navigation
        speed={SLIDE_TRANSITION_DURATION}
        threshold={20}
        resistance
        resistanceRatio={SWIPER_RESISTANCE_RATIO}
        onSlideChange={handleSlideChange}
        allowTouchMove={true}
        followFinger={true}
        shortSwipes={true}
        longSwipesRatio={0.5}
        touchRatio={1}
        watchOverflow={true}
        preventInteractionOnTransition={true}
        observer={true}
        observeParents={true}
      >
        {items.map((subtopic, index) => {
          const isVisible = isSubtopicVisible(index);
          const showPlaceholder = !isVisible && index === currentIndex + 1;
          const isInitialLoading = !items.some(item => item.activities.length > 0);
          const isTransitioning = items.length > 1 && items[0].id === 'initial';

          return (
            <SwiperSlide
              key={subtopic.id}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
              }}
            >
              <Box sx={{
                width: { xs: '98%' },
                minWidth: { xs: '98%' },
                height: '100%',
                mx: { xs: 0, sm: 'auto' },
                opacity: isVisible || showPlaceholder ? 1 : 0.4,
                transform: (isVisible || showPlaceholder) ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
              }}>
                {showPlaceholder ? (
                  <LoadingSubtopicSection topicName={topicName} />
                ) : isVisible ? (
                  <SubtopicSection
                    topicName={topicName}
                    subtopic={subtopic}
                    isActive={index === currentIndex}
                    isVisible={true}
                    onCreateAccountClick={onCreateAccountClick}
                    isLoading={isInitialLoading || (isTransitioning && index === 0)}
                  />
                ) : null}
              </Box>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
};

interface CourseTeaserPageProps {
  initialTopic?: string;
  onCreateAccountClick?: () => void;
}

export function CourseTeaserPageInner({ initialTopic, onCreateAccountClick }: CourseTeaserPageProps) {
  const theme = useTheme();
  const rsnUserId = useRsnUserId();
  const [topic, setTopic] = useState(initialTopic || "");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleSubtopics, setVisibleSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading, isLoadingRef] = useStateWithRef(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hasStartedGenerating, setHasStartedGenerating] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);

      // Start the generation process
      handleGenerate();

      posthog.capture('course_teaser_shown', {
        rsn_user_id: rsnUserId,
        topic: initialTopic,
      }, {
        send_instantly: true,
      });
    }
  }, [initialTopic]);

  // Store the complete data as we receive it
  const [completeSubtopics, setCompleteSubtopics, completeSubtopicsRef] = useStateWithRef<Subtopic[]>([]);
  // Single counter for total revealed activities
  const [revealedActivitiesCount, setRevealedActivitiesCount] = useState(0);

  // Effect to update visible subtopics based on revealed activities count
  React.useEffect(() => {
    if (!completeSubtopics.length) {
      // Show the first subtopic in a loading state
      setVisibleSubtopics([{
        id: completeSubtopics.length ? completeSubtopics[0].id : 'initial',
        title: '',
        description: '',
        emoji: '',
        activities: []
      }]);
      return;
    }

    let remainingActivities = revealedActivitiesCount;
    const newVisibleSubtopics = completeSubtopics.map(subtopic => {
      // Show at least one activity for each subtopic if we have activities remaining
      if (remainingActivities > 0) {
        const visibleActivities = Math.min(subtopic.activities.length, Math.max(1, remainingActivities));
        remainingActivities = Math.max(0, remainingActivities - visibleActivities);

        return {
          ...subtopic,
          activities: subtopic.activities.slice(0, visibleActivities)
        };
      }
      return null;
    }).filter((s): s is Subtopic => s !== null);

    setVisibleSubtopics(newVisibleSubtopics);
  }, [revealedActivitiesCount, completeSubtopics]);

  // Auto-advance to new subtopics based on activity index progression
  React.useEffect(() => {
    if (userHasInteracted) {
      console.log('userHasInteracted, not advancing');
      return; // Don't auto-advance if user has interacted
    }

    // Calculate which subtopic we should be on based on revealed activities
    let activityCount = 0;
    let targetSubtopicIndex = 0;

    for (let i = 0; i < visibleSubtopics.length; i++) {
      activityCount += visibleSubtopics[i].activities.length;
      if (revealedActivitiesCount > activityCount) {
        targetSubtopicIndex = i + 1;
      }
    }

    console.log('targetSubtopicIndex', targetSubtopicIndex);
    console.log('currentIndex', currentIndex);
    console.log('visibleSubtopics', visibleSubtopics);
    console.log('revealedActivitiesCount', revealedActivitiesCount);
    setCurrentIndex(targetSubtopicIndex);

  }, [revealedActivitiesCount, visibleSubtopics, currentIndex, userHasInteracted]);

  const handleGenerate = async () => {
    if (!topic) return;
    if (isLoadingRef.current) return;

    setIsLoading(true);
    setVisibleSubtopics([]);
    setCompleteSubtopics([]);
    setRevealedActivitiesCount(0);
    setCurrentIndex(0);
    setHasStartedGenerating(true);
    setUserHasInteracted(false); // Reset user interaction state on new generation

    // Recursive function to reveal activities
    const revealNextActivity = () => {
      setRevealedActivitiesCount(count => {
        const totalActivities = completeSubtopicsRef.current?.reduce((sum, subtopic) => sum + subtopic.activities.length, 0) ?? 0;
        console.log('Total activities:', totalActivities, 'Current count:', count);

        // If we've revealed all activities and we're not loading, we're done
        if (count >= totalActivities && !isLoadingRef.current) {
          console.log('Finished revealing activities');
          setIsLoading(false);
          return count;
        }

        // Schedule next reveal
        setTimeout(revealNextActivity, ACTIVITY_REVEAL_INTERVAL);

        // Only reveal one activity at a time
        if (count < totalActivities) {
          return count + 1;
        }

        return count;
      });
    };

    // Start the reveal process
    revealNextActivity();

    try {
      await aib.streamGenObject({
        schema: CourseContentSchema,
        system: `You are an expert educational content creator who designs engaging learning experiences.
                You create well-structured, progressive learning paths that guide students from fundamentals to advanced concepts.`,
        messages: [
          {
            role: 'user',
            content: `
            Create a structured learning path for "${topic}" with at least 5 subtopics, in increasing difficulty.
            For each subtopic, create 5 engaging activities that help learners master the content.
            Ensure activities are varied and appropriate for the difficulty level.
            Use clear, concise titles and descriptions that explain what the learner will do.
            `
          }
        ],
        model: 'openai:gpt-4o-mini',
        mode: 'json',
        providerArgs: {
          structuredOutputs: true,
        },
        onPartialObject: (data) => {
          const subtopics = data.subtopics?.filter((s): s is Subtopic =>
            !!s && typeof s.id === 'string' &&
            typeof s.title === 'string' &&
            typeof s.description === 'string' &&
            typeof s.emoji === 'string' &&
            Array.isArray(s.activities)
          );

          if (subtopics && subtopics.length > 0) {
            setCompleteSubtopics(subtopics);
          }
        },
        onFinish: (res) => {
          if (res.object?.subtopics) {
            console.log('res.object.subtopics', res.object.subtopics);
            setCompleteSubtopics(res.object.subtopics);
          }
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Error generating content:', error);
      setIsLoading(false);
    }
  };

  const handleCreateAccountClick = () => {
    posthog.capture('course_teaser_create_account_clicked', {
      rsn_user_id: rsnUserId,
      topic: topic,
    }, {
      send_instantly: true,
    });
    onCreateAccountClick?.();
  }

  const totalActivities = completeSubtopics.reduce((sum, subtopic) => sum + subtopic.activities.length, 0);

  const courseIsReady = revealedActivitiesCount >= totalActivities && !isLoading && hasStartedGenerating;

  return (
    <Container
      maxWidth="md"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Stack 
        spacing={{ xs: 2, sm: 4 }}
        sx={{
          flex: 1,
          minHeight: 0, // Important for flex child
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {
          hasStartedGenerating ? (
            null
          )
            :
            (
              <>
                {/* Topic Input */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleGenerate}
                    disabled={!topic || isLoading}
                  >
                    Generate
                  </Button>
                </Stack>
              </>
            )
        }

        {/* Status message */}
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="center" 
          alignContent={'center'} 
          gap={.5}
          flexShrink={0} // Prevent shrinking
        >
          {!courseIsReady ? (
            <>
              <FractalTreeLoading style={{
                width: '40px',
                height: '40px',
                paddingBottom: '5px',
                transition: 'opacity 0.5s ease-in-out',
              }} color={theme.palette.primary.main} />
              <ShimmerLoadingTxt
                variant="h5"
                sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                Building Your Course...
              </ShimmerLoadingTxt>
            </>
          ) : (
            <>
              <CheckCircleIcon style={{ color: theme.palette.success.main }} />
              <Stack alignItems="center">
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Your Course is Ready
                </Typography>
              </Stack>
            </>
          )}
        </Stack>

        {/* CTA Button */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}
          >
            <Card
              onClick={handleCreateAccountClick}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                textAlign: 'center',
                cursor: 'pointer',
                maxWidth: 'fit-content',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s ease-in-out'
                },
                border: `3px solid ${theme.palette.divider}`,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 2,
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Typography
                  variant="body1"
                  style={{
                    textTransform: 'none',
                    textAlign: 'center',
                  }}
                >
                  <b>Create Your Free Account</b>
                  <br />
                  <span style={{
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '4px',
                  }}>
                    To View Your Course
                  </span>
                </Typography>
              </Stack>
            </Card>
          </motion.div>
        )}

        {/* Carousel - will take remaining space */}
        <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <Carousel
            topicName={topic}
            items={visibleSubtopics}
            currentIndex={currentIndex}
            onNext={() => setCurrentIndex(prev => prev + 1)}
            onPrev={() => setCurrentIndex(prev => prev - 1)}
            onUserInteraction={() => setUserHasInteracted(true)}
            onCreateAccountClick={handleCreateAccountClick}
          />
        </Box>
      </Stack>
    </Container>
  );
} 