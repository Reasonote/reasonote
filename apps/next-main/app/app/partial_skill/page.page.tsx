"use client";
import "@/app/utils/promisePolyfills";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  File,
  FileText,
  GraduationCap,
  Mountain,
  Plus,
  Sprout,
  Target,
  Trash2,
  TreePine,
  X,
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import posthog from "posthog-js";
import {useDropzone} from "react-dropzone";

import {
  IntegrationsDocsIngestRoute,
} from "@/app/api/integrations/docs/ingest/routeSchema";
import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {
  FillSubskillTreeRoute,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {CourseTeaserPageInner} from "@/app/app/course-teaser/CourseTeaser";
import {
  useIsPracticeV2Enabled,
} from "@/clientOnly/hooks/useIsPracticeV2Enabled";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useRsnUserSettings} from "@/clientOnly/hooks/useRsnUserSettings";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {
  ActivityTypeSelector,
} from "@/components/activity/components/ActivityTypeSelector";
import {ResourceViewerDialog} from "@/components/dialogs/ResourceViewerDialog";
import FractalTreeLoading from "@/components/icons/FractalTreeLoading";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Gamepad,
  Settings,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  ClickAwayListener,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
} from "@mui/material";
import {
  alpha,
  useTheme,
} from "@mui/material/styles";
import {ActivityTypesPublic} from "@reasonote/core";

type Level = 'beginner' | 'intermediate' | 'advanced';

type SkillData = {
    skillName: string;
    description: string;
    level: Level;
    goals: string[];
    pages: { id: string, name?: string }[];
    emoji: string;
    skillId: string | null;
};

