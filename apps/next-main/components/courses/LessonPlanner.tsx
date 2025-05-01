'use client'
import { useState, useEffect } from "react";
import {
    Stack,
    Card,
    Button,
    CircularProgress,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Chip,
    Skeleton,
    Snackbar,
    Alert,
    ListItem,
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Txt } from "@/components/typography/Txt";
import { AutoAwesome, Edit, Delete, Save, Cancel, Add, DragIndicator, Settings } from "@mui/icons-material";
import { aib } from "@/clientOnly/ai/aib";
import { z } from "zod";
import { SetCourseLessonsRoute } from "@/app/api/courses/set_lessons/routeSchema";
import { useSkillTree } from "@/clientOnly/hooks/useSkillTree";
import { SkillChip } from "@/components/chips/SkillChip/SkillChip";
import { useRouter } from "next/navigation";
import { Lesson } from "@/app/api/courses/get/types";

interface LessonPlannerProps {
    rootSkill: string;
    selectedSkills: string[];
    onLessonsGenerated: (lessons: LessonPlannerLesson[]) => void;
    existingLessons?: LessonPlannerLesson[];
    courseId: string;
    onLessonSkillSelected?: (skillId: string) => void;
}

function findSkillInTree(skill_identifier: string, tree: any, byId: boolean = true): any {
    if (byId) {
        return tree.skills.find(skill => skill.id === skill_identifier);
    } else {
        return tree.skills.find(skill => skill.name === skill_identifier);
    }
}

export interface LessonPlannerLesson extends Lesson {
    rootSkill?: string;
    isNew?: boolean;
    isDeleted?: boolean;
    isLoading?: boolean;
}

interface EditLessonDialogProps {
    open: boolean;
    onClose: () => void;
    lesson: LessonPlannerLesson;
    onSave: (updatedLesson: LessonPlannerLesson) => void;
}

async function generateLessonWithAI(skillData: any, skillTree: any) {
    const response = await aib.genObject({
        schema: z.object({
            lessons: z.array(z.object({
                name: z.string(),
                description: z.string(),
            })),
        }),
        prompt: `
            <INSTRUCTIONS>
                Create a lesson for this specific skill from our skill tree.
            </INSTRUCTIONS>

            <SELECTED_SKILL>
                ${JSON.stringify(skillData, null, 2)}
            </SELECTED_SKILL>

            <SKILL_TREE>
                ${JSON.stringify(skillTree, null, 2)}
            </SKILL_TREE>

            <FORMAT>
                - Create one focused lesson for this skill
                - Include practical exercises or examples in the summary
                - Make the name concise but descriptive
            </FORMAT>
        `,
        model: 'openai:gpt-4o-mini',
    });

    if (response.object.lessons.length === 0) {
        throw new Error('No lessons generated');
    }

    return response.object.lessons[0];
}

