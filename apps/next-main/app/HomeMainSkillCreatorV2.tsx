import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {motion} from "framer-motion";
import _ from "lodash";
import {Upload} from "lucide-react";
import {useRouter} from "next/navigation";
import posthog from "posthog-js";
import {
  FileRejection,
  useDropzone,
} from "react-dropzone";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Button,
  Stack,
  useTheme,
} from "@mui/material";

import {
  IntegrationsDocsProcessStorageRoute,
} from "./api/integrations/docs/process_storage/routeSchema";
import {
  GenerateLearningSummaryRoute,
} from "./api/skills/generate_learning_summary/routeSchema";
import {GenerateRootDAGRoute} from "./api/skills/generate_root_dag/routeSchema";
import {
  GenerateSkillModulesRoute,
} from "./api/skills/generate_skill_modules/routeSchema";

export interface HomeMainSkillCreatorV2Props {
    onProcessingStateChange?: (state: {
        isProcessing: boolean;
        type: "text" | "document";
        input?: string;
        fileNames?: string[];
    }) => void;
    onError?: (error: string) => void;
}

const ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
};

// Approximate average file size per page (conservative estimate)
// PDF: ~100KB per page, DOCX: ~50KB per page
const MAX_PAGE_LIMIT = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (conservative size for 50 pages)

// Add a default headline constant
const DEFAULT_HEADLINE = "master the information you value most";

