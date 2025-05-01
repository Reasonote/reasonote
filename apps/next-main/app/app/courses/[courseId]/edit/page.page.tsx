'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SimpleHeader } from "@/components/headers/SimpleHeader";
import { Txt } from "@/components/typography/Txt";
import { Button, Card, Stack, Tab, Tabs, Paper, Box, CircularProgress, TextField, IconButton, CardMedia, Divider } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { GetCourseRoute } from "@/app/api/courses/get/routeSchema";
import { SkillTreeEditor } from "@/components/courses/SkillTreeEditor";
import { LessonPlanner, LessonPlannerLesson } from "@/components/courses/LessonPlanner";
import { useSupabase } from "@/components/supabase/SupabaseProvider";
import { Edit, Save, Cancel, Visibility, Share, ArrowBack, AddPhotoAlternate } from "@mui/icons-material";
import { ResourcesSection } from "@/components/home/ResourcesSection";
import { ShareModal } from "@/components/modals/ShareModal/ShareEntityModal";
import { UploadCourseCoverImageRoute } from "@/app/api/courses/upload_cover_image/routeSchema";
import { Course, Lesson } from "@/app/api/courses/get/types";

type TabValue = 'info' | 'skill_tree' | 'lesson_planning';

export default function CourseEditPage({ params }: { params: { courseId: string } }) {
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState<TabValue>('skill_tree');
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [generatedLessons, setGeneratedLessons] = useState<LessonPlannerLesson[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { sb } = useSupabase();
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(course?.name || '');
    const [editedOutline, setEditedOutline] = useState(course?.description || '');
    const [shareModalOpen, setShareModalOpen] = useState(false);

    const [uploadingCover, setUploadingCover] = useState(false);

    // Fetch course data
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const result = await GetCourseRoute.call({
                    courseId: params.courseId,
                });
                setCourse(result.data?.courses[0] as Course);

                // Initialize lessons from course data with their IDs and order
                const lessons = result.data?.courses[0]?.lessons || [];
                setGeneratedLessons(lessons.map((lesson: Lesson) => ({
                    id: lesson.id,
                    name: lesson.name,
                    description: lesson.description,
                    rootSkillId: lesson.rootSkillId,
                    isNew: false,
                    orderIndex: lesson.orderIndex || 0
                })));
            } catch (error) {
                console.error('Error fetching course:', error);
                setError('Failed to load course');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [params.courseId, sb]);

    useEffect(() => {
        if (course) {
            setEditedName(course.name);
            setEditedOutline(course.description || '');
        }
    }, [course]);

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await sb.from('course').update({
                _name: editedName,
                _description: editedOutline,
            }).eq('id', params.courseId);

            setCourse(prev => ({
                ...prev!,
                name: editedName,
                description: editedOutline
            }));
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCoverImageUpload = async (file: File) => {
        try {
            setUploadingCover(true);

            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
            });
            reader.readAsDataURL(file);
            const base64Data = await base64Promise;

            // Upload the file
            await UploadCourseCoverImageRoute.call({
                courseId: params.courseId,
                fileName: file.name,
                fileType: file.type,
                fileData: base64Data,
            });

            // Refresh course data
            const result = await GetCourseRoute.call({
                courseId: params.courseId,
            });
            setCourse(result.data?.courses[0] as Course);
        } catch (error) {
            console.error('Error uploading cover image:', error);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleLessonSkillSelected = (skillId: string) => {
        setSelectedNodes([skillId]);
    };

    const renderTabContent = () => {
        if (!course?.rootSkillId) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Txt>No skill tree available for this course</Txt>
                </Box>
            );
        }

        switch (currentTab) {
            case 'info':
                return (
                    <Stack spacing={3}>
                        <Card sx={{ p: 3 }}>
                            <Stack spacing={3}>
                                <Stack spacing={2}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            maxWidth: 400,
                                            aspectRatio: '16/9',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            bgcolor: 'action.hover',
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            image={course?.coverImageUrl || '/static/images/Reasonote-Icon-1.png'}
                                            alt={course?.coverImageUrl ? "Course cover" : "Reasonote logo"}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: course?.coverImageUrl ? 'cover' : 'contain',
                                                p: course?.coverImageUrl ? 0 : 4,
                                            }}
                                        />
                                    </Box>

                                    <Box>
                                        <input
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="cover-image-upload"
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleCoverImageUpload(file);
                                                }
                                            }}
                                        />
                                        <label htmlFor="cover-image-upload">
                                            <Button
                                                component="span"
                                                variant="outlined"
                                                disabled={uploadingCover}
                                                startIcon={uploadingCover ? <CircularProgress size={20} /> : <AddPhotoAlternate />}
                                            >
                                                {uploadingCover ? 'Uploading...' : (course?.coverImageUrl ? 'Change Cover Image' : 'Add Cover Image')}
                                            </Button>
                                        </label>
                                    </Box>
                                </Stack>

                                <Divider />

                                {isEditing ? (
                                    <>
                                        <TextField
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            label="Course Name"
                                            fullWidth
                                        />
                                        <TextField
                                            value={editedOutline}
                                            onChange={(e) => setEditedOutline(e.target.value)}
                                            label="Course Outline"
                                            multiline
                                            rows={4}
                                            fullWidth
                                        />
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                onClick={() => setIsEditing(false)}
                                                startIcon={<Cancel />}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSaveDetails}
                                                variant="contained"
                                                startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </Stack>
                                    </>
                                ) : (
                                    <Stack spacing={2}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Txt variant="h5">{course?.name}</Txt>
                                            <IconButton onClick={() => setIsEditing(true)} size="small">
                                                <Edit />
                                            </IconButton>
                                        </Stack>
                                        <Stack spacing={1}>
                                            <Txt variant="body1" color="text.secondary">
                                                {course?.description || 'No course outline yet. Click edit to add one.'}
                                            </Txt>
                                        </Stack>
                                    </Stack>
                                )}
                            </Stack>
                        </Card>

                        <Card sx={{ p: 3 }}>
                            <Stack spacing={2}>
                                <ResourcesSection courseId={params.courseId} />
                            </Stack>
                        </Card>
                    </Stack>
                );
            case 'skill_tree':
                return (
                    <Box sx={{ height: '100%', minHeight: 0, flex: 1 }}>
                        <SkillTreeEditor
                            rootSkillId={course?.rootSkillId}
                            onSkillTreeChange={() => {
                                // Optionally refresh data
                            }}
                            courseId={params.courseId}
                        />
                    </Box>
                );
            case 'lesson_planning':
                return (
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        height: '100%',
                        minHeight: 0
                    }}>
                        {/* Left side: Skill Tree */}
                        <Box sx={{
                            flex: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}>
                            <Stack spacing={1} p={2}>
                                <Txt variant="h6">Select Skills for Lessons</Txt>
                            </Stack>
                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                <SkillTreeEditor
                                    rootSkillId={course?.rootSkillId}
                                    onSkillTreeChange={() => { }}
                                    disableEditing={true}
                                    initialSelectedNodes={selectedNodes}
                                    onSelectionChange={setSelectedNodes}
                                    existingLessons={generatedLessons}
                                />
                            </Box>
                        </Box>

                        {/* Right side: Lesson Planner */}
                        <Box sx={{
                            flex: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Box sx={{ flex: 1, overflow: 'auto' }}>
                                <LessonPlanner
                                    rootSkill={course?.rootSkillId}
                                    selectedSkills={selectedNodes}
                                    onLessonsGenerated={(lessons: LessonPlannerLesson[]) => {
                                        setGeneratedLessons(lessons.map(l => ({
                                            ...l,
                                            orderIndex: l.orderIndex ?? 0
                                        })));
                                    }}
                                    existingLessons={generatedLessons}
                                    courseId={params.courseId}
                                    onLessonSkillSelected={handleLessonSkillSelected}
                                />
                            </Box>
                        </Box>
                    </Box>
                );
        }
    };

    if (loading) {
        return (
            <Paper sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Paper>
        );
    }

    if (!course) {
        return (
            <Paper sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Txt>Course not found</Txt>
            </Paper>
        );
    }

    if (!course.canEdit) {
        return (
            <Paper sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack spacing={2}>
                    <Txt>You do not have edit permission for this course</Txt>
                    <Stack direction="row" spacing={2}>
                        <Button
                            onClick={() => router.push(`/app/courses/${params.courseId}/view`)}
                            variant="contained"
                            startIcon={<Visibility />}
                        >
                            View Course
                        </Button>
                        <Button
                            onClick={() => router.push(`/app/courses`)}
                            variant="contained"
                            startIcon={<ArrowBack />}
                        >
                            Back to Courses
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper sx={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'  // Prevent outer scroll
        }}>
            {/* Fixed Header */}
            <SimpleHeader
                leftContent={<Txt variant="h4">{course?.name}</Txt>}
                rightContent={
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                    >
                        <Txt
                            variant="body2"
                            color="text.secondary"
                            sx={{ pt: 0.5 }}
                        >
                            {course?.updatedDate ? `Updated ${formatDistanceToNow(new Date(course.updatedDate), { addSuffix: true })}` : ''}
                        </Txt>
                        <Button
                            variant="outlined"
                            startIcon={<Share />}
                            onClick={() => setShareModalOpen(true)}
                        >
                            Share Course
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => router.push(`/app/courses/${params.courseId}/view`)}
                        >
                            View Course
                        </Button>
                    </Stack>
                }
            />

            {/* Fixed Tabs */}
            <Tabs
                value={currentTab}
                onChange={(_, newValue) => setCurrentTab(newValue)}
                sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label="Course Info" value="info" />
                <Tab label="Skill Tree" value="skill_tree" />
                <Tab label="Lesson Planning" value="lesson_planning" />
            </Tabs>

            {error && (
                <Card sx={{ p: 2, bgcolor: 'error.light', mx: 2, my: 1 }}>
                    <Txt color="error">{error}</Txt>
                </Card>
            )}

            {/* Scrollable Content Area */}
            <Box sx={{
                flex: 1,
                overflow: 'auto',
                minHeight: 0,
                p: 2
            }}>
                {renderTabContent()}
            </Box>

            <ShareModal
                open={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                entityId={params.courseId}
                entityName={course?.name || ''}
                entityType="course"
                entityDirectLink={`${window.location.origin}/app/courses/${params.courseId}/view`}
            />
        </Paper>
    );
} 