export default function SkillCreationPage() {
    const theme = useTheme();
    const searchParams = useSearchParams();
    const partialSkillId = searchParams?.get('partialSkillId');
    const router = useRouter();
    const { sb } = useSupabase();
    const { rsnUser, userStatus } = useRsnUser();
    const isPracticeV2Enabled = useIsPracticeV2Enabled();
    const { refetch: refetchUserSkills } = useUserSkills();
    const [loading, setLoading] = useState(true);
    const [skillData, setSkillData] = useState<SkillData | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<Level>('beginner');
    const [isEditing, setIsEditing] = useState<'name' | 'description' | null>(null);
    const [editValues, setEditValues] = useState({
        name: '',
        description: ''
    });
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoal, setNewGoal] = useState('');
    const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([...ActivityTypesPublic]);
    const isSmallDevice = useIsSmallDevice();
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [selectedResourceName, setSelectedResourceName] = useState<string | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<any | null>(null);
    const [recentlyUploadedFiles, setRecentlyUploadedFiles] = useState<string[]>([]);
    const [isActivitySelectorOpen, setIsActivitySelectorOpen] = useState(false);
    const { data: userSettings } = useRsnUserSettings();
    const [showTeaser, setShowTeaser] = useState(false);
    const [teaserTopic, setTeaserTopic] = useState("");
    const [createdSkillId, setCreatedSkillId] = useState<string | null>(null);
    const [anyChanges, setAnyChanges] = useState(false);
    const [hasDeletedOldSubtopics, setHasDeletedOldSubtopics] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    useEffect(() => {
        posthog.capture('partial_skill_initial_view', {
            rsn_user_id: rsnUser?.data?.id,
            partial_skill_id: partialSkillId,
        }, {
            send_instantly: true,
        });
    }, []);

    useEffect(() => {
        if (skillData?.level) {
            setSelectedLevel(skillData.level);
        }
    }, [skillData?.level]);

    useEffect(() => {
        const fetchQueryData = async () => {
            if (!partialSkillId) return;

            try {
                setLoading(true);
                const { data: partialSkillInfo, error } = await sb
                    .from('partial_skill')
                    .select('*')
                    .eq('id', partialSkillId)
                    .single();

                if (error) throw error;

                setSkillData({
                    skillName: partialSkillInfo.skill_name,
                    description: partialSkillInfo.skill_description,
                    level: partialSkillInfo.user_level as Level,
                    goals: partialSkillInfo.goals || [],
                    pages: partialSkillInfo.pages?.map((pageId: string) => ({ id: pageId })) || [],
                    emoji: partialSkillInfo.emoji || '',
                    skillId: partialSkillInfo.skill_id,
                });

                if (partialSkillInfo.pages) {
                    const pageIds = partialSkillInfo.pages.map((pageId: string) => pageId);
                    const { data: pagesData, error: pagesError } = await sb
                        .from('rsn_page')
                        .select('*')
                        .in('id', pageIds);

                    if (pagesError) throw pagesError;


                    const {data: snipsData, error: snipsError} = await sb
                        .from('snip')
                        .select('*')
                        .in('id', pageIds);
                    
                    if (snipsError) throw snipsError;

                    setSkillData(prev => ({
                        ...prev!,
                        pages: [
                            ...(pagesData.map((page: any) => ({ id: page.id, name: page._name })) ?? []),
                            ...(snipsData.map((snip: any) => ({ id: snip.id, name: snip._name })) ?? [])
                        ]
                    }));
                }
            } catch (error) {
                console.error('Error fetching query data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQueryData();
    }, [partialSkillId]);

    // Initialize edit values when skillData changes
    useEffect(() => {
        if (skillData) {
            setEditValues({
                name: skillData.skillName,
                description: skillData.description
            });
        }
    }, [skillData]);

    const handleSaveEdit = (field: 'name' | 'description') => {
        if (!skillData) return;

        posthog.capture('partial_skill_field_edited', {
            field_type: field,
            rsn_user_id: rsnUser?.data?.id,
            partial_skill_id: partialSkillId,
        }, {
            send_instantly: true,
        });

        const newSkillData = { ...skillData };
        if (field === 'name') {
            newSkillData.skillName = editValues.name;
        } else {
            newSkillData.description = editValues.description;
        }
        setAnyChanges(true);
        setSkillData(newSkillData);
        setIsEditing(null);
    };

    const handleAddGoal = () => {
        if (!skillData || !newGoal.trim()) return;

        posthog.capture('partial_skill_goal_added', {
            rsn_user_id: rsnUser?.data?.id,
            partial_skill_id: partialSkillId,
            is_editing: editingGoalIndex !== null,
        }, {
            send_instantly: true,
        });

        const newSkillData = { ...skillData };
        if (editingGoalIndex !== null) {
            // Editing existing goal
            newSkillData.goals = newSkillData.goals.map((goal, index) =>
                index === editingGoalIndex ? newGoal.trim() : goal
            );
        } else {
            // Adding new goal
            newSkillData.goals = [...skillData.goals, newGoal.trim()];
        }

        setAnyChanges(true);
        setSkillData(newSkillData);
        setNewGoal('');
        setIsAddingGoal(false);
        setEditingGoalIndex(null);
    };

    const handleEditGoal = (index: number) => {
        if (!skillData) return;
        setNewGoal(skillData.goals[index]);
        setEditingGoalIndex(index);
        setIsAddingGoal(true);
    };

    const handleCancelGoalEdit = () => {
        setIsAddingGoal(false);
        setEditingGoalIndex(null);
        // Only clear the input if we were editing an existing goal, not adding a new one
        if (editingGoalIndex !== null) {
            setNewGoal('');
        }
    };

    const createOrUpdateSkill = async (skillData: SkillData) => {
        if (!skillData.skillId) {
            const { data: upsertedSkill, error: upsertError } = await sb
                .from('skill')
                .upsert({
                    id: skillData.skillId || undefined,
                    _name: skillData.skillName,
                    _description: skillData.description,
                    emoji: skillData.emoji,
                })
                .select('id')
                .single();

            if (upsertError) {
                console.error('Error upserting skill:', upsertError);
                return null;
            }
            if (!skillData.skillId) {
                skillData.skillId = upsertedSkill?.id;
            }
        }

        const addSkillResp = await AddtoUserSkillSetRoute.call({
            addIds: [skillData.skillId],
            addSkillResources: skillData.pages.map((page) => ({
                pageId: page.id.startsWith('rsnpage_') ? page.id : undefined,
                snipId: page.id.startsWith('snip_') ? page.id : undefined
            })),
        });

        const skillId = addSkillResp.data?.skillIds?.[0];
        if (!skillId) {
            console.error("Failed to create skill");
            return null;
        }

        return skillId;
    };

    const handleCreateSkill = useCallback(async () => {
        if (!skillData) return;

        posthog.capture('partial_skill_creation_started', {
            rsn_user_id: rsnUser?.data?.id,
            partial_skill_id: partialSkillId,
            skill_name: skillData.skillName,
            resource_count: skillData.pages.length,
            goal_count: skillData.goals.length,
            selected_level: selectedLevel,
            activity_types: selectedActivityTypes,
        }, {
            send_instantly: true,
        });

        // If user is not logged in, create the skill first
        if (userStatus !== 'logged_in') {
            try {
                setIsCreating(true);
                const skillId = await createOrUpdateSkill(skillData);
                if (!skillId) return;

                setCreatedSkillId(skillId);
                setTeaserTopic(skillData.skillName);
                setShowTeaser(true);
            } catch (error) {
                console.error('Error creating skill:', error);
                setError('Error creating skill:' + error);
            } finally {
                setIsCreating(false);
            }
            return;
        }

        try {
            setIsCreating(true);
            const skillId = await createOrUpdateSkill(skillData);
            if (!skillId) return;

            await refetchUserSkills();

            if (!rsnUser.data?.id) {
                console.error("Could not find user id");
                return;
            }

            // Add level and goals to the user skill
            const userSkill = await sb
                .from('user_skill')
                .upsert({
                    rsn_user: rsnUser.data.id,
                    skill: skillId,
                    self_assigned_level: selectedLevel,
                    interest_reasons: skillData.goals,
                },
                    {
                        onConflict: 'rsn_user, skill',
                    }
                )
                .select('*');

            if (!userSkill.data) {
                console.warn("Could not set level and goals for created user skill");
                console.log(userSkill.error);
            }

            if (isPracticeV2Enabled) {
                // Do not await this
                FillSubskillTreeRoute.call({
                    skill: {
                        id: skillId,
                    },
                });

                // Redirect to v2 practice
                router.push(`/app/skills/${skillId}/practice_v2?allowedActivityTypes=${selectedActivityTypes.join(',')}`);
            } else {
                const result = await FillSubskillTreeRoute.call({
                    skill: {
                        id: skillId,
                    },
                });

                if (result.error) {
                    console.warn("Error filling subskill tree:", result.error);
                }

                // Redirect to practice page
                router.push(`/app/skills/${skillId}/practice/practice?type=review-pinned&allowedActivityTypes=${selectedActivityTypes.join(',')}`);
            }
            posthog.capture('partial_skill_creation_completed', {
                rsn_user_id: rsnUser?.data?.id,
                partial_skill_id: partialSkillId,
                created_skill_id: skillId,
            }, {
                send_instantly: true,
            });
        } catch (error) {
            posthog.capture('partial_skill_creation_failed', {
                rsn_user_id: rsnUser?.data?.id,
                partial_skill_id: partialSkillId,
                error: String(error),
            }, {
                send_instantly: true,
            });
            console.error('Error creating skill:', error);
            setIsCreating(false);
            setError('Error creating skill:' + error);
        }
    }, [skillData, rsnUser, selectedLevel, selectedActivityTypes, router, refetchUserSkills]);

    // Helper to ensure document IDs have the correct prefix if needed
    const ensureIdHasPrefix = (id: string, type: 'page' | 'snippet' = 'page'): string => {
        // If the ID already has a prefix, return it as is
        if (id.startsWith('rsnpage_') || id.startsWith('snip_')) {
            return id;
        }

        // Only add a prefix if it doesn't already have one
        if (type === 'page') {
            return `rsnpage_${id}`;
        } else if (type === 'snippet') {
            return `snip_${id}`;
        }

        // Default to page type if not specified
        return `rsnpage_${id}`;
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        posthog.capture('partial_skill_resources_uploaded', {
            rsn_user_id: rsnUser?.data?.id,
            partial_skill_id: partialSkillId,
            file_count: acceptedFiles.length,
            file_types: acceptedFiles.map(f => f.type),
        }, {
            send_instantly: true,
        });

        setIsUploading(true);
        setUploadError(null);
        setSkillData(prev => ({
            ...prev!,
            pages: [...(prev?.pages || []), ...acceptedFiles.map((f, index) => ({ id: 'temp_' + index, name: f.name }))]
        }));
        setUploadingFiles([...acceptedFiles.map((f, index) => 'temp_' + index)]);

        const formData = new FormData();
        for (const file of acceptedFiles) {
            formData.append("files", file);
        }

        try {
            const response = await IntegrationsDocsIngestRoute.call({}, undefined, formData);
            const data = response.data;
            if (data?.documents) {
                // Make sure new page IDs have the correct prefix
                const pages = data.documents.map(doc => ({
                    id: doc.pageId,
                    name: doc.title
                }));

                // Update skillData with new pages
                setSkillData(prev => ({
                    ...prev!,
                    pages: [...(prev?.pages.filter(page => !page.id.startsWith('temp_')) || []), ...pages],
                    nameDescriptionPagesChanged: true
                }));

                // Clear uploading state and set success state
                setUploadingFiles([]);
                setRecentlyUploadedFiles(pages.map(page => page.id));

                // Clear the recently uploaded files after 3 seconds
                setTimeout(() => {
                    setRecentlyUploadedFiles([]);
                }, 3000);
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred during upload';
            setUploadError('Error uploading documents: ' + errorMessage);
            setSkillData(prev => ({
                ...prev!,
                pages: prev?.pages.filter(page => !page.id.startsWith('temp_')) || []
            }));
        } finally {
            setIsUploading(false);
            setUploadingFiles([]);
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        noClick: false,
    });

    const handleViewResource = async (pageId: string) => {
        try {
            // Determine which table to query based on ID prefix
            if (pageId.startsWith('rsnpage_') || !pageId.startsWith('snip_')) {
                // Query the rsn_page table
                const { data: pageData, error } = await sb
                    .from('rsn_page')
                    .select('*')
                    .eq('id', pageId)
                    .single();

                if (error) throw error;

                setSelectedResourceName(pageData._name || pageData.original_filename || '');
                setViewerOpen(true);

                // If it's a PDF, get the URL
                if (pageData.file_type?.includes('pdf')) {
                    const { data: downloadData, error: downloadError } = await sb.storage
                        .from('attachment-uploads')
                        .createSignedUrl(pageData.storage_path || '', 300);

                    if (downloadError) throw downloadError;
                    setPdfUrl(downloadData?.signedUrl || null);
                }
            } else if (pageId.startsWith('snip_')) {
                // Query the snip table
                const { data: snippetData, error } = await sb
                    .from('snip')
                    .select('*')
                    .eq('id', pageId)
                    .single();

                if (error) throw error;

                setSelectedResourceName(snippetData._name || 'Snippet');
                setViewerOpen(true);
                setPdfUrl(null); // Snippets don't have PDF URLs
            }
        } catch (error) {
            console.error('Error fetching resource:', error);
            setUploadError('Error loading resource');
        }
    };

    const handleCloseViewer = () => {
        setViewerOpen(false);
        setSelectedResourceName(null);
        setPdfUrl(null);
    };

    const handleDeleteResource = (pageId: string) => {
        const resource = skillData?.pages.find(page => page.id === pageId);
        if (!resource) return;

        setResourceToDelete(pageId);
        setDeleteConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!resourceToDelete || !skillData) return;

        setSkillData({
            ...skillData,
            pages: skillData.pages.filter(page => page.id !== resourceToDelete),
        });

        setAnyChanges(true);
        setDeleteConfirmOpen(false);

        try {
            if (resourceToDelete.startsWith('rsnpage_')) {
                await sb.from('rsn_page').delete().eq('id', resourceToDelete);
            } else if (resourceToDelete.startsWith('snip_')) {
                await sb.from('snip').delete().eq('id', resourceToDelete);
            } else {
                // If no prefix, try rsn_page first, then try snip if that fails
                try {
                    await sb.from('rsn_page').delete().eq('id', resourceToDelete);
                } catch (e) {
                    try {
                        await sb.from('snip').delete().eq('id', resourceToDelete);
                    } catch (innerError) {
                        console.error('Could not delete resource from either table', innerError);
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
            setUploadError('Error deleting resource');
        }

        setResourceToDelete(null);
    };

    useEffect(() => {
        const deleteOldSubtopics = async () => {
            if (anyChanges && !hasDeletedOldSubtopics && skillData?.skillId) {
                console.log('Deleting old subtopics because we have updates to the skill');
                const { data: deletedLinks } = await sb
                    .from('skill_link')
                    .delete()
                    .eq('downstream_skill', skillData.skillId)
                    .eq('_type', 'subtopic')
                    .select('upstream_skill');

                if (deletedLinks?.length) {
                    await sb
                        .from('skill')
                        .delete()
                        .in('id', deletedLinks.map(link => link.upstream_skill));
                }
                setHasDeletedOldSubtopics(true);
            }
        };
        deleteOldSubtopics();
    }, [anyChanges, skillData?.skillId, hasDeletedOldSubtopics]);

    const renderEditableField = (
        field: 'name' | 'description',
        value: string,
        variant: "h6" | "h5" | "body1"
    ) => {
        const isEditable = isEditing === field;
        const editValue = field === 'name' ? editValues.name : editValues.description;

        const handleCancel = () => {
            setIsEditing(null);
        };

        const maxRows = isSmallDevice ? 3 : 5;
        const maxHeight = isSmallDevice ? '150px' : '200px';

        return (
            <Box sx={{ position: 'relative', mb: 2, maxHeight: maxHeight }}>
                {isEditable ? (
                    <ClickAwayListener onClickAway={handleCancel}>
                        <Stack spacing={isSmallDevice ? 1 : 2} sx={{ maxHeight: maxHeight }}>
                            <TextField
                                multiline
                                value={editValue}
                                onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    [field]: e.target.value
                                }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSaveEdit(field);
                                    } else if (e.key === 'Escape') {
                                        handleCancel();
                                    }
                                }}
                                variant="outlined"
                                fullWidth
                                autoFocus
                                maxRows={maxRows}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        width: '100%',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontSize: field === 'name' ? '1.5rem' : '1rem',
                                        lineHeight: 1.2,
                                        padding: field === 'name' ? '6px 10px' : undefined,
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        ...(field === 'name' && {
                                            padding: '2px 0',
                                        }),
                                    },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'divider',
                                    },
                                }}
                            />
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    size="small"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleSaveEdit(field)}
                                >
                                    Save
                                </Button>
                            </Stack>
                        </Stack>
                    </ClickAwayListener>
                ) : (
                    <Box sx={{ position: 'relative', display: 'flex' }}>
                        <Stack
                            direction="row"
                            alignItems="flex-start"
                            spacing={2}
                            maxHeight={maxHeight}
                            overflow="auto"
                            sx={{
                                flex: 1,
                                mr: 3,
                                scrollbarWidth: 'thin',
                                scrollbarColor: (theme) => `${theme.palette.divider} transparent`,
                                '&::-webkit-scrollbar': {
                                    width: '4px',
                                    display: 'block',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: 'transparent',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: (theme) => theme.palette.divider,
                                    borderRadius: '4px',
                                },
                            }}
                        >
                            {field === 'name' && (
                                <Txt
                                    variant={variant}
                                    sx={{
                                        fontSize: skillData?.emoji ? '2rem' : undefined,
                                        lineHeight: 1,
                                    }}
                                >
                                    {skillData?.emoji}
                                </Txt>
                            )}
                            <Txt
                                variant={variant}
                                sx={{
                                    flex: 1,
                                    ...(field === 'description' && { color: 'text.secondary' }),
                                    ...(field === 'name' && {
                                        fontWeight: 600,
                                        lineHeight: 1.2,
                                        my: 0.5,
                                    }),
                                }}
                            >
                                {value}
                            </Txt>
                        </Stack>
                        <IconButton
                            size="small"
                            onClick={() => setIsEditing(field)}
                            sx={{
                                position: 'absolute',
                                right: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'text.secondary',
                                opacity: 0.4,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    opacity: 1,
                                    bgcolor: 'action.hover',
                                }
                            }}
                        >
                            <Edit2 size={16} />
                        </IconButton>
                    </Box>
                )}
            </Box>
        );
    };

    // Add level selection tracking
    const handleLevelSelect = (level: Level) => {
        posthog.capture('partial_skill_level_selected', {
            rsn_user_id: rsnUser?.data?.id,
            partial_skill_id: partialSkillId,
            selected_level: level,
        }, {
            send_instantly: true,
        });

        setSelectedLevel(level);

        // Not triggering deletion of old subtopics on level change
    };

    // Add activity types configuration tracking
    const handleActivityTypesChange = (types: string[]) => {
        posthog.capture('partial_skill_activity_types_configured', {
            rsn_user_id: rsnUser?.data?.id,
            partial_skill_id: partialSkillId,
            selected_types: types,
        }, {
            send_instantly: true,
        });

        setSelectedActivityTypes(types);
    };

    const getSkillRedirectUrl = useCallback((skillId: string, userSettings: any) => {
        if (isPracticeV2Enabled) {
            return `/app/skills/${skillId}/practice_v2?&allowedActivityTypes=${selectedActivityTypes.join(',')}`;
        } else {
            return `/app/skills/${skillId}/practice/practice?type=review-pinned&allowedActivityTypes=${selectedActivityTypes.join(',')}`;
        }
    }, [selectedActivityTypes, isPracticeV2Enabled]);

    const handleCreateAccountClick = useCallback(() => {
        if (!createdSkillId) return;
        const redirectUrl = getSkillRedirectUrl(createdSkillId, userSettings);
        const encodedRedirectUrl = encodeURIComponent(redirectUrl);
        router.push(`/app/login?redirectTo=${encodedRedirectUrl}&startTrial=true&startTab=signup&startLearningSkillId=${createdSkillId}`);
    }, [createdSkillId, userSettings, selectedActivityTypes, router]);

    if (showTeaser) {
        return <CourseTeaserPageInner
            initialTopic={teaserTopic}
            onCreateAccountClick={handleCreateAccountClick}
        />;
    }

    if (loading) {
        return (
            <Stack
                alignItems="center"
                justifyContent="center"
                height="100vh"
                spacing={3}
            >
                <CircularProgress size={60} color="primary" />
                <Txt variant="h6" color="text.secondary">
                    Loading your skill details...
                </Txt>
            </Stack>
        );
    }

    if (!partialSkillId) {
        return (
            <Stack
                alignItems="center"
                justifyContent="center"
                height="100vh"
                spacing={2}
                sx={{ px: 3 }}
            >
                <Txt variant="h5" color="text.secondary" align="center">
                    No skill creation data found
                </Txt>
                <Txt color="text.secondary" align="center">
                    Please start by describing what you want to learn or uploading documents from the home page
                </Txt>
                <Button
                    variant="contained"
                    onClick={() => router.push('/app')}
                    sx={{ mt: 2 }}
                >
                    Go to Home
                </Button>
            </Stack>
        );
    }

    if (!skillData) {
        return (
            <Stack
                alignItems="center"
                justifyContent="center"
                height="100vh"
                spacing={2}
                sx={{ px: isSmallDevice ? 1 : 2 }}
            >
                <Txt variant="h5" color="error" align="center">
                    Error loading data
                </Txt>
                <Txt color="text.secondary" align="center">
                    There was a problem loading your data. Please try again.
                </Txt>
                <Button
                    variant="contained"
                    onClick={() => router.push('/app')}
                    sx={{ mt: 2 }}
                >
                    Return Home
                </Button>
            </Stack>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
            {isCreating ? (
                <Stack
                    sx={{
                        width: '100%',
                        height: '100dvh',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Card
                        sx={{
                            width: isSmallDevice ? 'calc(100vw - 32px)' : '600px',
                            padding: 4,
                            backgroundColor: 'background.paper',
                            borderRadius: '16px',
                            border: (theme) => `2px solid ${theme.palette.primary.main}`,
                            boxShadow: 4,
                        }}
                    >
                        <Stack spacing={4} alignItems="center">
                            <FractalTreeLoading style={{ width: 150, height: 150 }} growthSpeed={250.0} color={theme.palette.primary.light} />
                            <Stack spacing={2} alignItems="center">
                                <Txt variant="h5" color="primary">
                                    Entering your course...
                                </Txt>
                                <Txt
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{
                                        textAlign: 'center',
                                        fontStyle: 'italic',
                                        maxWidth: '100%',
                                        wordBreak: 'break-word',
                                        backgroundColor: 'background.default',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                        '& span': {
                                            opacity: 0.8
                                        }
                                    }}
                                >
                                    "{skillData?.skillName}"
                                </Txt>
                            </Stack>
                        </Stack>
                    </Card>
                </Stack>
            ) : (
                <Stack
                    alignItems="center"
                    sx={{
                        bgcolor: 'background.paper',
                        overflow: 'hidden',
                        my: isSmallDevice ? 0 : 2,
                        p: 0,
                        width: '100%',
                    }}
                >
                    <Card sx={{
                        maxWidth: '48rem',
                        width: '100%',
                        minHeight: 'min-content',
                        maxHeight: 'calc(100vh - 32px)',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 0,
                        borderRadius: isSmallDevice ? '0' : '10px',
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            maxHeight: isSmallDevice ? 'calc(100dvh - 56px)' : 'calc(100dvh - 56px - 48px)',
                            width: '100%',
                            overflow: 'hidden',
                        }}>
                            <Stack
                                spacing={0}
                                sx={{
                                    width: '100%',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Main Content */}
                                <Stack spacing={isSmallDevice ? 1 : 2} sx={{
                                    p: isSmallDevice ? 2 : 3,
                                    mb: 0,
                                    width: '100%',
                                    flexShrink: 0,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    bgcolor: (theme) => skillData?.emoji ?
                                        theme.palette.background.paper :
                                        alpha(theme.palette.primary.main, 0.1),
                                }}>
                                    {/* Add background emoji */}
                                    {skillData?.emoji && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%) rotate(-10deg)',
                                                fontSize: '1200px',
                                                opacity: 0.4,
                                                background: 'background.paper',
                                                filter: 'blur(40px)',
                                                maskImage: (theme) =>
                                                    `radial-gradient(circle at center, ${theme.palette.background.paper} 0%, transparent 70%)`,
                                                WebkitMaskImage: (theme) =>
                                                    `radial-gradient(circle at center, ${theme.palette.background.paper} 0%, transparent 70%)`,
                                                pointerEvents: 'none',
                                                width: '400%',
                                                height: '400%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 0,
                                            }}
                                        >
                                            {skillData?.emoji}
                                        </Box>
                                    )}

                                    {/* Content Box */}
                                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                                        {/* Skill Name */}
                                        {renderEditableField('name', skillData?.skillName || 'Loading...', isSmallDevice ? 'h6' : 'h5')}

                                        {/* Description */}
                                        {renderEditableField('description', skillData?.description || 'Loading...', 'body1')}

                                        {/* Enter Course Button */}
                                        <Stack spacing={isSmallDevice ? 1 : 2} alignItems="stretch">
                                            <Stack direction="row" spacing={isSmallDevice ? 1 : 2} justifyContent="center">
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    startIcon={<BookOpen />}
                                                    onClick={handleCreateSkill}
                                                    disabled={isCreating || isUploading}
                                                    sx={{
                                                        py: 2,
                                                        borderRadius: '10px',
                                                    }}
                                                >
                                                    Enter Course
                                                </Button>
                                            </Stack>

                                            {/* Upload progress */}
                                            {isUploading && (
                                                <Stack spacing={1} alignItems="center" width="100%">
                                                    <Txt color="text.secondary">Reading docs...</Txt>
                                                    <LinearProgress
                                                        sx={{
                                                            width: '100%',
                                                            height: 4,
                                                            borderRadius: 2,
                                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 2,
                                                            }
                                                        }}
                                                    />
                                                </Stack>
                                            )}

                                            {/* Show Advanced Options Button */}
                                            <Button
                                                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                                sx={{
                                                    color: 'text.secondary',
                                                    fontSize: '0.8rem',
                                                    textTransform: 'none',
                                                    py: 0.5,
                                                    mt: 1,
                                                    backgroundColor: 'transparent',
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                    },
                                                }}
                                                startIcon={showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            >
                                                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Stack>

                                {/* Advanced Options Section */}
                                <Collapse in={showAdvancedOptions}>
                                    <Divider />

                                    {/* Secondary Content */}
                                    <Stack
                                        spacing={isSmallDevice ? 2 : 3}
                                        sx={{
                                            opacity: 0.9,
                                            p: isSmallDevice ? 1 : 2,
                                            overflow: 'auto',
                                            flex: 1,
                                            minHeight: 0,
                                            height: '100%',
                                            maxHeight: isSmallDevice ? 'calc(100dvh - 410px)' : 'calc(100dvh - 450px)',
                                        }}
                                    >
                                        {/* Level Selection */}
                                        <Stack spacing={isSmallDevice ? 1 : 2}>
                                            <Txt variant="subtitle1">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <GraduationCap size={16} />
                                                    <span>Select Your Level</span>
                                                </Stack>
                                            </Txt>
                                            <Stack
                                                direction={"row"}
                                                spacing={isSmallDevice ? 1 : 2}
                                                justifyContent="center"
                                            >
                                                {([
                                                    { level: 'beginner', icon: <Sprout size={16} /> },
                                                    { level: 'intermediate', icon: <TreePine size={16} /> },
                                                    { level: 'advanced', icon: <Mountain size={16} /> },
                                                ] as const).map(({ level, icon }) => (
                                                    <Button
                                                        key={level}
                                                        variant={selectedLevel === level ? 'contained' : 'outlined'}
                                                        onClick={() => handleLevelSelect(level)}
                                                        fullWidth={isSmallDevice}
                                                        startIcon={icon}
                                                        sx={{
                                                            textTransform: 'capitalize',
                                                            minWidth: isSmallDevice ? 'auto' : 120,
                                                            borderRadius: '10px',
                                                            ...(isSmallDevice && {
                                                                fontSize: '0.8rem',
                                                                padding: '6px 8px',
                                                            }),
                                                            ...(selectedLevel !== level && {
                                                                borderColor: 'divider',
                                                                color: 'text.secondary',
                                                            })
                                                        }}
                                                    >
                                                        {level}
                                                    </Button>
                                                ))}
                                            </Stack>
                                        </Stack>

                                        {/* Resources Section */}
                                        <Stack spacing={isSmallDevice ? 1 : 2}>
                                            <Txt variant="subtitle1">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <File size={16} />
                                                    <span>Learning Resources</span>
                                                </Stack>
                                            </Txt>
                                            <Box sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                alignItems: 'center'
                                            }}>
                                                {/* Show uploaded resources */}
                                                {skillData?.pages.map((page) => (
                                                    <Chip
                                                        key={page.id}
                                                        icon={<FileText size={16} />}
                                                        label={selectedResourceName === page.id ?
                                                            selectedResourceName :
                                                            page.name || `Document`
                                                        }
                                                        onDelete={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteResource(page.id);
                                                        }}
                                                        onClick={() => handleViewResource(page.id)}
                                                        deleteIcon={uploadingFiles.includes(page.id) ?
                                                            <CircularProgress size={16} /> :
                                                            recentlyUploadedFiles.includes(page.id) ?
                                                                <CheckCircle size={16} color="#4caf50" /> :
                                                                <Trash2 size={16} />
                                                        }
                                                        sx={{
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease-in-out',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            bgcolor: 'background.default',
                                                            '& .MuiChip-label': {
                                                                color: 'text.primary',
                                                            },
                                                            '& .MuiChip-deleteIcon': {
                                                                color: 'text.primary',
                                                                opacity: 0.6,
                                                                '&:hover': {
                                                                    opacity: 1,
                                                                    color: 'error.main',
                                                                },
                                                            },
                                                            '&:hover': {
                                                                bgcolor: 'action.hover',
                                                                borderColor: 'primary.main',
                                                                transform: 'translateY(-1px)',
                                                            },
                                                            ...(recentlyUploadedFiles.includes(page.id) && {
                                                                borderColor: 'success.main',
                                                                color: 'success.main',
                                                            }),
                                                        }}
                                                    />
                                                ))}

                                                {/* Upload button */}
                                                <Chip
                                                    icon={<Plus size={16} />}
                                                    label="Add Resource"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        const dropzoneElement = document.querySelector('[role="presentation"]');
                                                        if (dropzoneElement) {
                                                            (dropzoneElement as HTMLElement).click();
                                                        }
                                                    }}
                                                    sx={{
                                                        borderStyle: 'dashed',
                                                        borderRadius: '8px',
                                                        borderColor: 'divider',
                                                        color: 'text.secondary',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            borderColor: 'primary.main',
                                                            bgcolor: 'action.hover',
                                                        },
                                                    }}
                                                />
                                                <div {...getRootProps()} style={{ display: 'none' }}>
                                                    <input {...getInputProps()} />
                                                </div>
                                            </Box>
                                        </Stack>

                                        {/* Goals Section */}
                                        <Stack spacing={isSmallDevice ? 1 : 2}>
                                            <Txt variant="subtitle1">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Target size={16} />
                                                    <span>Learning Goals</span>
                                                </Stack>
                                            </Txt>
                                            <Box sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                alignItems: 'center'
                                            }}>
                                                {skillData?.goals.map((goal, index) => (
                                                    editingGoalIndex === index ? (
                                                        // Show input field when editing this specific goal
                                                        <Stack key={index} direction="row" spacing={1} sx={{ width: '100%' }}>
                                                            <ClickAwayListener onClickAway={handleCancelGoalEdit}>
                                                                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                                                    <TextField
                                                                        autoFocus
                                                                        fullWidth
                                                                        size="small"
                                                                        value={newGoal}
                                                                        onChange={(e) => setNewGoal(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleAddGoal();
                                                                            } else if (e.key === 'Escape') {
                                                                                handleCancelGoalEdit();
                                                                            }
                                                                        }}
                                                                        placeholder="Edit goal and press Enter"
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                borderRadius: '10px',
                                                                            }
                                                                        }}
                                                                    />
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={handleAddGoal}
                                                                        sx={{
                                                                            color: 'text.secondary',
                                                                            '&:hover': {
                                                                                color: 'primary.main',
                                                                                bgcolor: 'action.hover',
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </IconButton>
                                                                </Stack>
                                                            </ClickAwayListener>
                                                        </Stack>
                                                    ) : (
                                                        // Show chip when not editing
                                                        <Chip
                                                            key={index}
                                                            label={goal}
                                                            onClick={() => handleEditGoal(index)}
                                                            onDelete={() => {
                                                                const newSkillData = { ...skillData };
                                                                newSkillData.goals = skillData.goals.filter((_, i) => i !== index);
                                                                setSkillData(newSkillData);
                                                            }}
                                                            sx={{
                                                                borderRadius: '10px',
                                                                bgcolor: 'background.default',
                                                                cursor: 'pointer',
                                                                '& .MuiChip-label': {
                                                                    fontSize: '0.9rem',
                                                                    color: 'text.primary',
                                                                },
                                                                '&:hover': {
                                                                    bgcolor: 'action.hover',
                                                                }
                                                            }}
                                                        />
                                                    )
                                                ))}
                                                {/* Show either Add Goal chip or input field */}
                                                {isAddingGoal && editingGoalIndex === null ? (
                                                    <ClickAwayListener onClickAway={handleCancelGoalEdit}>
                                                        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                                            <TextField
                                                                autoFocus
                                                                fullWidth
                                                                size="small"
                                                                value={newGoal}
                                                                onChange={(e) => setNewGoal(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleAddGoal();
                                                                    } else if (e.key === 'Escape') {
                                                                        handleCancelGoalEdit();
                                                                    }
                                                                }}
                                                                placeholder="Type your goal and press Enter"
                                                                sx={{
                                                                    '& .MuiOutlinedInput-root': {
                                                                        borderRadius: '10px',
                                                                    }
                                                                }}
                                                            />
                                                            <IconButton
                                                                size="small"
                                                                onClick={handleAddGoal}
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    '&:hover': {
                                                                        color: 'primary.main',
                                                                        bgcolor: 'action.hover',
                                                                    }
                                                                }}
                                                            >
                                                                <Edit2 size={16} />
                                                            </IconButton>
                                                        </Stack>
                                                    </ClickAwayListener>
                                                ) : (
                                                    <Chip
                                                        icon={<Plus size={16} />}
                                                        label="Add Goal"
                                                        onClick={() => setIsAddingGoal(true)}
                                                        variant="outlined"
                                                        sx={{
                                                            borderStyle: 'dashed',
                                                            borderRadius: '10px',
                                                            borderColor: 'divider',
                                                            color: 'text.secondary',
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                borderColor: 'primary.main',
                                                                bgcolor: 'action.hover',
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </Stack>

                                        {/* Choose Learning Activities */}
                                        <Stack spacing={2} alignItems="flex-start">
                                            <Txt variant="subtitle1">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Settings sx={{ width: 16, height: 16 }} />
                                                    <span>More Settings</span>
                                                </Stack>
                                            </Txt>
                                            <Chip
                                                icon={<Gamepad sx={{ width: 16, height: 16 }} />}
                                                label="Configure Activity Types"
                                                onClick={() => setIsActivitySelectorOpen(true)}
                                                variant="outlined"
                                                sx={{
                                                    borderStyle: 'dashed',
                                                    borderRadius: '10px',
                                                    borderColor: 'divider',
                                                    color: 'text.secondary',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        bgcolor: 'action.hover',
                                                    }
                                                }}
                                            />
                                        </Stack>
                                    </Stack>
                                </Collapse>
                            </Stack>
                        </Box>
                    </Card>

                    {/* Resource Viewer Dialog */}
                    <ResourceViewerDialog
                        open={viewerOpen}
                        onClose={handleCloseViewer}
                        resourceName={selectedResourceName || ''}
                        pdfUrl={pdfUrl}
                    />

                    {/* Delete Confirmation Dialog */}
                    <Dialog
                        open={deleteConfirmOpen}
                        onClose={() => setDeleteConfirmOpen(false)}
                    >
                        <DialogTitle>
                            <Txt variant="h6">Delete Resource</Txt>
                        </DialogTitle>
                        <DialogContent>
                            <Txt>
                                Are you sure you want to delete this resource? This action cannot be undone.
                            </Txt>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => setDeleteConfirmOpen(false)}
                                color="inherit"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => await executeDelete()}
                                color="error"
                                variant="contained"
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Error Snackbar */}
                    <Snackbar
                        open={!!error}
                        autoHideDuration={6000}
                        onClose={() => setError(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert
                            onClose={() => setError(null)}
                            severity="error"
                            sx={{ width: '100%' }}
                        >
                            {error}
                        </Alert>
                    </Snackbar>

                    {/* Existing upload error Snackbar */}
                    <Snackbar
                        open={!!uploadError}
                        autoHideDuration={6000}
                        onClose={() => setUploadError(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert onClose={() => setUploadError(null)} severity="error" sx={{ width: '100%' }}>
                            {uploadError}
                        </Alert>
                    </Snackbar>

                    {/* Learning Activities Dialog */}
                    <Dialog
                        open={isActivitySelectorOpen}
                        onClose={() => setIsActivitySelectorOpen(false)}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Txt variant="h6">Configure Activity Types</Txt>
                                <IconButton onClick={() => setIsActivitySelectorOpen(false)}>
                                    <X size={20} />
                                </IconButton>
                            </Stack>
                        </DialogTitle>
                        <DialogContent>
                            <ActivityTypeSelector
                                enabledActivityTypes={selectedActivityTypes}
                                onActivityTypeChange={handleActivityTypesChange}
                                allowInternalActivities={false}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setIsActivitySelectorOpen(false)}>
                                Done
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Stack>
            )}
        </div>
    );
} 