function useGlobalDragListener() {
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const dragCounter = useRef(0);

    useEffect(() => {
        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            dragCounter.current++;

            if (e.dataTransfer?.types.includes('Files')) {
                setIsDraggingFile(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            dragCounter.current--;

            if (dragCounter.current === 0) {
                setIsDraggingFile(false);
            }
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            dragCounter.current = 0;
            setIsDraggingFile(false);
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    return isDraggingFile;
}

export function HomeMainSkillCreatorV2({
    onProcessingStateChange,
    onError,
}: HomeMainSkillCreatorV2Props) {
    const theme = useTheme();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rsnUserId = useRsnUserId();
    const { sb } = useSupabase();

    // Get the headline variant from PostHog
    const [headlineVariant, setHeadlineVariant] = useState<string>(DEFAULT_HEADLINE);

    const isFileBeingDraggedOnPage = useGlobalDragListener();

    // Effect to get the headline variant from PostHog
    useEffect(() => {
        // Check if PostHog is loaded
        if (posthog && typeof posthog.getFeatureFlag === 'function') {
            // Get the variant from the feature flag - now expecting the actual text
            const variant = posthog.getFeatureFlag('homepage-headline-test');

            // If we have a valid variant text, use it
            if (variant && typeof variant === 'string') {
                setHeadlineVariant(variant);

                // Track which variant was shown
                posthog.capture('headline_variant_shown', {
                    headline: variant
                });
            } else {
                // Show warning in development environment if feature flag is not set
                console.warn(
                    '⚠️ PostHog feature flag "homepage-headline-test" is not set or not returning a string. ' +
                    'Using default headline variant. ' +
                    'Set up the feature flag in PostHog to test different variants.'
                );
            }
        } else {
            console.warn(
                '⚠️ PostHog is not properly initialized or the getFeatureFlag method is not available. ' +
                'A/B testing for headlines will not work.'
            );
        }
    }, []);


    const createSkill = async (documentId: string) => {
        try {
            const { data: summaryData, error: summaryError } = await GenerateLearningSummaryRoute.call({
                documentId,
            });

            if (summaryError || !summaryData) {
                throw new Error(`Failed to generate summary: ${summaryError}`);
            }

            const rootSkillId = summaryData.rootSkillId;

            if (rootSkillId) {
                // FIRST CREATE DAG - DO NOT AWAIT AS THIS IS RUN IN THE BACKGROUND
                GenerateRootDAGRoute.call({ rootSkillId })
                    .then(response => {
                        // Check if the first call was successful
                        if (response && !response.error) {
                            // THEN GENERATE MODULES - DO NOT AWAIT AS THIS IS RUN IN THE BACKGROUND
                            GenerateSkillModulesRoute.call({ rootSkillId })
                                .catch(moduleError => {
                                    console.error('Background module creation failed:', moduleError);
                                });
                        } else {
                            console.error('Background DAG creation failed with response:', response);
                        }
                    })
                    .catch(dagError => {
                        console.error('Background DAG creation failed with exception:', dagError);
                    });

                // Redirect to the skill page
                router.push(`/app/skills/${rootSkillId}?tab=outline`);
            }

        } catch (error) {
            console.error('Error generating summary:', error);
            const fullErrorMessage = `There was an error generating your course. Please try again or use a different document.`;
            onError?.(fullErrorMessage);
            onProcessingStateChange?.({
                isProcessing: false,
                type: "document"
            });
        }
    };

    const handleFileUpload = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            const errorMessage = fileRejections[0].errors[0].code === "file-too-large"
                ? `File size exceeds the limit. We currently support documents up to ${MAX_PAGE_LIMIT} pages only (approximately ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB).`
                : fileRejections[0].errors[0].code === "file-invalid-type"
                    ? "Invalid file type. Only the following file types are supported: " + Object.values(ALLOWED_FILE_TYPES).flat().join(", ")
                    : fileRejections[0].errors[0].message || 'Invalid file type or size';

            onError?.(errorMessage);
            return;
        }

        if (acceptedFiles.length === 0) return;

        // Double check file sizes even though dropzone should handle this
        const oversizedFiles = acceptedFiles.filter(file => file.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            const fileNames = oversizedFiles.map(f => f.name).join(", ");
            const errorMessage = `${fileNames} exceeds our ${MAX_PAGE_LIMIT}-page limit (approximately ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB). Please upload a shorter document.`;
            onError?.(errorMessage);
            return;
        }

        // Show processing screen immediately
        onProcessingStateChange?.({
            isProcessing: true,
            type: "document",
            fileNames: acceptedFiles.map((file) => file.name),
        });

        try {
            if (!rsnUserId) {
                throw new Error("No user ID found -- cannot upload files");
            }

            posthog.capture('document_upload_started', {
                file_count: acceptedFiles.length,
                file_types: acceptedFiles.map(f => f.type),
                file_sizes: acceptedFiles.map(f => f.size),
            }, { send_instantly: true });

            // Process first file only for now
            const file = acceptedFiles[0];
            const storagePath = `${rsnUserId}/${file.name}`;

            // Upload the file to storage
            const { data: fileData, error: fileError } = await sb.storage.from('attachment-uploads').upload(storagePath, file, {
                contentType: file.type,
                upsert: true,
            });

            if (fileError) {
                throw new Error(`Failed to upload file ${file.name}: ${fileError.message}`);
            }

            console.log('Uploaded file:', fileData);

            // Process the file from storage
            const { data: docsData, error: docsError } = await IntegrationsDocsProcessStorageRoute.call({
                storagePath,
                fileName: file.name,
                fileType: file.type,
            });

            if (docsError) {
                throw new Error(`Failed to process file ${file.name}: ${docsError}`);
            }

            if (!docsData?.documents || docsData.documents.length === 0) {
                throw new Error(`No document data returned for ${file.name}`);
            }

            // Create skill from the first document
            await createSkill(docsData.documents[0].pageId);

        } catch (error) {
            console.error('Error uploading files:', error);
            onProcessingStateChange?.({
                isProcessing: false,
                type: "document"
            });
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload documents. Please try again.';
            onError?.(errorMessage);
        }
    }, [rsnUserId, sb, onProcessingStateChange, onError, router]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: handleFileUpload,
        noClick: true,
        accept: ALLOWED_FILE_TYPES,
        maxSize: MAX_FILE_SIZE,
        multiple: false, // Only allow single file upload
    });

    return (
        <div {...getRootProps()}>
            <Stack gap={5} width="100%">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Txt variant="h3" color="text.primary">
                        {headlineVariant}
                    </Txt>
                </motion.div>

                <Stack gap={2} width="100%">
                    {/* Upload button */}
                    {isFileBeingDraggedOnPage ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                height: '64px',
                                border: `2px dashed ${theme.palette.primary.main}`,
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: `${theme.palette.primary.main}08`,
                            }}
                        >
                            <Txt color="text.secondary">
                                Drop your file here to create a course (max {MAX_PAGE_LIMIT} pages)
                            </Txt>
                        </motion.div>
                    ) : (
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Upload className="text-primary" />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                height: '64px',
                                fontSize: '1.2rem',
                                textTransform: 'none',
                                borderRadius: '16px',
                                backgroundColor: theme.palette.background.paper,
                                borderColor: theme.palette.divider,
                                borderWidth: '2px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                color: theme.palette.text.primary,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: `${theme.palette.primary.main}08`,
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                                    transform: 'translateY(-1px)',
                                },
                                '&:active': {
                                    transform: 'translateY(1px)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                }
                            }}
                        >
                            Upload a document to create a course
                        </Button>
                    )}

                    <input
                        {...getInputProps()}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.txt"
                    />
                    <Txt
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            textAlign: 'center',
                            mt: 1
                        }}
                    >
                        Currently supporting documents up to {MAX_PAGE_LIMIT} pages. Please <a href="mailto:support@reasonote.com" style={{
                            color: theme.palette.primary.main,
                            textDecoration: 'underline',
                            fontWeight: 500,
                            transition: 'color 0.2s ease',
                        }}>contact us</a> if you need to create courses based on larger documents.
                    </Txt>
                </Stack>
            </Stack>
        </div>
    );
}
