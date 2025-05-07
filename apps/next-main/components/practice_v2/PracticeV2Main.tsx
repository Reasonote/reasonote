import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {useRouter} from "next/navigation";

import {GenerateSubtopicsRoute} from "@/app/api/subtopics/generate/routeSchema";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSkillSimpleTree} from "@/clientOnly/hooks/useSkillSimpleTree";
import {saveSubTopicAsSkill} from "@/components/subtopics/utils";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {TxtField} from "@/components/textFields/TxtField";
import {Txt} from "@/components/typography/Txt";
import {Add} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
} from "@mui/material";

import {SkillChip} from "../chips/SkillChip/SkillChip";
import {SubtopicProgressBadge} from "./SubtopicProgressBadge";

// Types for our component
export interface SubTopic {
  id: string;
  name: string;
  description: string;
  emoji: string;
  activities: {
    id: string;
    type: string;
  }[];
}

interface PracticeV2MainProps {
  skillId: string;
  allowedActivityTypes?: string;
  disableSkillChip?: boolean;
  overrideCTA?: string;
}

// At the top with other constants
const REQUIRED_SUBTOPICS = 7;
const REFILL_AMOUNT = 3;
const REFRESH_INTERVAL = 1000;
const MAX_POLLS = 10;

export function PracticeV2Main({ skillId, allowedActivityTypes, disableSkillChip, overrideCTA }: PracticeV2MainProps) {
  const { supabase } = useSupabase();
  const userId = useRsnUserId();
  const [skill, setSkill] = useState<{ name: string; description: string | null }>();
  const [allSubTopics, setAllSubTopics] = useState<SubTopic[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefillingQueue, setIsRefillingQueue] = useState(false);
  const [isGeneratingCustomTopic, setIsGeneratingCustomTopic] = useState(false);
  const [handlingStart, setHandlingStart] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [visibleTopicCount, setVisibleTopicCount] = useState(0);
  const isSmallDevice = useIsSmallDevice();
  const router = useRouter();
  const [hasTriggeredGeneration, setHasTriggeredGeneration] = useState(false);
  const [hasPolled, setHasPolled] = useState(false);
  const [topicScores, setTopicScores] = useState<Record<string, number>>({});
  const {refetch: refetchSkillTree} = useSkillSimpleTree({
    topicOrId: skillId
  });


  const generateTopics = useCallback(async ({
    numTopics,
    customPrompt = '',
    existingTopics = null,
    onIndividualSuccess,
    onFirstSuccess,
    setLoading
  }: {
    numTopics: number;
    customPrompt?: string;
    existingTopics?: SubTopic[] | null;
    onIndividualSuccess: (newTopic: SubTopic) => void;
    onFirstSuccess?: (newTopicId: string) => void;
    setLoading: (loading: boolean) => void;
  }) => {
    setLoading(true);
    try {
      if (!skill) {
        throw new Error('Skill not found');
      }

      const newTopicIds: string[] = [];
      for await (const topic of GenerateSubtopicsRoute.callArrayStream({
        skillId: skillId,
        numTopics: numTopics,
        customPrompt: customPrompt,
        existingTopics: existingTopics?.map(t => ({
          name: t.name,
          description: t.description,
          emoji: t.emoji
        }))
      })) {
        const newTopic = await saveSubTopicAsSkill({
          name: topic.topic.name,
          description: topic.topic.description,
          emoji: topic.topic.emoji,
          expertQuestions: topic.topic.expertQuestions
        }, userId || '', skillId, supabase, setAllSubTopics);

        if (!allSubTopics.find(t => t.id === newTopic.id) && !newTopicIds.includes(newTopic.id)) {
          onIndividualSuccess({
            id: newTopic.id,
            name: newTopic._name,
            description: newTopic._description || '',
            emoji: newTopic.emoji || '',
            activities: []
          });
          if (newTopicIds.length === 0) {
            onFirstSuccess?.(newTopic.id);
          }
          newTopicIds.push(newTopic.id);
        }
      }

      await refetchSkillTree();

    } catch (error) {
      console.error('Error generating topics:', error);
    } finally {
      setLoading(false);
    }
  }, [skill, userId, skillId, supabase, allSubTopics]);

  const generateSubTopics = useCallback(async () => {
    await generateTopics({
      numTopics: REQUIRED_SUBTOPICS,
      onIndividualSuccess: (newTopic) => {
        setAllSubTopics(prev => [...prev, newTopic]);
      },
      onFirstSuccess: (newTopicId) => {
        setExpandedTopicId(newTopicId);
        setIsLoading(false);
      },
      setLoading: setIsLoading
    });
  }, [generateTopics]);

  const refillSubTopics = useCallback(async (numTopics: number, existingTopics: SubTopic[]) => {
    await generateTopics({
      numTopics,
      existingTopics,
      onIndividualSuccess: (newTopic) => {
        setAllSubTopics(prev => [...prev, newTopic]);
      },
      setLoading: setIsRefillingQueue
    });
  }, [generateTopics]);

  const generateCustomSubtopics = useCallback(async (customPrompt: string, existingTopics: SubTopic[]) => {
    await generateTopics({
      numTopics: 2,
      customPrompt,
      existingTopics,
      onIndividualSuccess: (newTopic) => {
        setAllSubTopics(prev => [newTopic, ...prev]);
      },
      onFirstSuccess: (newTopicId) => {
        setExpandedTopicId(newTopicId);
      },
      setLoading: setIsGeneratingCustomTopic
    });
  }, [generateTopics]);

  const syncSubTopics = useCallback(async () => {
    if (!userId || hasTriggeredGeneration) return;

    const { data, error } = await supabase
      .from('skill_link')
      .select(`
            upstream_skill:upstream_skill (
                id,
                _name,
                _description,
                emoji
            )
        `)
      .eq('downstream_skill', skillId)
      .eq('_type', 'subtopic');

    if (error) {
      console.error('Error syncing subtopics:', error);
      return;
    }

    // Get activities for topics
    // @ts-ignore
    const upstreamSkillIds = data.map(link => link.upstream_skill?.id).filter(Boolean);
    const skillPaths = upstreamSkillIds.map(id => [skillId, id]);
    const { data: activityData } = await supabase.rpc('get_activities_for_skill_paths', {
      p_skill_paths: skillPaths,
      p_generated_for_user: userId,
      p_activity_type: 'slide'
    });

    const topics = data.map(link => ({
      // @ts-ignore
      id: link.upstream_skill?.id || '',
      // @ts-ignore
      name: link.upstream_skill?._name || '',
      // @ts-ignore
      description: link.upstream_skill?._description || '',
      // @ts-ignore
      emoji: link.upstream_skill?.emoji || '',
      activities: activityData?.filter(activity =>
        Array.isArray(activity.generated_for_skill_paths) &&
        activity.generated_for_skill_paths.some(path =>
          // @ts-ignore
          path[1] === link.upstream_skill?.id
        )
      ).map(activity => ({
        id: activity.id,
        type: activity._type || ''
      })) || []
    }));

    // If we have topics, set them and expand the first one
    if (topics.length > 0) {
      setAllSubTopics(topics);
      if (!expandedTopicId && topics.length > 0) {
        setExpandedTopicId(topics[0].id);
      }
    } else {
      setHasTriggeredGeneration(true);
      generateSubTopics();
    }

    setIsLoading(false);
  }, [skillId, userId, supabase, expandedTopicId, hasTriggeredGeneration, generateSubTopics]);

  // Fetch skill details
  useEffect(() => {
    const fetchSkill = async () => {
      const { data, error } = await supabase
        .from('skill')
        .select('_name, _description')
        .eq('id', skillId)
        .single();

      if (data) {
        setSkill({ name: data._name, description: data._description });
      }
    };

    fetchSkill();
  }, [skillId, supabase]);

  const checkTopicsHaveSlides = useCallback(() => {
    return !allSubTopics.filter(topic => topic.id === expandedTopicId).some(topic => topic.activities.length === 0);
  }, [allSubTopics, expandedTopicId]);

  const handleStartPractice = useCallback(async () => {
    if (!expandedTopicId) return;

    setHandlingStart(true);
    const urlToPush = `/app/skills/${skillId}/practice_v2/practice?subtopicIds=${[expandedTopicId]}${allowedActivityTypes ? `&allowedActivityTypes=${allowedActivityTypes}` : ''}`;
    try {
      // Check if slides are ready
      if (checkTopicsHaveSlides()) {
        router.push(urlToPush);
      } else {
        // Wait for slides
        for (let i = 0; i < 10; i++) {
          if (checkTopicsHaveSlides()) {
            router.push(urlToPush);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        // Proceed anyway if slides aren't ready after timeout
        router.push(urlToPush);
      }
    } catch (error) {
      console.error("Error starting practice:", error);
    }
  }, [expandedTopicId, skillId, router, checkTopicsHaveSlides]);

  // Add handler for topic expansion
  const handleTopicClick = useCallback((topicId: string) => {
    setExpandedTopicId(topicId);
  }, []);

  // Add handler for showing more topics
  const handleShowMore = useCallback(() => {
    // First update the visible count
    const newCount = Math.min(visibleTopicCount + REFILL_AMOUNT, allSubTopics.length);
    setVisibleTopicCount(newCount);

    // Then check if we need to generate more
    if (newCount + 1 > allSubTopics.length - 1 && allSubTopics.length < 12) {
      refillSubTopics(REFILL_AMOUNT, allSubTopics);
    }
  }, [visibleTopicCount, allSubTopics]);

  useEffect(() => {
    if (!skill || !userId || hasPolled) return;

    console.log('Starting to poll for topics');
    let isMounted = true;
    let pollCount = 0;

    const pollForTopics = async () => {
      if (!isMounted) return;

      try {
        await syncSubTopics();
        pollCount++;

        if (pollCount < MAX_POLLS && !hasTriggeredGeneration && isMounted) {
          setTimeout(pollForTopics, REFRESH_INTERVAL);
        } else {
          console.log('Stopping polls:', {
            pollCount,
            hasTriggeredGeneration,
            isMounted
          });
          setHasPolled(true);
        }
      } catch (error) {
        console.error('Error polling for topics:', error);
        setHasPolled(true);
      }
    };

    // Start polling
    pollForTopics();

    return () => {
      isMounted = false;
      setHasPolled(true);
    };
  }, [skill, userId, syncSubTopics, hasTriggeredGeneration]);

  useEffect(() => {
    if (allSubTopics.length > 0 && visibleTopicCount < 3) {
      setVisibleTopicCount(Math.min(allSubTopics.length, 3));
    }
  }, [allSubTopics, visibleTopicCount]);

  // Fetch topic progress
  useEffect(() => {
    const fetchTopicProgress = async () => {
      if (!userId || !allSubTopics.length) return;

      try {
        const { data, error } = await supabase.from('user_skill_sysdata').select('*').eq('rsn_user', userId).in('skill', allSubTopics.map(topic => topic.id));
        if (error) {
          console.error('Error fetching topic progress:', error);
          return;
        }
        if (data) {
          const topicScores: Record<string, number> = {};

          // Use a type assertion for the data
          (data as any[]).forEach((item: any) => {
            topicScores[item.skill] = item.practice_score || 0;
          });

          setTopicScores(topicScores);
        }
      } catch (error) {
        console.error('Error in fetchTopicProgress:', error);
      }
    };

    fetchTopicProgress();
  }, [userId, allSubTopics, supabase]);

  if (isLoading || !skill) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100vh">
        <CircularProgress />
        <Txt>Loading practice topics...</Txt>
      </Stack>
    );
  }
  if (handlingStart) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100vh" spacing={2}>
        <CircularProgress />
        <Txt>Creating your practice session...</Txt>
        <Txt variant="caption" color="text.secondary">
          This may take a few moments
        </Txt>
      </Stack>
    );
  }

  return (
    <Stack
      spacing={isSmallDevice ? 1 : 2}
      px={isSmallDevice ? 2 : 4}
      py={isSmallDevice ? 1 : 2}
      maxWidth="48rem"
      width="100%"
      overflow="hidden"
      justifyContent="center"
      sx={{
        overflow: 'hidden'
      }}
    >
      <>
        <Stack spacing={isSmallDevice ? 1 : 2}>
          <Txt
            variant={isSmallDevice ? "h6" : "h5"}
            align="center"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'nowrap'
            }}
          >
            {overrideCTA || 'Choose a topic to start practicing'}
            {!isSmallDevice && !disableSkillChip &&
              <SkillChip
                topicOrId={skillId}
                disableAddDelete
                disableLevelIndicator
                disableModal
              />
            }
          </Txt>
        </Stack>

        <Stack
          spacing={isSmallDevice ? 1 : 2}
          direction={isSmallDevice ? 'column' : 'row'}
          sx={{ height: isSmallDevice ? '380px' : '400px', overflow: 'hidden' }}
        >
          {/* Expanded Card */}
          <Box width={isSmallDevice ? '100%' : '60%'} height={isSmallDevice ? '230px' : 'auto'} maxHeight={isSmallDevice ? undefined : '400px'}>
            <AnimatePresence mode="wait">
              {expandedTopicId && (
                <motion.div
                  key={expandedTopicId}
                  initial={{ opacity: 0, y: isSmallDevice ? -10 : 0, x: isSmallDevice ? 0 : -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: isSmallDevice ? -10 : 0, x: isSmallDevice ? 0 : -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%' }}
                >
                  <Card
                    elevation={4}
                    sx={{
                      height: '100%',
                      p: isSmallDevice ? 1 : 3,
                      background: theme => `linear-gradient(45deg, ${theme.palette.primary.main}15, ${theme.palette.background.paper})`,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 3,
                      display: 'flex',
                    }}
                  >
                    <Stack spacing={isSmallDevice ? 1 : 2} sx={{ width: '100%', height: '100%', justifyContent: 'space-between' }} overflow="auto">
                      <Stack spacing={isSmallDevice ? 0.75 : 1.5} maxHeight={isSmallDevice ? "200px" : "none"} minHeight={"100px"} textOverflow="ellipsis" overflow="hidden">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ fontSize: '2rem' }}>
                            {allSubTopics.find(t => t.id === expandedTopicId)?.emoji}
                          </Box>
                          <Txt variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                            {allSubTopics.find(t => t.id === expandedTopicId)?.name}
                          </Txt>
                          {/* Add progress badge to expanded topic */}
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: 24,
                              width: 24
                            }}>
                              <SubtopicProgressBadge
                                score={topicScores[expandedTopicId]}
                                size={24}
                                id={expandedTopicId}
                                showTooltip
                              />
                            </Box>
                        </Stack>
                        <Txt
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.6,
                            maxWidth: '90%',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: isSmallDevice ? 4 : 6,  // Show fewer lines on mobile
                            WebkitBoxOrient: 'vertical',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {allSubTopics.find(t => t.id === expandedTopicId)?.description}
                        </Txt>
                      </Stack>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => handleStartPractice()}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          boxShadow: 2,
                          borderRadius: 2,
                        }}
                      >
                        Start practicing this topic
                      </Button>
                    </Stack>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* Topic List */}
          <Box
            width={isSmallDevice ? '100%' : '40%'}
            sx={{
              overflowX: isSmallDevice ? 'auto' : 'hidden',
              overflowY: isSmallDevice ? 'hidden' : 'auto',
              display: 'flex',
              '&::-webkit-scrollbar': {
                height: '8px',
                width: '8px',
                display: 'block',
              },
              '&::-webkit-scrollbar-track': {
                background: theme => theme.palette.background.paper,
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme => theme.palette.divider,
                borderRadius: '4px',
                '&:hover': {
                  background: theme => theme.palette.action.hover,
                },
              },
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateRows: isSmallDevice ? 'repeat(2, min-content)' : 'auto',
                gridAutoFlow: isSmallDevice ? 'column' : 'row',
                gridAutoColumns: isSmallDevice ? 'max-content' : '100%',
                gap: isSmallDevice ? 1 : 2,
                p: isSmallDevice ? '8px 0' : 1,
                width: isSmallDevice ? 'fit-content' : '100%',
                height: 'fit-content',
                alignItems: 'start',
              }}
            >
              {allSubTopics
                .filter(t => !expandedTopicId || t.id !== expandedTopicId)
                .slice(0, visibleTopicCount)
                .map((topic) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <Card
                      onClick={() => handleTopicClick(topic.id)}
                      sx={{
                        p: isSmallDevice ? 1 : 1.5,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        overflow: 'inherit',
                        borderRadius: 2,
                        width: 'auto',
                        maxWidth: isSmallDevice ? '200px' : '100%',
                        maxHeight: isSmallDevice ? '60px' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                          transform: 'translateY(-2px)',
                          boxShadow: 1
                        }
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Box sx={{
                          fontSize: '1.25rem',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0
                        }}>
                          {topic.emoji}
                        </Box>
                        <Txt
                          variant={isSmallDevice ? "body2" : "subtitle1"}
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.2,
                            minWidth: 0,
                            ...(isSmallDevice && {
                              fontSize: '0.875rem'
                            })
                          }}
                        >
                          {topic.name}
                        </Txt>
                        {/* Add progress badge to topic list items */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: isSmallDevice ? 16 : 20,
                          width: isSmallDevice ? 16 : 20,
                          ml: 'auto'
                        }}>
                          <SubtopicProgressBadge
                            score={topicScores[topic.id]}
                            size={isSmallDevice ? 16 : 20}
                            id={topic.id}
                            showTooltip
                          />
                        </Box>
                      </Stack>
                    </Card>
                  </motion.div>
                ))}

              {/* Show more button or loading state */}
              {isRefillingQueue ? (
                <Card
                  sx={{
                    p: isSmallDevice ? 1 : 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    width: 'fit-content',
                    minWidth: isSmallDevice ? 'auto' : '100%',
                    maxHeight: '70px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
                    <CircularProgress size={20} sx={{ flexShrink: 0, opacity: 0.7 }} />
                    <Txt variant={isSmallDevice ? "body2" : "subtitle1"}>Loading more topics...</Txt>
                  </Stack>
                </Card>
              ) : visibleTopicCount < allSubTopics.length ? (
                <Card
                  onClick={handleShowMore}
                  sx={{
                    p: isSmallDevice ? 1 : 1.5,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    borderRadius: 2,
                    width: 'auto',
                    maxWidth: isSmallDevice ? '200px' : '100%',
                    maxHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: 1
                    }
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
                    <Add sx={{ fontSize: '1.25rem', opacity: 0.7, flexShrink: 0 }} />
                    <Txt
                      variant={isSmallDevice ? "body2" : "subtitle1"}
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2,
                        minWidth: 0,
                        ...(isSmallDevice && {
                          fontSize: '0.875rem'
                        })
                      }}
                    >
                      Show more topics
                    </Txt>
                  </Stack>
                </Card>
              ) : allSubTopics.length >= 12 && visibleTopicCount === allSubTopics.length ? (
                <Txt>If you're looking for something specific, tell us what you want to practice!</Txt>
              ) : null}
            </Box>
          </Box>
        </Stack>

        {/* Custom Topic Input */}
        {isGeneratingCustomTopic ? (
          <Stack spacing={2} alignItems="center">
            <Txt>Generating topic for you...</Txt>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={isSmallDevice ? 1 : 2}>
            <Txt>Or tell us what you'd like to focus on:</Txt>
            <Stack direction={isSmallDevice ? "column" : "row"} spacing={isSmallDevice ? 1 : 2}>
              <TxtField
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userInput.trim()) {
                    generateCustomSubtopics(userInput, allSubTopics);
                    setUserInput('');
                  }
                }}
                placeholder="E.g., I want to practice..."
                fullWidth
                size="small"
                variant="outlined"
              />
              <Button
                variant="contained"
                onClick={() => generateCustomSubtopics(userInput, allSubTopics)}
              >
                Generate Custom Topic
              </Button>
            </Stack>
          </Stack>
        )}
      </>
    </Stack>
  );
}