function EditLessonDialog({ open, onClose, lesson, onSave }: EditLessonDialogProps) {
    const router = useRouter();
    const [name, setName] = useState(lesson.name);
    const [description, setDescription] = useState(lesson.description);
    const [rootSkill, setRootSkill] = useState(lesson.rootSkill);
    const [rootSkillId, setRootSkillId] = useState(lesson.rootSkillId);
    const [isGenerating, setIsGenerating] = useState(false);
    const { data: skillTree } = useSkillTree({ id: rootSkillId || '' });

    const handleSave = () => {
        onSave({
            ...lesson,
            name,
            description,
            rootSkill,
            rootSkillId,
        });
        onClose();
    };

    const handleAutoFill = async () => {
        if (!skillTree || !rootSkillId) return;

        setIsGenerating(true);
        try {
            const selectedSkill = findSkillInTree(rootSkillId, skillTree);
            const generated = await generateLessonWithAI(selectedSkill, skillTree);
            setName(generated.name);
            setDescription(generated.description);
        } catch (error) {
            console.error('Error generating lesson content:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Track if there are changes
    const hasChanges = name !== lesson.name ||
        description !== lesson.description ||
        rootSkill !== lesson.rootSkill;

    // Reset form when dialog opens with new lesson
    useEffect(() => {
        setName(lesson.name);
        setDescription(lesson.description);
        setRootSkill(lesson.rootSkill);
    }, [lesson]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
                        onClick={handleAutoFill}
                        disabled={isGenerating || !rootSkillId}
                        fullWidth
                    >
                        {isGenerating ? 'Generating...' : 'Auto-fill with AI'}
                    </Button>
                    <TextField
                        label="Lesson Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        disabled={isGenerating}
                    />
                    <TextField
                        label="Summary"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        disabled={isGenerating}
                    />
                    <Box>
                        <Txt color="text.secondary" gutterBottom>Associated Skill</Txt>
                        <SkillChip
                            topicOrId={rootSkillId || rootSkill || ''}
                            disableModal
                            disableAddDelete
                            disableLevelIndicator
                            size="small"
                            sx={{ maxWidth: 'fit-content' }}
                        />
                    </Box>
                    {lesson.id && !lesson.id.startsWith('new-') && (
                        <Button
                            variant="outlined"
                            startIcon={<Settings />}
                            onClick={() => {
                                onClose();
                                router.push(`/app/lessons/${lesson.id}/edit`);
                            }}
                            fullWidth
                        >
                            Edit Lesson Details
                        </Button>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} startIcon={<Cancel />}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    startIcon={<Save />}
                    variant="contained"
                    disabled={!hasChanges}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const SkeletonLesson = () => (
    <Card>
        <Stack gap={2} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                    <DragIndicator sx={{ color: 'text.disabled' }} />
                    <Stack spacing={1}>
                        <Skeleton variant="text" width={200} height={32} />
                        <Skeleton variant="rounded" width={100} height={24} />
                    </Stack>
                </Stack>
                <Stack direction="row" spacing={1}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="circular" width={40} height={40} />
                </Stack>
            </Stack>
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="text" width="80%" height={24} />
        </Stack>
    </Card>
);

export function LessonPlanner({ rootSkill, selectedSkills, onLessonsGenerated, existingLessons = [], courseId, onLessonSkillSelected }: LessonPlannerProps) {
    const [lessons, setLessons] = useState<LessonPlannerLesson[]>(existingLessons || []);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingSelected, setIsGeneratingSelected] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonPlannerLesson | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const { data: skillTree } = useSkillTree({ id: rootSkill });
    const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

    // Initialize lessons with existing lessons when they change
    useEffect(() => {
        const sortedLessons = [...existingLessons].sort((a, b) =>
            (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );
        setLessons(sortedLessons);
    }, [existingLessons]);

    const handleCloseError = () => {
        setSaveError(null);
    };

    // Auto-save setup
    useEffect(() => {
        // Clear existing timer if any
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        // Set new timer for 10 minutes
        const timer = setTimeout(() => {
            handleSaveChanges(lessons);
        }, 10 * 60 * 1000);
        setAutoSaveTimer(timer);

        // Cleanup
        return () => {
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }
        };
    }, [lessons]);

    const handleSaveChanges = async (lessonsToSave: LessonPlannerLesson[]) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const result = await SetCourseLessonsRoute.call({
                courseId,
                lessons: lessonsToSave.map(lesson => ({
                    id: lesson.id,
                    name: lesson.name,
                    description: lesson.description,
                    rootSkillId: (lesson.rootSkillId ? lesson.rootSkillId : lesson.rootSkill ? findSkillInTree(lesson.rootSkill, skillTree, false)?.id : ''),
                    orderIndex: lesson.orderIndex
                }))
            });

            if (!result.data) {
                throw new Error(result.error || 'Failed to save lessons');
            }

            setLessons(result.data?.lessons || []);
            onLessonsGenerated(result.data?.lessons || []);
            setSaveSuccess(true);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Failed to save lessons');
            console.error('Error saving lessons:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAuto = async () => {
        setIsGenerating(true);
        try {
            const response = await aib.genObject({
                schema: z.object({
                    lessons: z.array(z.object({
                        name: z.string(),
                        description: z.string(),
                        rootSkill: z.string(),
                    })),
                }),
                prompt: `
                    <INSTRUCTIONS>
                        Create a series of lessons based on this skill tree. Each lesson should focus on teaching one or more related skills.
                    </INSTRUCTIONS>

                    <SKILL_TREE>
                        ${JSON.stringify(skillTree, null, 2)}
                    </SKILL_TREE>

                    <FORMAT>
                        - Each lesson should have a clear, specific focus
                        - Lessons should build upon each other logically
                        - Include practical exercises or examples in summaries
                        - Root skill for each lesson should be the main skill being taught
                        - 1-2 lessons per major skill branch
                    </FORMAT>
                `,
                model: 'openai:gpt-4o-mini',
            });

            const newLessons = response.object.lessons.map((lesson, idx) => ({
                ...lesson,
                rootSkillId: findSkillInTree(lesson.rootSkill, skillTree, false)?.id || '',
                orderIndex: lessons.length + idx,
                id: `new-${idx}`,
                isNew: true
            }));

            console.log("newLessons", newLessons);
            setLessons([...lessons, ...newLessons]);
            onLessonsGenerated([...lessons, ...newLessons]);
        } catch (error) {
            console.error('Error generating lessons:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateSelected = async () => {
        if (selectedSkills.length === 0) return;

        setIsGeneratingSelected(true);
        // Add skeleton lessons for each selected skill
        const skeletonLessons = selectedSkills.map((_, idx) => ({
            id: `skeleton-${idx}`,
            name: "",
            description: "",
            rootSkillId: "",
            isLoading: true,
            orderIndex: lessons.length + idx
        }));

        setLessons([...lessons, ...skeletonLessons]);

        try {
            const generatedLessons = await Promise.all(
                selectedSkills.map(async (skillId) => {
                    const selectedSkill = findSkillInTree(skillId, skillTree);
                    const generated = await generateLessonWithAI(selectedSkill, skillTree);
                    return {
                        ...generated,
                        id: `new-${lessons.length + selectedSkills.indexOf(skillId)}`,
                        rootSkillId: skillId,
                        rootSkill: selectedSkill?.name || '',
                        orderIndex: lessons.length + selectedSkills.indexOf(skillId),
                        isNew: true
                    };
                })
            );

            // Remove skeleton lessons and add real ones
            setLessons([
                ...lessons.filter(l => !l.isLoading),
                ...generatedLessons
            ]);
            onLessonsGenerated([
                ...lessons.filter(l => !l.isLoading),
                ...generatedLessons
            ]);
        } catch (error) {
            // On error, remove skeleton lessons
            setLessons(lessons.filter(l => !l.isLoading));
            console.error('Error generating lessons:', error);
        } finally {
            setIsGeneratingSelected(false);
        }
    };

    const handleDeleteLesson = (index: number) => {
        const newLessons = lessons.filter((_, i) => i !== index);
        setLessons(newLessons);

        if (newLessons.length === 0) {
            handleSaveChanges(newLessons);
        }
    };

    const handleEditLesson = (index: number, updatedLesson: LessonPlannerLesson) => {
        const newLessons = lessons.map((lesson, i) =>
            i === index ? updatedLesson : lesson
        );
        setLessons(newLessons);
        onLessonsGenerated(newLessons);
    };

    const handleAddManualLesson = () => {

        console.log("selectedSkills", selectedSkills);
        console.log("rootSkill", rootSkill);
        const newLesson: LessonPlannerLesson = {
            id: `new-${lessons.length}`,
            name: "",
            description: "",
            rootSkill: findSkillInTree(selectedSkills[0] || rootSkill, skillTree)?.name || '',
            rootSkillId: selectedSkills[0] || rootSkill,
            orderIndex: lessons.length,
            isNew: true
        };
        setLessons([...lessons, newLesson]);
        setEditingLesson(newLesson);
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const newLessons = Array.from(lessons);
        const [reorderedLesson] = newLessons.splice(result.source.index, 1);
        newLessons.splice(result.destination.index, 0, reorderedLesson);

        // Update order indices
        const updatedLessons = newLessons.map((lesson, idx) => ({
            ...lesson,
            orderIndex: idx
        }));

        setLessons(updatedLessons);
        onLessonsGenerated(updatedLessons);
    };

    // Add this effect to scroll to and highlight selected lesson
    useEffect(() => {
        if (selectedSkills.length === 1) {
            const selectedSkillId = selectedSkills[0];
            const lessonIndex = lessons.findIndex(lesson => lesson.rootSkillId === selectedSkillId);

            if (lessonIndex !== -1) {
                // Find the lesson element and scroll to it
                const lessonElement = document.getElementById(`lesson-${lessonIndex}`);
                if (lessonElement) {
                    lessonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }, [selectedSkills, lessons]);

    const handleLessonClick = (lesson: LessonPlannerLesson) => {
        if (lesson.rootSkillId && onLessonSkillSelected) {
            onLessonSkillSelected(lesson.rootSkillId);
        }
    };

    return (
        <Stack spacing={2}>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    mt: -2,
                    py: 2,
                    bgcolor: 'background.default',
                }}
            >
                <Stack
                    alignItems="center"
                    spacing={1.5}
                >
                    {lessons.length === 0 ? (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AutoAwesome />}
                            onClick={handleGenerateAuto}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Generating...' : 'Auto-Generate Lessons'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
                            onClick={() => handleSaveChanges(lessons)}
                            disabled={isSaving}
                            sx={{
                                minWidth: 200,
                                bgcolor: saveSuccess ? 'success.main' : undefined,
                                '&:hover': {
                                    bgcolor: saveSuccess ? 'success.dark' : undefined
                                },
                                transition: 'background-color 0.3s'
                            }}
                            color={saveError ? "error" : "primary"}
                        >
                            {isSaving ? 'Saving...' :
                                saveSuccess ? 'Saved!' :
                                    'Save Changes'}
                        </Button>
                    )}

                    {selectedSkills.length > 0 ? (
                        <Stack direction="row" spacing={2} justifyContent="center" width="100%">
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleAddManualLesson}
                                sx={{ minWidth: 150 }}
                            >
                                Add Manually
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={isGeneratingSelected ? <CircularProgress size={20} /> : <AutoAwesome />}
                                onClick={handleGenerateSelected}
                                disabled={isGeneratingSelected}
                                sx={{ minWidth: 150 }}
                            >
                                Generate with AI
                            </Button>
                        </Stack>
                    ) : (
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                height: 36,
                                minWidth: 300
                            }}
                        >
                            <Txt
                                color="text.secondary"
                                variant="body2"
                                align="center"
                            >
                                Select a skill in the tree on the left to add or generate lessons for it
                            </Txt>
                        </Stack>
                    )}
                </Stack>
            </Box>

            {isGenerating && (
                <Stack alignItems="center" p={2}>
                    <CircularProgress />
                </Stack>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="lessons">
                    {(provided) => (
                        <Stack
                            spacing={2}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {lessons.map((lesson, index) => (
                                <Draggable
                                    key={lesson.id || index}
                                    draggableId={lesson.id || `new-${index}`}
                                    index={index}
                                >
                                    {(provided, snapshot) => (
                                        <ListItem
                                            key={lesson.id}
                                            id={`lesson-${index}`}
                                            onClick={() => handleLessonClick(lesson)}
                                            sx={{
                                                py: 2,
                                                bgcolor: selectedSkills.includes(lesson.rootSkillId) ?
                                                    'primary.light' :
                                                    'background.paper',
                                                transition: 'background-color 0.3s ease',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    bgcolor: selectedSkills.includes(lesson.rootSkillId) ?
                                                        'primary.light' :
                                                        'action.hover'
                                                }
                                            }}
                                        >
                                            <Card
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                elevation={snapshot.isDragging ? 8 : 2}
                                                sx={{ width: '100%' }}
                                            >
                                                {lesson.isLoading ? (
                                                    <SkeletonLesson />
                                                ) : (
                                                    <Stack>
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                            {...provided.dragHandleProps}
                                                            sx={{
                                                                cursor: 'grab',
                                                                px: 2,
                                                                pt: 2
                                                            }}
                                                        >
                                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                                                                <DragIndicator
                                                                    sx={{
                                                                        color: 'text.secondary',
                                                                        opacity: 0.5,
                                                                        flexShrink: 0,
                                                                        '&:hover': {
                                                                            opacity: 1
                                                                        }
                                                                    }}
                                                                />
                                                                <Stack spacing={1} sx={{ minWidth: 0 }}>
                                                                    <Txt
                                                                        variant="h6"
                                                                        sx={{
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis'
                                                                        }}
                                                                    >
                                                                        {`${index + 1}. ${lesson.name || "New Lesson"}`}
                                                                        {lesson.isNew && (
                                                                            <Chip
                                                                                label="New"
                                                                                size="small"
                                                                                color="primary"
                                                                                sx={{ ml: 1 }}
                                                                            />
                                                                        )}
                                                                    </Txt>
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <SkillChip
                                                                            topicOrId={lesson.rootSkillId || lesson.rootSkill || ''}
                                                                            disableModal
                                                                            disableAddDelete
                                                                            disableLevelIndicator
                                                                            size="small"
                                                                            sx={{
                                                                                maxWidth: '100%',
                                                                                '& .MuiChip-label': {
                                                                                    whiteSpace: 'nowrap',
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis',
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Stack>
                                                            </Stack>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                sx={{ flexShrink: 0 }}
                                                            >
                                                                <IconButton onClick={() => setEditingLesson(lesson)}>
                                                                    <Edit />
                                                                </IconButton>
                                                                <IconButton onClick={() => handleDeleteLesson(index)}>
                                                                    <Delete />
                                                                </IconButton>
                                                            </Stack>
                                                        </Stack>
                                                        <Box sx={{ p: 2 }}>
                                                            <Txt color="text.secondary">
                                                                {lesson.description || "No description yet"}
                                                            </Txt>
                                                        </Box>
                                                    </Stack>
                                                )}
                                            </Card>
                                        </ListItem>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </Stack>
                    )}
                </Droppable>
            </DragDropContext>

            {editingLesson && (
                <EditLessonDialog
                    open={true}
                    onClose={() => setEditingLesson(null)}
                    lesson={editingLesson}
                    onSave={(updatedLesson) => {
                        const index = lessons.findIndex(l =>
                            l.name === editingLesson.name &&
                            l.description === editingLesson.description
                        );
                        if (index !== -1) {
                            handleEditLesson(index, updatedLesson);
                        }
                        setEditingLesson(null);
                    }}
                />
            )}

            <Snackbar
                open={!!saveError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseError}
                    severity="error"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {saveError}
                </Alert>
            </Snackbar>

            <Snackbar
                open={saveSuccess}
                autoHideDuration={3000}
                onClose={() => setSaveSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSaveSuccess(false)}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    Lessons saved successfully!
                </Alert>
            </Snackbar>
        </Stack>
    );
} 