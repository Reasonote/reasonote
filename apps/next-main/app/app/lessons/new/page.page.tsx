'use client'
import {
  useCallback,
  useState,
} from "react";

import {useRouter} from "next/navigation";
import {z} from "zod";

import {
  IntegrationsDocsIngestRoute,
} from "@/app/api/integrations/docs/ingest/routeSchema";
import {
  FillSubskillTreeRoute,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {
  HomeSkillCreatorFileUploadArea,
} from "@/app/HomeSkillCreatorFileUploadArea";
import {aib} from "@/clientOnly/ai/aib";
import {useAILessonRefinement} from "@/clientOnly/hooks/useAILessonRefinement";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {SimpleHeader} from "@/components/headers/SimpleHeader";
import {LessonIcon} from "@/components/icons/LessonIcon";
import {LessonCreationForm} from "@/components/lessons/LessonCreationForm";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {Txt} from "@/components/typography/Txt";
import {useMutation} from "@apollo/client";
import {
  AutoAwesome,
  Error,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CircularProgress,
  Skeleton,
  Stack,
  useTheme,
} from "@mui/material";
import {
  createLessonFlatMutDoc,
  createSkillFlatMutDoc,
  createSkillLinkFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";

export default function NewLessonPage(){
    const theme = useTheme();
    const router = useRouter();
    const [createSkill] = useMutation(createSkillFlatMutDoc);
    const [createLesson] = useMutation(createLessonFlatMutDoc);
    const [createSkillLink] = useMutation(createSkillLinkFlatMutDoc);
    const [lessonName, setLessonName] = useState<string>('');
    const [skillName, setSkillName] = useState<string>('');
    const [lessonDetails, setLessonDetails] = useState<string>('');
    const rsnUserId = useRsnUserId();
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
    const [files, setFiles] = useState<(
        { status: 'complete', data: any } |
        {
            status: 'processing',
            data: {
                fileName: string;
                fileType: string;
            }
        } | {
            status: 'error',
            data: {
                fileName?: string;
                fileType?: string;
                error?: string;
            }
        })[]>([]);

    const hasBeenChanged = lessonName !== '' && lessonDetails !== '';

    const isLoading = isUploading || isGeneratingOutline;

    const { token } = useToken();

    const [isCreatingLesson, setIsCreatingLesson] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const lessonCreate = useCallback(async () => {
        setIsCreatingLesson(true);
        setCreateError(null);
        try {
            // Create initial root skill
            const skillCreateResult = await createSkill({
                variables: {
                    objects: [
                        {
                            name: skillName.trim() || lessonName,
                            // no root skill id needed because it's the root skill.
                        }
                    ]
                }
            });

            const createdSkill = skillCreateResult.data?.insertIntoSkillCollection?.records?.[0];

            if (createdSkill === undefined) {
                console.error('Failed to create skill -- no skill returned');
                return;
            }

            // Create the lesson
            const lessonCreateResult = await createLesson({
                variables: {
                    objects: [
                        {
                            name: lessonName,
                            summary: lessonDetails,
                            rootSkill: createdSkill?.id,
                            forUser: rsnUserId,
                        }
                    ]
                }
            });

            const createdLesson = lessonCreateResult.data?.insertIntoLessonCollection?.records?.[0];

            if (!createdLesson) {
                console.error('Failed to create lesson -- no lesson returned');
                return;
            }

            // Generate subskills using AI and create skill tree
            await FillSubskillTreeRoute.call({
                skill: {
                    id: createdSkill.id,
                    parentSkillIds: []
                },
                maxDepth: 1,
            }, {
                headers: {
                    Authorization: token ?? ''
                }
            });

            // Navigate to edit page
            router.push(`/app/lessons/${createdLesson.id}/edit`);
        } catch(e: any) {
            console.error('Error creating lesson:', e);
            setCreateError(e.message || 'An error occurred while creating the lesson');
        } finally {
            setIsCreatingLesson(false);
        }
    }, [createSkill, createLesson, lessonName, skillName, lessonDetails, createSkillLink, router, token]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);
        var uploadingFilenames: string[] = [];

        const formData = new FormData();
        for (const file of acceptedFiles) {
            formData.append("files", file);
            uploadingFilenames.push(file.name);
            setFiles((prevFiles) => [...prevFiles, { status: 'processing', data: { fileName: file.name, fileType: file.type } }]);
        }
        try {
            const response = await IntegrationsDocsIngestRoute.call({}, undefined, formData);
            const data = response.data;
            if (data?.documents) {
                setFiles((prevFiles) => prevFiles.map((file) => {
                    const matchingDocument = data.documents.find((doc) => doc.fileName === file.data.fileName);
                    if (matchingDocument) {
                        return { status: 'complete', data: matchingDocument };
                    } else {
                        return file;
                    }
                }));

                // Auto-generate outline if we have documents
                generateOutline(data.documents);
            }
        } catch (error: any) {
            setFiles((prevFiles) => prevFiles.map((file) => {
                if (file.status === 'processing' && uploadingFilenames.includes(file.data.fileName)) {
                    return {
                        status: 'error', data: {
                            fileName: file.data.fileName,
                            fileType: file.data.fileType,
                            error: error.message
                        }
                    };
                }
                return file;
            }));
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleDeleteFile = useCallback((fileName: string) => {
        setFiles(prevFiles => prevFiles.filter(file => file.data.fileName !== fileName));
    }, []);

    const generateOutline = useCallback(async (documents: any[]) => {
        setIsGeneratingOutline(true);
        try {
            const combinedContent = documents.map(doc => doc.content).join('\n\n');
            
            const outlineResponse = await aib.genObject({
                schema: z.object({
                    lessonName: z.string(),
                    lessonOutline: z.string(),
                }),
                prompt: `
                    <INSTRUCTIONS>
                        Given the following content, suggest a lesson name and some learning objectives:
                    </INSTRUCTIONS>

                    <CONTENT>
                        ${combinedContent}
                    </CONTENT>

                    <FORMAT>
                        - Keep the lesson name concise but descriptive
                        - There should be 3-5 learning objectives
                        - Each learning objective should be a single sentence
                    </FORMAT>
                `,
                model: 'openai:gpt-4o-mini',
            });

            if (outlineResponse.object.lessonName && !lessonName) {
                setLessonName(outlineResponse.object.lessonName);
            }
            if (outlineResponse.object.lessonOutline) {
                setLessonDetails(outlineResponse.object.lessonOutline);
            }
        } catch (error) {
            console.error('Error generating outline:', error);
        } finally {
            setIsGeneratingOutline(false);
        }
    }, [lessonName]);

    const { isRefining, refineWithAI } = useAILessonRefinement();

    return (
        <CenterPaperStack stackProps={{gap: 2}}>
            <SimpleHeader
                leftContent={
                    <Stack>
                        <Txt startIcon={<LessonIcon/>} variant={'h4'}>
                            Create Lesson
                        </Txt>
                    </Stack>
                }
                rightContent={
                    <Stack direction="row" spacing={2} alignItems="center">
                        {createError && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Error color="error" />
                                <Txt color="error" variant="body2">
                                    {createError}
                                </Txt>
                            </Stack>
                        )}
                        <Button 
                            onClick={lessonCreate}
                            variant={hasBeenChanged ? 'contained' : 'outlined'}
                            disabled={!hasBeenChanged || isCreatingLesson}
                            startIcon={isCreatingLesson ? <CircularProgress size={20} color="inherit" /> : undefined}
                        >
                            {isCreatingLesson ? 'Creating...' : 'Create'}
                        </Button>
                    </Stack>
                }
            />
            <Stack spacing={2}>
                <HomeSkillCreatorFileUploadArea
                    files={files}
                    onDrop={onDrop}
                    onDeleteFile={handleDeleteFile}
                />

                {files.some((file) => file.status === 'error') && (
                    <Stack spacing={1}>
                        {files.filter((file) => file.status === 'error').map((file, index) => (
                            <Card key={index} sx={{ p: 2, bgcolor: 'error.main' }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Error color="error" />
                                    <Txt color="error">
                                        {'error' in file.data ? file.data.error : 'Unknown error'}
                                    </Txt>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                )}

                {isLoading ? (
                    <Stack spacing={2} sx={{ position: 'relative', minHeight: 400 }}>
                        <Stack
                            spacing={2}
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: 1,
                                zIndex: 1,
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <AutoAwesome sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Txt variant="h5" color={theme.palette.text.primary}>
                                    AI is analyzing your document...
                                </Txt>
                            </Stack>
                            <CircularProgress size={60} />
                        </Stack>
                        <Stack spacing={2} sx={{ opacity: 0.3 }}>
                            <Skeleton variant="rectangular" height={300} />
                        </Stack>
                    </Stack>
                ) : (
                    <LessonCreationForm 
                        lessonName={lessonName}
                        skillName={skillName}
                        lessonDetails={lessonDetails}
                        onLessonNameChange={setLessonName}
                        onSkillNameChange={setSkillName}
                        onLessonDetailsChange={setLessonDetails}
                        onRefine={() => refineWithAI(lessonName, skillName, lessonDetails, setLessonDetails)}
                        isRefining={isRefining}
                    />
                )}
            </Stack>
        </CenterPaperStack>
    );
}