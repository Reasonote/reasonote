import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {motion} from "framer-motion";
import {intersection} from "lodash";
import {useRouter} from "next/navigation";
import {v4 as uuidv4} from "uuid";

import {
  ActivityGenStreamRoute,
} from "@/app/api/activity/gen-stream/routeSchema";
import {
  updatePracticeScoreRoute,
} from "@/app/api/user/update-practice-score/routeSchema";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useUserXP} from "@/clientOnly/hooks/useUserXP";
import {Activity} from "@/components/activity/Activity";
import {ActivityFooter} from "@/components/activity/footer/ActivityFooter";
import {PracticeHeaderDumb} from "@/components/practice/PracticeHeaderDumb";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useApolloClient} from "@apollo/client";
import {
  Add,
  FitnessCenter,
  Refresh,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  ActivityTypeGraded,
  ActivityTypesGraded,
} from "@reasonote/core";
import {
  createUserActivityResultFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {
  ActivityLoadingComponent,
} from "../activity/components/ActivityLoadingComponent";
import {useDialogManager} from "../dialogs/DialogManager";
import {Txt} from "../typography/Txt";
import {SubTopic} from "./PracticeV2Main";
import {LevelType} from "./SubtopicAdvancementDialog";
import {SubtopicProgressBar} from "./SubtopicProgressBar";
import {
  determineLevel,
  LEVEL_THRESHOLDS,
} from "./utils";

interface TopicGenerationError {
    message: string;
    timestamp: number;
}

interface TopicActivity {
    id: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    type: string;
}

interface TopicActivityQueues {
    [topicId: string]: {
        slideId: string | null;
        activityQueue: TopicActivity[];
        seenActivities: (TopicActivity & { completed: boolean })[];
        isGenerating: boolean;
        generationError: TopicGenerationError | null;
    }
}

interface PracticeSessionProps {
    skillId: string;
    allSubTopics: SubTopic[];
    subTopics: SubTopic[];
    onBack: () => void;
    allowedActivityTypes: string[];
    setAllowedActivityTypes: (allowedActivityTypes: string[]) => void;
    onSubtopicsInRotationChange: (subTopics: SubTopic[]) => void;
    onGenerateTopics?: () => void;
}

interface TopicProgress {
    score: number;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

const ACTIVITY_THRESHOLD = 3;
const RETRY_LIMIT = 3;

// Define activity types by difficulty
const ACTIVITY_TYPES = {
    BEGINNER: ['multiple-choice', 'choose-the-blank', 'flashcard', 'term-matching', 'sequence'],
    INTERMEDIATE: ['short-answer', 'fill-in-the-blank'],
    ADVANCED: ['short-answer', 'teach-the-ai', 'roleplay']
} as const;

const THRESHOLD_FOR_CORRECT = 70;
const THRESHOLD_FOR_PARTIALLY_CORRECT = 30;

// Points for different outcomes. TODO: Make this some smooth function
const getPointsForGrade = (grade: number) => {
    // Continuous function that smoothly transitions between point values
    // It takes at least 5 perfect answers to advance levels
    // For grades below THRESHOLD_FOR_PARTIALLY_CORRECT: Linear from -5 to 2
    // For grades between THRESHOLD_FOR_PARTIALLY_CORRECT and THRESHOLD_FOR_CORRECT: Linear from 2 to 6
    // For grades above THRESHOLD_FOR_CORRECT: Slight bonus up to 8 for perfect scores

    let points: number;

    if (grade < THRESHOLD_FOR_PARTIALLY_CORRECT) {
        // Linear interpolation from -5 at grade 0 to 2 at THRESHOLD_FOR_PARTIALLY_CORRECT
        points = -5 + (grade / THRESHOLD_FOR_PARTIALLY_CORRECT) * 7;
    } else if (grade < THRESHOLD_FOR_CORRECT) {
        // Linear interpolation from 2 at THRESHOLD_FOR_PARTIALLY_CORRECT to 6 at THRESHOLD_FOR_CORRECT
        const progressInRange = (grade - THRESHOLD_FOR_PARTIALLY_CORRECT) / (THRESHOLD_FOR_CORRECT - THRESHOLD_FOR_PARTIALLY_CORRECT);
        points = 2 + progressInRange * 4;
    } else {
        // Slight bonus for high scores, up to 8 for a perfect 100
        const progressAboveCorrect = (grade - THRESHOLD_FOR_CORRECT) / (100 - THRESHOLD_FOR_CORRECT);
        points = 6 + progressAboveCorrect * 2;
    }

    // Round to the nearest integer
    return Math.round(points);
};

// Add this near the other constants at the top
const NO_TOPIC_MESSAGE = {
    title: "No Topic Selected",
    description: "Please select a topic to start practicing"
};

// Add a type for the activity from the stream
interface ActivityFromStream {
    id: string;
    _type: string;
    _name: string;
    type_config: any;
}

export function PracticeSessionV2({ skillId, allSubTopics, subTopics, onBack, allowedActivityTypes, setAllowedActivityTypes, onSubtopicsInRotationChange, onGenerateTopics }: PracticeSessionProps) {
    const ac = useApolloClient();
    const { sb } = useSupabase();
    const router = useRouter();
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
    const [topicActivityQueues, setTopicActivityQueues] = useState<TopicActivityQueues>({});
    const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
    const [currentTopic, setCurrentTopic] = useState<SubTopic | null>(null);
    const [topicProgress, setTopicProgress] = useState<Record<string, TopicProgress>>({});
    const [subTopicsInRotation, setSubTopicsInRotation] = useState<SubTopic[]>(subTopics || []);
    const [isTopicSelectorOpen, setIsTopicSelectorOpen] = useState(false);
    const [completedTopicId, setCompletedTopicId] = useState<string | null>(null);
    const [activityResultId, setActivityResultId] = useState<string | null>(null);
    const { data: userXPData, refetch: refetchSkillXP } = useUserXP(skillId);
    const rsnUserId = useRsnUserId();
    const isSmallDevice = useIsSmallDevice();
    const [retryCount, setRetryCount] = useState<Record<string, number>>({});

    const dialogManager = useDialogManager();

    // Track if we're loading practice levels
    const [loadingPracticeLevels, setLoadingPracticeLevels] = useState(true);

    // Add state for tracking consecutive incorrect answers and level drop dialog
    const [consecutiveIncorrect, setConsecutiveIncorrect] = useState<Record<string, number>>({});

    // Add a function to handle resetting consecutive incorrect answers
    const resetConsecutiveIncorrectForTopic = useCallback((topicId: string | null) => {
        if (topicId) {
            setConsecutiveIncorrect(prev => ({
                ...prev,
                [topicId]: 0
            }));
        }
    }, []);

    useEffect(() => {
        setCurrentTopic(subTopicsInRotation[currentTopicIndex]);
    }, [subTopicsInRotation, currentTopicIndex]);

    // Load practice levels for all topics
    useEffect(() => {
        const loadPracticeLevels = async () => {
            if (!rsnUserId || allSubTopics.length === 0) return;

            setLoadingPracticeLevels(true);

            try {
                // Load practice levels for all topics
                const { data, error } = await sb
                    .from('user_skill_sysdata')
                    .select('*')
                    .eq('rsn_user', rsnUserId)
                    .in('skill', allSubTopics.map(t => t.id));

                if (error) {
                    console.error('Error loading practice levels:', error);
                    return;
                }

                // Create a map of topic ID to practice level
                const practiceScoreMap: Record<string, number> = {};

                // Initialize all topics with 0
                allSubTopics.forEach(topic => {
                    practiceScoreMap[topic.id] = 0;
                });

                // Update with actual values from database
                if (data) {
                    data.forEach(item => {
                        if (item.skill && item.practice_score !== null) {
                            practiceScoreMap[item.skill] = item.practice_score;
                        }
                    });
                }

                // Update topic progress with practice levels
                setTopicProgress(prev => {
                    const newProgress = { ...prev };

                    allSubTopics.forEach(topic => {
                        const practiceScore = practiceScoreMap[topic.id] || 0;
                        const level = determineLevel(practiceScore);

                        newProgress[topic.id] = {
                            score: practiceScore,
                            level,
                        };
                    });

                    return newProgress;
                });
            } catch (err) {
                console.error('Error loading practice levels:', err);
            } finally {
                setLoadingPracticeLevels(false);
            }
        };

        loadPracticeLevels();
    }, [rsnUserId, allSubTopics, sb]);

    useEffect(() => {
        // Filter out activities that are no longer allowed from both queue and seen activities
        setTopicActivityQueues(prev => {
            const newQueues = { ...prev };

            Object.keys(newQueues).forEach(topicId => {
                newQueues[topicId] = {
                    ...newQueues[topicId],
                    activityQueue: newQueues[topicId].activityQueue.filter(
                        activity => allowedActivityTypes.includes(activity.type)
                    ),
                };
            });

            return newQueues;
        });
    }, [allowedActivityTypes]);

    useEffect(() => {
        if (currentTopic) {
            const currentTopicData = topicActivityQueues[currentTopic.id];
            if (currentTopicData) {
                // If we have a slide and it hasn't been seen yet, show it first
                if (currentTopicData.slideId &&
                    !currentTopicData.seenActivities.some(a => a.id === currentTopicData.slideId) &&
                    allowedActivityTypes.includes('slide')
                ) {
                    setCurrentActivityId(currentTopicData.slideId);
                    return;
                }

                // If current activity is already set and valid, don't change it
                if (currentActivityId && currentTopicData.activityQueue.some(a => a.id === currentActivityId)) {
                    return;
                }

                // Otherwise, show an activity from the queue that matches allowed types
                const currentLevel = topicProgress[currentTopic.id]?.level ?? 'BEGINNER';
                const matchingActivity = currentTopicData.activityQueue.find(
                    activity => activity.level === currentLevel && allowedActivityTypes.includes(activity.type)
                ) || currentTopicData.activityQueue.find(
                    activity => allowedActivityTypes.includes(activity.type) &&
                        Math.abs(LEVEL_THRESHOLDS[activity.level] - LEVEL_THRESHOLDS[currentLevel]) <= 40
                ) || currentTopicData.activityQueue.find(
                    activity => allowedActivityTypes.includes(activity.type)
                );

                if (matchingActivity) {
                    setCurrentActivityId(matchingActivity.id);
                } else if (currentTopicData.generationError || currentTopicData.isGenerating) {
                    setCurrentActivityId(null);
                } else if (currentTopicData.activityQueue.length < ACTIVITY_THRESHOLD) {
                    generateActivitiesForTopic(currentTopic.id, currentLevel, ACTIVITY_THRESHOLD - currentTopicData.activityQueue.length);
                    setCurrentActivityId(null);
                } else {
                    setCurrentActivityId(null);
                }
            }
        }
    }, [currentTopic, topicActivityQueues, topicProgress, allowedActivityTypes]);

    const getAllowedActivityTypes = useCallback((level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): string[] => {
        const levelMap = {
            'BEGINNER': ACTIVITY_TYPES.BEGINNER,
            'INTERMEDIATE': ACTIVITY_TYPES.INTERMEDIATE,
            'ADVANCED': ACTIVITY_TYPES.ADVANCED
        };

        const fallbackOrder = {
            'BEGINNER': ['INTERMEDIATE', 'ADVANCED'],
            'INTERMEDIATE': ['BEGINNER', 'ADVANCED'],
            'ADVANCED': ['INTERMEDIATE', 'BEGINNER']
        };

        // Try current level
        let allowed = intersection([...levelMap[level]], allowedActivityTypes);
        if (allowed.length > 0) return allowed;

        // Try fallbacks in order
        for (const fallbackLevel of fallbackOrder[level]) {
            allowed = intersection([...levelMap[fallbackLevel]], allowedActivityTypes);
            if (allowed.length > 0) return allowed;
        }

        // If nothing found, return all allowed types as last resort
        return [...allowedActivityTypes];
    }, [allowedActivityTypes]);

    const generateActivitiesForTopic = useCallback(async (topicId: string, level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER', numActivities: number = 1) => {
        
        if (!topicActivityQueues[topicId]) {
            console.error('Topic activities not found for topic', topicId);
            return;
        }

        if (topicActivityQueues[topicId].isGenerating || topicActivityQueues[topicId].generationError) {
            return;
        }

        setTopicActivityQueues(prev => ({
            ...prev,
            [topicId]: {
                ...prev[topicId],
                isGenerating: true,
            }
        }));

        try {
            const allowedTypes = getAllowedActivityTypes(level);
            const seenActivityIds = topicActivityQueues[topicId].seenActivities.map(a => a.id);
            const queuedActivityIds = topicActivityQueues[topicId].activityQueue.map(a => a.id);
            const recentActivityIds = [...seenActivityIds, ...queuedActivityIds].filter(id => id !== topicActivityQueues[topicId].slideId).slice(-6);

            // Create an array to collect activities from the stream
            const newActivities: ActivityFromStream[] = [];

            // Use the streaming API to generate activities
            for await (const activity of ActivityGenStreamRoute.callArrayStream({
                context: {
                    skill: {
                        id: topicId,
                        name: null,
                        parentIds: [skillId]
                    },
                },
                numActivities,
                activityTypes: allowedTypes as any,
                activityIdsToAvoidSimilarity: recentActivityIds,
                slideActivityIdToAnchorOn: topicActivityQueues[topicId].slideId ?? undefined,
                useDomainCtxInjectors: true,
            })) {
                if (activity) {
                    newActivities.push(activity as ActivityFromStream);
                }
            }

            if (newActivities.length === 0) {
                throw new Error('No activities were generated');
            }

            setTopicActivityQueues(prev => ({
                ...prev,
                [topicId]: {
                    ...prev[topicId],
                    activityQueue: [
                        ...prev[topicId].activityQueue,
                        ...newActivities.map(a => ({
                            id: a.id,
                            level,
                            type: a._type
                        }))
                    ],
                    isGenerating: false,
                    generationError: null
                }
            }));
        } catch (error) {
            console.error('Error generating activities:', error);
            setTopicActivityQueues(prev => ({
                ...prev,
                [topicId]: {
                    ...prev[topicId],
                    isGenerating: false,
                    generationError: {
                        message: error instanceof Error ? error.message : 'Failed to generate activities',
                        timestamp: Date.now()
                    }
                }
            }));
        }
    }, [skillId, topicActivityQueues, getAllowedActivityTypes]);

    useEffect(() => {
        subTopicsInRotation.forEach(topic => {
            if (!topicActivityQueues[topic.id]) {
                const slideId = topic.activities?.find(a => a.type === 'slide')?.id || null;
                const otherActivities = topic.activities?.filter(a => a.type !== 'slide') || [];

                setTopicActivityQueues(prev => ({
                    ...prev,
                    [topic.id]: {
                        slideId,
                        activityQueue: otherActivities.map(a => ({
                            id: a.id,
                            level: 'BEGINNER',
                            type: a.type
                        })),
                        seenActivities: [],
                        isGenerating: false,
                        generationError: null
                    }
                }));
            }
        });
    }, [subTopicsInRotation]);

    useEffect(() => {
        if (!topicActivityQueues) return;

        subTopicsInRotation.forEach(topic => {
            const currentTopicData = topicActivityQueues[topic.id];
            if (currentTopicData && !currentTopicData.isGenerating) {
                const currentLevel = topicProgress[topic.id]?.level ?? 'BEGINNER';

                // Count activities matching current level
                const matchingLevelActivities = currentTopicData.activityQueue.filter(
                    activity => activity.level === currentLevel
                ).length;

                if (matchingLevelActivities < ACTIVITY_THRESHOLD) {
                    generateActivitiesForTopic(topic.id, currentLevel, ACTIVITY_THRESHOLD - matchingLevelActivities);
                }
            }
        });
    }, [subTopicsInRotation, topicActivityQueues, generateActivitiesForTopic, topicProgress]);

    const getNextTopic = useCallback((currentIndex: number): number => {
        return (currentIndex + 1) % subTopicsInRotation.length;
    }, [subTopicsInRotation.length]);

    const moveToNextActivity = useCallback(() => {
        if (!currentTopic || !currentActivityId) return;

        const currentTopicData = topicActivityQueues[currentTopic.id];
        if (!currentTopicData) return;

        // Move current activity to seen activities
        if (currentActivityId === currentTopicData.slideId) {
            setTopicActivityQueues(prev => ({
                ...prev,
                [currentTopic.id]: {
                    ...prev[currentTopic.id],
                    seenActivities: [
                        ...prev[currentTopic.id].seenActivities,
                        {
                            id: currentActivityId,
                            level: 'BEGINNER',
                            type: currentTopicData.activityQueue.find(a => a.id === currentActivityId)?.type ?? '',
                            completed: true
                        }
                    ]
                }
            }));
        } else {
            setTopicActivityQueues(prev => {
                const topicData = prev[currentTopic.id];
                const activityIndex = topicData.activityQueue.findIndex(a => a.id === currentActivityId);
                if (activityIndex === -1) return prev;

                const [activity] = topicData.activityQueue.splice(activityIndex, 1);
                topicData.seenActivities.push({
                    ...activity,
                    completed: true,
                });

                return {
                    ...prev,
                    [currentTopic.id]: topicData
                };
            });
        }

        // Move to next topic
        const nextTopicIndex = getNextTopic(currentTopicIndex);
        setCurrentTopicIndex(nextTopicIndex);
    }, [currentTopic, currentActivityId, topicActivityQueues, currentTopicIndex, getNextTopic]);

    useEffect(() => {
        setTopicProgress(prev => {
            const newProgress = { ...prev };
            // Only initialize progress for topics that don't have it yet
            subTopicsInRotation.forEach(topic => {
                if (!newProgress[topic.id]) {
                    newProgress[topic.id] = {
                        score: 0,
                        level: 'BEGINNER'
                    };
                }
            });
            return newProgress;
        });
    }, [subTopicsInRotation]);

    // Update practice level in the database using our API route
    const updatePracticeScore = useCallback(async (topicId: string, newScore: number) => {
        if (!rsnUserId) return;

        try {
            const result = await updatePracticeScoreRoute.call({
                skillId: topicId,
                practiceScore: newScore
            });

            if (!result.data?.success) {
                console.error('Error updating practice level:', result.error);
                return;
            }
        } catch (err) {
            console.error('Error in updatePracticeLevel:', err);
        }
    }, [rsnUserId]);

    const handleActivityComplete = useCallback(async (givenGrade: number, activityType: ActivityTypeGraded | undefined = undefined) => {

        const grade = givenGrade || 0;

        if (!currentTopic || !currentActivityId) return;

        // Only handle scoring and progress updates here
        if (!activityType || !ActivityTypesGraded.includes(activityType)) {
            return;
        }
        const points = getPointsForGrade(grade);
        const currentScore = topicProgress[currentTopic.id]?.score || 0;
        const currentLevel = topicProgress[currentTopic.id]?.level || 'BEGINNER';

        // Track consecutive incorrect answers
        if (grade < THRESHOLD_FOR_PARTIALLY_CORRECT) {
            setConsecutiveIncorrect(prev => ({
                ...prev,
                [currentTopic.id]: (prev[currentTopic.id] || 0) + 1
            }));

            // Check if user is at the bottom of their level and has 3 consecutive incorrect answers
            const isAtBottomOfLevel =
                (currentLevel === 'INTERMEDIATE' && currentScore <= LEVEL_THRESHOLDS.INTERMEDIATE + 5) ||
                (currentLevel === 'ADVANCED' && currentScore <= LEVEL_THRESHOLDS.ADVANCED + 5);

            if (isAtBottomOfLevel && (consecutiveIncorrect[currentTopic.id] || 0) >= 2) { // Check for 2 because this is the 3rd one
                // Show level drop dialog for Intermediate or Advanced users
                // We already know it's INTERMEDIATE or ADVANCED from isAtBottomOfLevel check
                const newTargetLevel = currentLevel === 'ADVANCED' ? 'INTERMEDIATE' : 'BEGINNER';
                handleShowLevelDropDialog(currentTopic.id, newTargetLevel);

                // Reset consecutive incorrect counter
                setConsecutiveIncorrect(prev => ({
                    ...prev,
                    [currentTopic.id]: 0
                }));
            }
        } else {
            // Reset consecutive incorrect counter on correct or partially correct answers
            setConsecutiveIncorrect(prev => ({
                ...prev,
                [currentTopic.id]: 0
            }));
        }

        // Ensure we don't go down in level
        const newScore = Math.max(LEVEL_THRESHOLDS[currentLevel], Math.min(100, currentScore + points));
        const newLevel = determineLevel(newScore);

        // Update practice level in the database
        await updatePracticeScore(currentTopic.id, newScore);

        // Check for level advancements
        if (currentLevel !== newLevel) {
            // Determine which level advancement dialog to show
            handleLevelAdvancement(currentTopic.id, newLevel);
        }

        // Check if topic just reached 100%
        if (newScore >= 100 && currentScore < 100) {
            // Use 'MASTERED' instead of 'ADVANCED' for topics that reach 100%
            handleLevelAdvancement(currentTopic.id, 'MASTERED');
        }

        // Update local state
        setTopicProgress(prev => ({
            ...prev,
            [currentTopic.id]: {
                ...prev[currentTopic.id],
                score: newScore,
                level: newLevel
            }
        }));
    }, [currentTopic, currentActivityId, topicProgress, updatePracticeScore, consecutiveIncorrect]);

    const addTopicToRotation = useCallback((topicId: string) => {
        const topicToAdd = allSubTopics.find(t => t.id === topicId);
        if (topicToAdd && !subTopicsInRotation.some(t => t.id === topicId)) {
            setSubTopicsInRotation(prev => [...prev, topicToAdd]);
        }
        setCurrentTopicIndex(0);
    }, [allSubTopics]);

    const removeTopicFromRotation = useCallback((topicId: string) => {
        setSubTopicsInRotation(prev => {
            // If this topic is completed, allow removing even if it's the last one
            const isCompleted = topicProgress[topicId]?.score >= 100;
            if (prev.length <= 1 && !isCompleted) return prev;

            const newTopics = prev.filter(t => t.id !== topicId);

            // If we're removing the current topic, move to the next one
            if (currentTopic?.id === topicId) {
                const nextTopicIndex = getNextTopic(currentTopicIndex);
                setCurrentTopicIndex(nextTopicIndex);
            }

            return newTopics;
        });
        setCurrentTopicIndex(0);
    }, [currentTopic, currentTopicIndex, getNextTopic, topicProgress]);

    useEffect(() => {
        onSubtopicsInRotationChange(subTopicsInRotation);
    }, [subTopicsInRotation]);

    // Add handler for completion dialog close
    const handleCompletionDialogClose = useCallback((topicId: string) => {
        if (topicId) {
            // Animate out the completed topic
            const topicElement = document.querySelector(`[data-topic-id="${topicId}"]`);
            if (topicElement) {
                topicElement.animate([
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(0)', opacity: 0 }
                ], {
                    duration: 500,
                    easing: 'ease-out'
                }).onfinish = () => {
                    removeTopicFromRotation(topicId);
                    setCompletedTopicId(null);

                    // If this was the last topic, open topic selector
                    if (subTopicsInRotation.length <= 1) {
                        setIsTopicSelectorOpen(true);
                    }
                };
            } else {
                // Fallback if element not found
                removeTopicFromRotation(topicId);
                setCompletedTopicId(null);
                if (subTopicsInRotation.length <= 1) {
                    setIsTopicSelectorOpen(true);
                }
            }
        }
    }, [completedTopicId, subTopicsInRotation.length, removeTopicFromRotation]);

    // Update the level advancement dialog handling
    const handleLevelAdvancement = useCallback((topicId: string, newLevel: string) => {
        // Determine the level type based on the new level
        let levelType: LevelType;

        if (newLevel === 'INTERMEDIATE') {
            levelType = 'BEGINNER_TO_INTERMEDIATE';
        } else if (newLevel === 'ADVANCED') {
            levelType = 'INTERMEDIATE_TO_ADVANCED';
        } else if (newLevel === 'MASTERED') {
            levelType = 'MASTERED';
        } else {
            // Default case - shouldn't happen but prevents type errors
            levelType = 'BEGINNER_TO_INTERMEDIATE';
        }

        // Show the dialog using the dialog manager
        dialogManager.showDialog({
            type: 'SubtopicAdvancement',
            id: `level-advancement-${uuidv4()}`,
            levelType,
            topicName: allSubTopics.find(t => t.id === topicId)?.name || '',
            onClose: () => handleLevelAdvancementDialogClose(levelType, topicId),
            onSuggestionAction: () => handleLevelAdvancementAction(levelType, topicId)
        });

    }, [allSubTopics, dialogManager]);

    // Update the level advancement dialog close handler
    const handleLevelAdvancementDialogClose = useCallback((levelType: LevelType, topicId: string) => {
        if (levelType === 'MASTERED') {
            handleCompletionDialogClose(topicId);
        }
    }, [handleCompletionDialogClose]);

    // Handle level advancement dialog actions
    const handleLevelAdvancementAction = useCallback((levelType: LevelType, topicId: string) => {

        // Different actions based on the level type
        switch (levelType) {
            case 'BEGINNER_TO_INTERMEDIATE':
                setIsTopicSelectorOpen(true);
                break;
            case 'INTERMEDIATE_TO_ADVANCED':
                setIsTopicSelectorOpen(true);
                break;
            case 'MASTERED':
                // Handle podcast mode or other mastery actions
                if (topicId) {
                    setCompletedTopicId(topicId);
                router.push(`/app/skills/${topicId}/podcast/new`);
            }
        }
    }, [router, setCompletedTopicId]);

    const handleActivityCompleteAfterResultPosted = useCallback(async ({ resultId }: { resultId?: string }) => {
        await refetchSkillXP();
        setActivityResultId(resultId ?? null);
    }, [refetchSkillXP]);

    useEffect(() => {
        setActivityResultId(null);
    }, [currentActivityId]);

    const skipActivity = useCallback(async () => {
        if (!currentActivityId || !currentTopic) return;

        await ac.mutate({
            mutation: createUserActivityResultFlatMutDoc,
            variables: {
                objects: [{
                    activity: currentActivityId,
                    user: rsnUserId,
                    score: 0,
                    skipped: true
                }]
            }
        }).catch(error => {
            console.error('Error posting activity result:', error);
        });

        moveToNextActivity();

    }, [currentActivityId, currentTopic, rsnUserId, ac, moveToNextActivity, handleActivityComplete]);

    const handleRetryGeneration = useCallback((topicId: string) => {
        setRetryCount(prev => ({
            ...prev,
            [topicId]: (prev[topicId] || 0) + 1
        }));

        const currentLevel = topicProgress[topicId]?.level ?? 'BEGINNER';
        setTopicActivityQueues(prev => ({
            ...prev,
            [topicId]: {
                ...prev[topicId],
                generationError: null
            }
        }));
        generateActivitiesForTopic(topicId, currentLevel, 1);
    }, [generateActivitiesForTopic, topicProgress, retryCount]);

    const handleSkipTopic = useCallback((topicId: string) => {
        if (retryCount[topicId] >= RETRY_LIMIT) {
            setRetryCount(prev => ({
                ...prev,
                [topicId]: 0
            }));
            handleCompletionDialogClose(topicId);
        } else {
            const nextTopicIndex = getNextTopic(currentTopicIndex);
            setCurrentTopicIndex(nextTopicIndex);
            handleRetryGeneration(topicId);
        }
    }, [currentTopic, currentTopicIndex, getNextTopic, handleCompletionDialogClose]);

    // Function to explicitly reset a user's level if needed
    const resetTopicLevel = useCallback(async (topicId: string, targetLevel: 'BEGINNER' | 'INTERMEDIATE') => {
        if (!rsnUserId || !topicProgress[topicId]) return;

        // Calculate a score that corresponds to the beginning of the target level
        let newScore: number;
        switch (targetLevel) {
            case 'INTERMEDIATE':
                newScore = LEVEL_THRESHOLDS.INTERMEDIATE;
                break;
            case 'BEGINNER':
            default:
                newScore = LEVEL_THRESHOLDS.BEGINNER;
                break;
        }

        // Update the database
        await updatePracticeScore(topicId, newScore);

        // Update local state
        setTopicProgress(prev => ({
            ...prev,
            [topicId]: {
                ...prev[topicId],
                score: newScore,
                level: targetLevel
            }
        }));

    }, [rsnUserId, topicProgress, updatePracticeScore]);

    // Update the level drop dialog handling
    const handleShowLevelDropDialog = useCallback((topicId: string, targetLevel: 'BEGINNER' | 'INTERMEDIATE') => {
        // Show the dialog using the dialog manager
        dialogManager.showDialog({
            type: 'SubtopicDropLevel',
            id: `level-drop-${uuidv4()}`,
            targetLevel,
            topicName: allSubTopics.find(t => t.id === topicId)?.name || '',
            onConfirm: () => handleLevelDrop(topicId, targetLevel),
            onClose: () => handleCloseLevelDropDialog(topicId)
        });
    }, [allSubTopics, dialogManager]);

    // Update the level drop handler
    const handleLevelDrop = useCallback(async (topicId: string, targetLevel: 'BEGINNER' | 'INTERMEDIATE') => {
        if (!topicId || !targetLevel) return;

        try {
            // Reset the topic level
            await resetTopicLevel(topicId, targetLevel);

        } catch (error) {
            console.error('Error dropping level:', error);
        }
    }, [resetTopicLevel]);

    // Add a function to handle closing the level drop dialog
    const handleCloseLevelDropDialog = useCallback((topicId: string) => {
        // Reset consecutive incorrect counter when dialog is closed
        resetConsecutiveIncorrectForTopic(topicId);
    }, [resetConsecutiveIncorrectForTopic]);

    // Replace the useEffect that initializes subTopicsInRotation with this modified version
    useEffect(() => {
        // Only initialize if subTopicsInRotation is empty and we have subTopics from props
        if (subTopicsInRotation.length === 0 && subTopics && subTopics.length > 0) {
            setSubTopicsInRotation(subTopics);
        }
    }, [subTopics]);

    // Add a new useEffect to update subTopicsInRotation when subTopics prop changes
    useEffect(() => {
        // Only update if the subTopics prop has changed and contains valid topics
        if (subTopics && subTopics.length > 0) {
            // Check if the arrays are different by comparing IDs
            const currentIds = subTopicsInRotation.map(topic => topic.id).sort().join(',');
            const newIds = subTopics.map(topic => topic.id).sort().join(',');
            
            if (currentIds !== newIds) {
                setSubTopicsInRotation(subTopics);
            }
        }
    }, [subTopics]);

    // Handle the button click based on whether topics exist
    const handleTopicButtonClick = useCallback(() => {
        if (allSubTopics.length === 0) {
            // If no topics exist and we have a generation handler, call it
            if (onGenerateTopics) {
                onGenerateTopics();
            } else {
                // Fallback to opening the selector if no generator provided
                setIsTopicSelectorOpen(true);
            }
        } else {
            // If topics exist, just open the selector
            setIsTopicSelectorOpen(true);
        }
    }, [allSubTopics.length, onGenerateTopics, setIsTopicSelectorOpen]);

    return (
        <>
            <Stack
                sx={{
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    bgcolor: theme => theme.palette.background.default,
                }}
            >
                <Stack
                    spacing={isSmallDevice ? 1 : 2}
                    sx={{
                        height: '100%',
                        width: '100%',
                        maxWidth: '48rem',
                        mx: 'auto',
                        overflow: 'hidden',
                        p: {
                            xs: 0.5,  // Reduced padding on mobile
                            sm: 2
                        },
                    }}
                >
                    <PracticeHeaderDumb
                        currentActivityId={currentActivityId}
                        handleBack={onBack}
                        usingSkillIdStack={[skillId, currentTopic?.id ?? '']}
                        levelInfo={userXPData?.levelInfo}
                        dailyXp={userXPData?.dailyXp}
                        allowedActivities={allowedActivityTypes}
                        setAllowedActivityTypes={setAllowedActivityTypes}
                        icon={<FitnessCenter />}
                    />

                    <Box sx={{ position: 'relative' }}>
                        <SubtopicProgressBar
                            topics={allSubTopics}
                            currentTopicIndex={currentTopicIndex}
                            topicScores={Object.fromEntries(allSubTopics.map(t => [t.id, topicProgress[t.id]?.score ?? 0]))}
                            activeTopics={subTopicsInRotation}
                            onAddTopic={addTopicToRotation}
                            onRemoveTopic={removeTopicFromRotation}
                            isTopicSelectorOpen={isTopicSelectorOpen}
                            setIsTopicSelectorOpen={setIsTopicSelectorOpen}
                        />
                    </Box>

                    <Stack
                        flex={1}
                        minHeight={0}
                        width="100%"
                        overflow="hidden"
                    >
                        <Card
                            elevation={5}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            <motion.div
                                key={currentTopic?.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}
                            >
                                <Stack
                                    sx={{
                                        flex: 1,
                                        overflow: 'auto',
                                        minHeight: 0,
                                        p: isSmallDevice ? 1 : 2
                                    }}
                                >
                                    {!currentTopic ? (
                                        <Stack
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent="center"
                                            height="100%"
                                            sx={{
                                                color: 'text.secondary',
                                                textAlign: 'center',
                                                p: 3
                                            }}
                                        >
                                            <Txt variant="h5" sx={{ fontWeight: 600 }}>
                                                {NO_TOPIC_MESSAGE.title}
                                            </Txt>
                                            <Txt>
                                                {NO_TOPIC_MESSAGE.description}
                                            </Txt>
                                            <Button
                                                variant="contained"
                                                onClick={handleTopicButtonClick}
                                                startIcon={<Add />}
                                            >
                                                {allSubTopics.length === 0 ? "Generate Topics" : "Select a Topic"}
                                            </Button>
                                        </Stack>
                                    ) : topicActivityQueues[currentTopic.id]?.generationError &&
                                        topicActivityQueues[currentTopic.id]?.activityQueue.length === 0 && (
                                            !allowedActivityTypes.includes('slide') ||
                                            topicActivityQueues[currentTopic.id]?.seenActivities.some(a => a.id === topicActivityQueues[currentTopic.id]?.slideId)
                                        ) ? (
                                        <Stack spacing={2} alignItems="center" justifyContent="center" height="100%">
                                            <Alert
                                                severity="error"
                                                sx={{
                                                    maxWidth: '400px',
                                                    width: '100%'
                                                }}
                                            >
                                                <AlertTitle>Activity Generation Failed</AlertTitle>
                                                {retryCount[currentTopic.id] >= RETRY_LIMIT ? (
                                                    'Maximum retries reached.'
                                                ) : (
                                                    topicActivityQueues[currentTopic.id].generationError?.message
                                                )}
                                            </Alert>

                                            <Stack direction="row" spacing={2}>
                                                {(retryCount[currentTopic.id] || 0) < RETRY_LIMIT && (
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<Refresh />}
                                                        onClick={() => handleRetryGeneration(currentTopic.id)}
                                                        disabled={topicActivityQueues[currentTopic.id].isGenerating || retryCount[currentTopic.id] >= RETRY_LIMIT}
                                                    >
                                                        {topicActivityQueues[currentTopic.id].isGenerating ? (
                                                            <CircularProgress size={24} color="inherit" />
                                                        ) : (
                                                            'Retry Generation'
                                                        )}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleSkipTopic(currentTopic.id)}
                                                >
                                                    {(retryCount[currentTopic.id] >= RETRY_LIMIT) ? 'Remove Topic From Rotation' : 'Skip This Topic'}
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    ) : currentActivityId && (
                                        topicActivityQueues[currentTopic.id].activityQueue.some(a => a.id === currentActivityId) ||
                                        topicActivityQueues[currentTopic.id].slideId === currentActivityId
                                    ) ? (
                                        <Activity
                                            key={currentActivityId}
                                            activityId={currentActivityId}
                                            onActivityComplete={(result) => handleActivityComplete(result.grade0to100 as number, result.activityType as ActivityTypeGraded)}
                                            onActivityCompleteAfterResultPosted={handleActivityCompleteAfterResultPosted}
                                            onNextActivity={moveToNextActivity}
                                            displayContext={{
                                                type: 'skillIdPath',
                                                skillIdPath: [skillId, currentTopic?.id ?? ''],
                                            }}
                                            disableEdit
                                        />
                                    ) : (
                                        <ActivityLoadingComponent />
                                    )}
                                </Stack>
                            </motion.div>
                        </Card>
                    </Stack>

                    <ActivityFooter
                        activityId={currentActivityId ?? ''}
                        activityResultId={activityResultId ?? undefined}
                        onSkip={skipActivity}
                        isNextDisabled={!currentActivityId}
                        activityButtonsDisabled={!currentActivityId}
                    />
                </Stack>
            </Stack>
        </>
    );
} 