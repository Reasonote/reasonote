import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";
import {useRouter} from "next/navigation";

import {LessonCompleteRoute} from "@/app/api/lesson/complete/routeSchema";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  LinearProgressCountdown,
} from "@/components/progress/LinearProgressCountdown";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {ArrowBack} from "@mui/icons-material";
import {
  Alert,
  Button,
  Snackbar,
  Stack,
  useTheme,
} from "@mui/material";
import {
  GetActivityResultsDeepDocument,
  OrderByDirection,
  UserActivityResult,
} from "@reasonote/lib-sdk-apollo-client";
import {useLessonFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {CongratulationsHeader} from "./components/CongratulationsHeader";
import {LessonStatistics} from "./components/LessonStatistics";
import {NextSteps} from "./components/NextSteps";
import {SkillProgress} from "./components/SkillProgress";
import {TakeawayFlashcards} from "./components/TakeawayFlashcards";

export interface LessonFinishSectionProps {
    lessonId: string;
    lessonSessionId: string;
    finishText: string;
    onBackToSkill: () => void;
    onStartNewLesson: (newLessonId: string) => void;
}

export function LessonFinishSection({lessonId, lessonSessionId, onBackToSkill, onStartNewLesson}: LessonFinishSectionProps) {
    const router = useRouter();
    const [finishResult, setFinishResult] = useState<Awaited<ReturnType<typeof LessonCompleteRoute.call>> | null>(null);

    const [newLessonSkillId, setNewLessonSkillId] = useState<string | null>(null);

    const ac = useApolloClient();
    const {data: lesson} = useLessonFlatFragLoader(lessonId);

    const rsnUserId = useRsnUserId();
    const theme = useTheme();
    const { sb } = useSupabase();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
   
    const markLessonComplete = useCallback(async () => {
        if (!lessonSessionId) {
            console.warn("No lessonId provided to LessonFinishSection")
            return;
        }
        
        // Mark completion of lesson
        const ret = await LessonCompleteRoute.call({
            lessonSessionId
        })

        setFinishResult(ret);
    }, [lessonSessionId])

    useAsyncEffect(async () => {
        await markLessonComplete();
    }, [lessonSessionId])

    // Get all activities that were done in this lesson
    const activityResultsRes = useQuery(
        GetActivityResultsDeepDocument,
        {
            variables: {
                filter: {
                    lessonSessionId: {
                        eq: lessonSessionId
                    },
                    user: {
                        eq: rsnUserId
                    }
                },
                orderBy: {
                    createdDate: OrderByDirection.AscNullsFirst
                }
            }
        }
    )
    const isSmallDevice = useIsSmallDevice();

    const resultScores = activityResultsRes.data?.userActivityResultCollection?.edges?.map((e) => e.node.score).filter(notEmpty) ?? [];
    const totalScore = resultScores.reduce((acc, score) => acc + score, 0);
    const totalPointsPossible = resultScores.length * 100;
    const pointsMissed = totalPointsPossible - totalScore;
        
    const percentCorrect = (resultScores.filter((score) => score >= 90).length / resultScores.length) * 100;
    const percentIncorrect = (resultScores.filter((score) => score < 90).length / resultScores.length) * 100;

    const numberActivitiesCompleted = activityResultsRes.data?.userActivityResultCollection?.edges?.length ?? 0;
    const activityResults = activityResultsRes.data?.userActivityResultCollection?.edges?.map(e => e.node) ?? [];
    

    const handleStartPractice = () => {
        if (lesson?.rootSkill) {
            router.push(`/app/practice/practice?skillIdPath=${encodeURIComponent(JSON.stringify([lesson.rootSkill]))}&type=review-pinned`);
        }
    };

    const handleListenPodcast = () => {
        if (lesson?.rootSkill) {
            router.push(`/app/skills/${lesson.rootSkill}/podcast/new`);
        }
    };

    const handleAddToPodcastQueue = async () => {
        const title = lesson?.name;

        if (!title) {
            setSnackbarMessage('Failed to add topic to queue');
            console.error('No title provided to add to podcast queue');
            return;
        }

        const { data, error } = await sb
            .rpc('add_to_podcast_queue', {
                p_topic: title,
                p_special_instructions: '',
                p_podcast_type: 'layman-expert',
                p_for_skill_path: [lesson?.rootSkill, ...(lesson?.rootSkillPath ?? [])].filter(notEmpty)
            });

        if (error) {
            console.error('Error adding to queue:', error);
            setSnackbarMessage('Failed to add topic to queue');
        } else {
            console.log('Added to queue:', data);
            setSnackbarMessage('Topic added to queue successfully');
        }
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
        setSnackbarOpen(false);
    };

    return <Stack spacing={4} paddingY={4}>
        <CongratulationsHeader 
            lessonName={lesson?.name ?? ""}
        />
        
        <TakeawayFlashcards 
            lessonId={lessonId}
            activityResults={activityResults as UserActivityResult[]}
            lessonContent={lesson?.summary ?? ''}
        />

        <LessonStatistics
            score={totalScore}
            totalQuestions={numberActivitiesCompleted}
        />
        
        <SkillProgress
            activityResults={activityResults as UserActivityResult[]}
        />
        
        <NextSteps
            onStartPractice={handleStartPractice}
            onListenPodcast={handleListenPodcast}
            onAddToPodcastQueue={handleAddToPodcastQueue}
        />
        
        <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBackToSkill}
            sx={{
                backgroundColor: theme.palette.background.default,
            }}
        >
            Back to Skill
        </Button>

        <Snackbar open={snackbarOpen} autoHideDuration={4200} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
            {snackbarMessage}
            <LinearProgressCountdown
                totalDuration={4000}
                direction={"down"}
            />
            </Alert>
            
        </Snackbar>   
    </Stack>
}
