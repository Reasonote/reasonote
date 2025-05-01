'use client'
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SimpleHeader } from "@/components/headers/SimpleHeader";
import { Txt } from "@/components/typography/Txt";
import { Button, Card, Stack, TextField, Paper, Box, CircularProgress, Typography } from "@mui/material";
import { CreateCourseRoute } from "@/app/api/courses/create/routeSchema";
import { IntegrationsDocsIngestRoute } from "@/app/api/integrations/docs/ingest/routeSchema";
import { useSupabase } from "@/components/supabase/SupabaseProvider";
import { HomeSkillCreatorFileUploadArea } from "@/app/HomeSkillCreatorFileUploadArea";
import posthog from "posthog-js";

export default function NewCoursePage() {
    const router = useRouter();
    const { sb } = useSupabase();
    const [courseName, setCourseName] = useState('');
    const [courseOutline, setCourseOutline] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState<(
        { status: 'complete', data: any } |
        { status: 'processing', data: { fileName: string; fileType: string; } } |
        { status: 'error', data: { fileName?: string; fileType?: string; error?: string; } }
    )[]>([]);

    const handleDeleteFile = useCallback((fileName: string) => {
        setFiles(prevFiles => prevFiles.filter(file => file.data.fileName !== fileName));
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        // Track upload attempt
        posthog.capture('document_upload_started', {
            file_count: acceptedFiles.length,
            file_types: acceptedFiles.map(f => f.type),
            file_sizes: acceptedFiles.map(f => f.size),
        }, {
            send_instantly: true
        });

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
                posthog.capture('document_upload_success', {
                    file_count: acceptedFiles.length,
                    document_count: data.documents.length,
                    file_types: acceptedFiles.map(f => f.type),
                }, {
                    send_instantly: true
                });

                setFiles((prevFiles) => prevFiles.map((file) => {
                    const matchingDocument = data.documents.find((doc) => doc.fileName === file.data.fileName);
                    if (matchingDocument) {
                        return { status: 'complete', data: matchingDocument };
                    } else {
                        return file;
                    }
                }));
            } else {
                throw new Error(response.rawResponse.respJson?.error || response.error || "No documents returned");
            }
        } catch (error: any) {
            posthog.capture('document_upload_failed', {
                file_count: acceptedFiles.length,
                file_types: acceptedFiles.map(f => f.type),
                error_message: error?.message || 'Unknown error',
            }, {
                send_instantly: true
            });

            setFiles((prevFiles) => prevFiles.map((file) => {
                if (file.status === 'processing' && uploadingFilenames.includes(file.data.fileName)) {
                    return {
                        status: 'error',
                        data: {
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

    const handleCreateCourse = async () => {
        setIsCreating(true);
        try {
            const course = await CreateCourseRoute.call({
                name: courseName,
                description: courseOutline,
                rootSkillName: courseName,
            });
            
            if (course.data?.courseId) {
                // Link uploaded documents to the course
                const completedFiles = files.filter(f => f.status === 'complete');
                if (completedFiles.length > 0) {
                    await Promise.all(completedFiles.map(file => 
                        sb.from('resource').insert({
                            parent_course_id: course.data!.courseId,
                            child_page_id: file.data.pageId
                        })
                    ));
                }

                router.push(`/app/courses/${course.data.courseId}/edit`);
            } else {
                setError('Failed to create course: No course ID returned');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to create course');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Paper sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SimpleHeader
                leftContent={<Txt variant="h4">Create New Course</Txt>}
            />

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Stack spacing={3}>
                    {error && (
                        <Card sx={{ p: 2, bgcolor: 'error.light' }}>
                            <Txt color="error">{error}</Txt>
                        </Card>
                    )}

                    <Card sx={{ p: 3 }}>
                        <Stack spacing={3}>
                            <TextField
                                label="Course Name"
                                value={courseName}
                                onChange={(e) => setCourseName(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Course Outline"
                                value={courseOutline}
                                onChange={(e) => setCourseOutline(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                            />
                            
                            <Typography variant="h6">Course Materials</Typography>
                            <HomeSkillCreatorFileUploadArea
                                files={files}
                                onDrop={onDrop}
                                onDeleteFile={handleDeleteFile}
                            />

                            <Button
                                variant="contained"
                                onClick={handleCreateCourse}
                                disabled={!courseName || !courseOutline || isCreating || isUploading || files.some(f => f.status === 'processing')}
                                startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {isCreating ? 'Creating...' : 'Create Course'}
                            </Button>
                        </Stack>
                    </Card>
                </Stack>
            </Box>
        </Paper>
    );
} 