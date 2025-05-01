import {
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {useRouter} from "next/navigation";

import {GetCourseRoute} from "@/app/api/courses/get/routeSchema";
import {Course} from "@/app/api/courses/get/types";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {GoalsSection} from "@/components/home/GoalsSection";
import {ProgressSection} from "@/components/home/ProgressSection";
import {ResourcesSection} from "@/components/home/ResourcesSection";
import {SkillTreeSection} from "@/components/home/SkillTreeSection";
import {
  SuggestedLearningSection,
} from "@/components/home/SuggestedLearningSection";
import {WelcomeText} from "@/components/home/WelcomeText";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Edit,
  Lock,
} from "@mui/icons-material";
import {
  Button,
  Grid,
  Stack,
} from "@mui/material";

export default function CourseHomeTab({ courseId }: { courseId: string }) {
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const { rsnUserId } = useRsnUser();
    const { sb } = useSupabase();

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const result = await GetCourseRoute.call({
                    courseId: courseId,
                });
                if (result.data?.courses.length && result.data?.courses.length > 0) {
                    setCourse(result.data?.courses[0]);
                }
                else {
                    console.error('No course with id ' + courseId + ' found');
                }
            } catch (error) {
                console.error('Error fetching course:', error);
            }
        };

        fetchCourse();
    }, [courseId]);

    const canEdit = course?.canEdit;

    const trackCourseVisit = async () => {
        if (!rsnUserId) {
            console.log("User not authenticated, skipping course visit tracking");
            return;
        }

        try {
            const { data, error } = await sb
                .from('user_history')
                .upsert({
                    rsn_user_id: rsnUserId,
                    course_id: courseId,
                    created_by: rsnUserId,
                    updated_by: rsnUserId,
                }, {
                    onConflict: 'rsn_user_id, course_id'
                })
                .select();

            if (error) {
                console.error("Error tracking course visit:", error);
            } else {
                console.log("Course visit tracked successfully:", data);
            }
        } catch (error) {
            console.error("Error tracking course visit:", error);
        }
    };

    useEffect(() => {
        trackCourseVisit();
    }, [courseId, rsnUserId]);

    if (!course) {
        return <Stack>
            <Txt>Loading...</Txt>
        </Stack>
    }

    return (
        <Stack sx={{ width: '100%' }}>
            {/* Top Section */}
            <Stack
                sx={{
                    width: '100%',
                    pt: 2,
                    pb: 6,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                }}
            >
                <Stack
                    direction="row"
                    sx={{
                        width: '100%',
                        justifyContent: 'flex-end',
                        px: 3,
                        mb: 2
                    }}
                >
                    {canEdit ? (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => router.push(`/app/courses/${courseId}/edit`)}
                        >
                            Edit Course
                        </Button>
                    ) : (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Lock color="action" />
                            <Txt color="text.secondary" variant="body2">
                                View Only - Contact course owner for edit access
                            </Txt>
                        </Stack>
                    )}
                </Stack>

                <Stack
                    spacing={2}
                    sx={{
                        width: {
                            xs: '95%', // Below 600px
                            sm: '85%', // 600px and up
                            md: '70%'  // 900px and up
                        },
                        minWidth: {
                            xs: 'auto',
                            sm: 'auto',
                            md: '700px'
                        },
                        position: 'relative',
                        mx: 'auto',
                    }}
                >
                    <WelcomeText skillId={course?.rootSkillId} isCourse={true} />
                    <SuggestedLearningSection course={course} />
                </Stack>
            </Stack>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Stack
                        sx={{
                            width: '100%',
                            pb: 8,
                            px: { xs: 2, sm: 3, md: 4 },
                        }}
                    >
                        <Stack
                            sx={{
                                width: '100%',
                                maxWidth: '1200px',
                                mx: 'auto',
                            }}
                        >
                            <Grid container spacing={4}>
                                {/* Left Column */}
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={2}>
                                        <GoalsSection skillId={course?.rootSkillId} />
                                        <ResourcesSection courseId={courseId} />
                                    </Stack>
                                </Grid>

                                {/* Right Column */}
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={3}>
                                        <Stack spacing={2}>
                                            <ProgressSection skillId={course?.rootSkillId} />
                                            <SkillTreeSection skillId={course?.rootSkillId} />
                                        </Stack>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Stack>
                    </Stack>
                </motion.div>
            </AnimatePresence>
        </Stack>
    );
}