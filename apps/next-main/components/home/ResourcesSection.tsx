import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CheckCircle,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import posthog from "posthog-js";
import {useDropzone} from "react-dropzone";

import {
  IntegrationsDocsIngestRoute,
} from "@/app/api/integrations/docs/ingest/routeSchema";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useResources} from "@/clientOnly/hooks/useResources";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  useSkillEditPermissions,
} from "@/clientOnly/hooks/useSkillEditPermissions";
import {ResourceViewerDialog} from "@/components/dialogs/ResourceViewerDialog";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import ResourcesIcon from "@mui/icons-material/LibraryBooks";
import {
  Alert,
  Button,
  Card,
  CircularProgress,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
} from "@mui/material";
import {RsnPage} from "@reasonote/lib-sdk-apollo-client";
import {notEmpty} from "@reasonote/lib-utils";

type ResourcesSectionProps = {
    skillId?: string | null | undefined;
    courseId?: string | null | undefined;
}

export function ResourcesSection({ skillId, courseId }: ResourcesSectionProps) {
    const { sb } = useSupabase();
    const { rsnUser } = useRsnUser();
    const isSmallDevice = useIsSmallDevice();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedResource, setSelectedResource] = useState<RsnPage | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [recentlyUploadedFiles, setRecentlyUploadedFiles] = useState<string[]>([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<RsnPage | null>(null);
    const { checkSkillEditPermissions } = useSkillEditPermissions();
    const [canEdit, setCanEdit] = useState(true);

    const { data: resourcesData, refetch: refetchResources } = useResources({ skills: skillId ? [skillId] : [], courseId: courseId });

    const resources = resourcesData?.resourceCollection?.edges
        .map((edge) => edge.node.childPage)
        .filter(notEmpty)
        .filter((d) => notEmpty(d.id))
        .sort((a, b) => {
            const dateA = new Date(a.createdDate);
            const dateB = new Date(b.createdDate);
            return dateB.getTime() - dateA.getTime();
        });

    useEffect(() => {
        refetchResources();
    }, [skillId, courseId, rsnUser?.data?.id]);

    // Check edit permissions
    useEffect(() => {
        const checkAccess = async () => {
            const { canEdit } = await checkSkillEditPermissions(skillId, courseId);
            setCanEdit(canEdit);
        };

        checkAccess();
    }, [skillId, checkSkillEditPermissions]);

    const downloadResources = async (resource: RsnPage) => {
        try {
            if (!resource.storagePath) {
                console.error('No storage path for resource:', resource);
                return;
            }

            const { data: downloadData, error: downloadError } = await sb.storage
                .from('attachment-uploads')
                .createSignedUrl(resource.storagePath, 300);

            if (downloadError) {
                console.error('Error creating signed URL:', downloadError);
                return;
            }

            if (!downloadData?.signedUrl) {
                console.error('No signed URL returned');
                return;
            }

            setPdfUrl(downloadData.signedUrl);
        } catch (error) {
            console.error('Error downloading resource:', error);
        }
    };

    // Cleanup URL when dialog closes or component unmounts
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    useEffect(() => {
        if (selectedResource?.fileType?.includes('pdf')) {
            downloadResources(selectedResource);
        }
    }, [selectedResource]);

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
        setUploadError(null);
        const uploadingFilenames = acceptedFiles.map(f => f.name);
        setUploadingFiles(uploadingFilenames);

        const formData = new FormData();
        for (const file of acceptedFiles) {
            formData.append("files", file);
        }

        try {
            const response = await IntegrationsDocsIngestRoute.call({}, undefined, formData);
            const data = response.data;
            if (data?.documents) {
                // Track successful upload
                posthog.capture('document_upload_success', {
                    file_count: acceptedFiles.length,
                    document_count: data.documents.length,
                    file_types: acceptedFiles.map(f => f.type),
                }, {
                    send_instantly: true
                });

                let resourceInsertionError: any;
                let insertedResources: any;
                if (skillId) {
                    ({ error: resourceInsertionError, data: insertedResources } = await sb.from('resource')
                        .insert(data.documents.map((doc) => ({
                            child_page_id: doc.pageId,
                            parent_skill_id: skillId,
                            created_by: rsnUser?.data?.id,
                            updated_by: rsnUser?.data?.id,
                        })))
                        .select());
                } else {
                    ({ error: resourceInsertionError, data: insertedResources } = await sb.from('resource')
                        .insert(data.documents.map((doc) => ({
                            child_page_id: doc.pageId,
                            parent_course_id: courseId,
                            created_by: rsnUser?.data?.id,
                        })))
                        .select());
                }

                if (resourceInsertionError) {
                    setUploadError('Error linking resource to skill: ' + resourceInsertionError.message);
                } else {
                    // Set recently uploaded files using the child_page_ids
                    setRecentlyUploadedFiles(insertedResources?.map(r => r.child_page_id ?? '') ?? []);
                    // Clear the recently uploaded files after 3 seconds
                    setTimeout(() => {
                        setRecentlyUploadedFiles([]);
                    }, 3000);
                }
            } else {
                let errorMessage = 'Upload failed';
                if (response.rawResponse.respJson?.error) {
                    errorMessage = response.rawResponse.respJson.error;
                } else if (response.error) {
                    errorMessage = response.error;
                }
                setUploadError('Error uploading documents: ' + errorMessage);
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred during upload';
            setUploadError('Error uploading documents: ' + errorMessage);

            // Track failed upload
            posthog.capture('document_upload_failed', {
                file_count: acceptedFiles.length,
                file_types: acceptedFiles.map(f => f.type),
                error_message: errorMessage,
            }, {
                send_instantly: true
            });
        } finally {
            setIsUploading(false);
            setUploadingFiles([]);
            refetchResources();
        }
    }, [skillId, courseId, rsnUser?.data?.id]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        noClick: false,
    });

    const handleViewResource = (resource: RsnPage) => {
        setSelectedResource(resource);
        setViewerOpen(true);
    };

    const handleCloseViewer = () => {
        setViewerOpen(false);
        setSelectedResource(null);
    };

    const handleCloseError = () => {
        setUploadError(null);
    };

    const handleDeleteResource = async (resource: RsnPage, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent opening the resource viewer
        setResourceToDelete(resource);
        setDeleteConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!resourceToDelete) return;

        console.log(resourceToDelete);
        console.log(rsnUser?.data?.id);
        if (resourceToDelete.createdBy !== rsnUser?.data?.id) {
            setUploadError("Unable to delete resource created by another user");
            return;
        }

        try {
            // First delete from resource table
            const { error: resourceError } = await sb
                .from('resource')
                .delete()
                .eq('child_page_id', resourceToDelete.id);

            if (resourceError) {
                setUploadError('Error deleting resource: ' + resourceError.message);
                return;
            }

            // Then delete from rsn_page table
            const { error: pageError } = await sb
                .from('rsn_page')
                .delete()
                .eq('id', resourceToDelete.id);

            if (pageError) {
                setUploadError('Error deleting page: ' + pageError.message);
                return;
            }

            // Refresh the resources list
            refetchResources();
        } catch (error: any) {
            setUploadError('Error during deletion: ' + error.message);
        } finally {
            setDeleteConfirmOpen(false);
            setResourceToDelete(null);
        }
    };

    const fadeInKeyframes = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;

    return (
        <>
            <style>{fadeInKeyframes}</style>
            <Card sx={{ p: 2, borderRadius: 5 }} elevation={4}>
                <Stack spacing={2}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Txt startIcon={<ResourcesIcon />} variant="h6">
                            Resources
                        </Txt>
                        {canEdit && (
                            <IconButton
                                {...getRootProps()}
                                disabled={isUploading}
                            >
                                <input {...getInputProps()} />
                                {isUploading ? <CircularProgress size={20} /> : <Upload size={20} />}
                            </IconButton>
                        )}
                    </Stack>

                    {/* Show uploading files */}
                    {uploadingFiles.length > 0 && (
                        <Stack spacing={1}>
                            {uploadingFiles.map((filename) => (
                                <Alert key={filename} severity="info" icon={<CircularProgress size={20} />}>
                                    Uploading {filename}...
                                </Alert>
                            ))}
                        </Stack>
                    )}

                    {resources?.length ?? 0 > 0 ? (
                        <Stack spacing={1}>
                            {resources?.map((resource) => (
                                <Card
                                    key={resource.id}
                                    onClick={() => handleViewResource(resource as RsnPage)}
                                    sx={{
                                        p: 1.5,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 3,
                                            borderColor: 'primary.main',
                                        },
                                        borderRadius: 5
                                    }}
                                    elevation={8}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <FileText size={20} />
                                            <Txt>{resource.name || resource.originalFilename}</Txt>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {recentlyUploadedFiles.includes(resource.id) && (
                                                <CheckCircle
                                                    size={20}
                                                    color="#4caf50"
                                                    style={{
                                                        animation: 'fadeIn 0.5s ease-in'
                                                    }}
                                                />
                                            )}
                                            {canEdit && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleDeleteResource(resource as RsnPage, e)}
                                                    sx={{
                                                        opacity: 0.6,
                                                        '&:hover': {
                                                            opacity: 1,
                                                            color: 'error.main'
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </Stack>
                                </Card>
                            ))}
                        </Stack>
                    ) : (
                        <Txt
                            color="text.secondary"
                            align="center"
                            sx={{ fontStyle: 'italic' }}
                        >
                            No resources yet. <br /> Click the upload button to add some!
                        </Txt>
                    )}
                </Stack>
            </Card>

            {/* Resource Viewer Dialog */}
            <ResourceViewerDialog
                open={viewerOpen}
                onClose={handleCloseViewer}
                resourceName={selectedResource?.name || selectedResource?.originalFilename || ''}
                pdfUrl={pdfUrl}
            />

            {/* Error notification */}
            <Snackbar
                open={!!uploadError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {uploadError}
                </Alert>
            </Snackbar>

            {/* Delete Confirmation Dialog */}
            <MuiDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>
                    <Txt variant="h6">Delete Resource</Txt>
                </DialogTitle>
                <DialogContent>
                    <Txt>
                        Are you sure you want to delete "{resourceToDelete?.name || resourceToDelete?.originalFilename}"? This action cannot be undone.
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
                        onClick={executeDelete}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </MuiDialog>
        </>
    );
}