import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import _ from "lodash";
import {
  ArrowUpRight,
  Upload,
} from "lucide-react";
import {useRouter} from "next/navigation";
import posthog from "posthog-js";
import {
  FileRejection,
  useDropzone,
} from "react-dropzone";
import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {AnimatedSubmitButton} from "@/components/buttons/AnimatedSubmitButton";
import {saveSubTopicAsSkill} from "@/components/subtopics/utils";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {TxtField} from "@/components/textFields/TxtField";
import {Txt} from "@/components/typography/Txt";
import {
  Alert,
  Button,
  CircularProgress,
  ClickAwayListener,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  useTheme,
} from "@mui/material";
import {useStateWithRef} from "@reasonote/lib-utils-frontend";

import {
  IntegrationsDocsProcessStorageRoute,
} from "./api/integrations/docs/process_storage/routeSchema";
import {
  SuggestPartialSkillRoute,
} from "./api/skills/suggest_partial_skill/routeSchema";
import {GenerateSubtopicsRoute} from "./api/subtopics/generate/routeSchema";

export interface HomeMainSkillCreatorProps {
    inputRef: React.RefObject<HTMLInputElement>;
    onProcessingStateChange?: (state: {
        isProcessing: boolean;
        type: "text" | "document";
        input?: string;
        fileNames?: string[];
    }) => void;
    onError?: (error: string) => void;
    onPopperOpen?: (isPopperOpen: boolean) => void;
}

const ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
};


const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

// Add these constants at the top of the file
const SUBJECT_SUGGESTIONS = [
    "Art History",
    "8th Grade Math",
    "Ancient Philosophy",
    "9th Grade Chemistry",
    "World Geography",
    "Computer Science",
    "Human Biology",
    "Classical Literature",
    "Modern Physics",
    "Environmental Science",
    "Music Theory",
    "American History",
    "Spanish Language",
    "Business Economics",
    "Digital Marketing",
];

const SENTENCE_SUGGESTIONS = [
    "Help me understand quantum mechanics basics.",
    "I want to learn about Renaissance art.",
    "Teach me how to write better essays.",
    "Show me how to solve calculus problems.",
    "I need help with public speaking skills.",
    "Help me learn about artificial intelligence.",
    "Teach me basic psychology concepts.",
    "I want to understand stock market basics.",
    "Show me how to code in Python.",
    "Help me learn project management skills.",
    "Teach me about climate change science.",
    "I want to learn effective leadership skills.",
    "Show me how to analyze literature.",
    "Help me understand molecular biology.",
    "Teach me about digital photography basics.",
];

const LONGER_SUGGESTIONS = [
    "I want to learn machine learning. Can you help me get started?",
    "Looking to improve my writing skills for academic papers.",
    "Want to understand blockchain technology and how crypto works.",
    "Help me learn about human psychology and cognitive biases.",
    "I'm interested in learning about climate change and its effects.",
    "Want to understand how artificial neural networks process information.",
    "Help me learn about ancient civilizations and their cultures.",
    "Looking to understand modern art movements and their significance.",
    "Need help learning about financial markets and investment strategies.",
    "Want to learn about space exploration and recent discoveries.",
    "Help me understand the principles of organic chemistry.",
    "I'm interested in learning about sustainable architecture.",
    "Want to learn about evolutionary biology and natural selection.",
    "Help me understand the basics of game theory.",
];

// Add a default headline constant
const DEFAULT_HEADLINE = "create your own course in seconds";

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

// Update the getRandomSuggestions function
function getRandomSuggestions(isSmallDevice: boolean) {
    const shuffledSubjects = [...SUBJECT_SUGGESTIONS].sort(() => Math.random() - 0.5);
    const shuffledSentences = [...SENTENCE_SUGGESTIONS].sort(() => Math.random() - 0.5);
    const shuffledLonger = [...LONGER_SUGGESTIONS].sort(() => Math.random() - 0.5);

    // Always show 3 suggestions on mobile
    if (isSmallDevice) {
        return [
            shuffledSubjects[0],
            shuffledSentences[0],
            shuffledLonger[0],
        ];
    } else {
        return [
            shuffledSubjects[0],
            shuffledSentences[0],
            shuffledLonger[0],
            shuffledLonger[1],
        ];
    }
}

export function HomeMainSkillCreator({
    inputRef,
    onProcessingStateChange,
    onError,
    onPopperOpen,
}: HomeMainSkillCreatorProps) {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rsnUserId = useRsnUserId();
    const { sb } = useSupabase();

    // State
    const [userPhrase, setUserPhrase, userPhraseRef] = useStateWithRef("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPopperOpen, setIsPopperOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [suggestions, setSuggestions] = useState<string[]>(() =>
        getRandomSuggestions(isSmallDevice)
    );
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

    // Update the debounced search function
    const debouncedGetSuggestions = useCallback(
        _.debounce(async (input: string) => {
            if (!input || !input.trim()) {
                setSuggestions(getRandomSuggestions(isSmallDevice));
                setIsLoadingSuggestions(false);
                return;
            }

            setIsLoadingSuggestions(true);
            try {
                const response = await aib.streamGenObject({
                    schema: z.object({
                        suggestions: z.array(z.string()).length(4)
                    }),
                    prompt: `TASK: Generate 4 learning topic suggestions based on the user's input: "${input}"
                            REQUIREMENTS:
                            - Each suggestion MUST start with the user's input text (fixing any typos)
                            - Suggestions should complete the user's thought in different meaningful ways
                            - Keep suggestions concise and practical
                            - Each suggestion should be a complete learning topic
                            
                            EXAMPLE 1:
                            INPUT: "how to make"
                            OUTPUT SUGGESTIONS:
                            1. "how to make pasta from scratch"
                            2. "how to make effective presentations"
                            3. "how to make mobile apps with React Native"
                            4. "how to make good financial decisions"
                            
                            EXAMPLE 2:
                            INPUT: "learn python"
                            OUTPUT SUGGESTIONS:
                            1. "learn python for data science"
                            2. "learn python web development with Django"
                            3. "learn python automation and scripting"
                            4. "learn python for machine learning"
                            
                            EXAMPLE 3:
                            INPUT: "i want to study"
                            OUTPUT SUGGESTIONS:
                            1. "i want to study machine learning fundamentals"
                            2. "i want to study digital marketing strategies"
                            3. "i want to study business administration"
                            4. "i want to study user experience design"`,
                    model: "openai:gpt-4o-mini",
                    mode: "json",
                    providerArgs: {
                        temperature: 0.7, // Add some variety to suggestions
                    },
                });

                if (response.object.suggestions) {
                    setSuggestions(isSmallDevice ? response.object.suggestions.slice(0, 3) : response.object.suggestions.slice(0, 4));
                }
            } catch (error) {
                console.error('Error getting suggestions:', error);
                // Only fall back to initial suggestions if there's no user input
                if (!input.trim()) {
                    setSuggestions(getRandomSuggestions(isSmallDevice));
                }
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 300),
        [isSmallDevice]
    );

    const handleProcessing = async (input: { userInput?: string, documents?: any[] }) => {
        onProcessingStateChange?.({
            isProcessing: true,
            type: input.userInput ? "text" : "document",
            input: input.userInput,
            fileNames: input.documents?.map((doc) => doc.fileName),
        });

        try {
            const { data, error } = await SuggestPartialSkillRoute.call(input);
            if (error) {
                console.error('Error processing input:', error);
                onError?.("Error processing input. Please try again.");
                onProcessingStateChange?.({
                    isProcessing: false,
                    type: input.userInput ? "text" : "document",
                });
                return;
            }
            if (data?.skillId) {
                // Fire and forget - generate subtopics in background
                void (async () => {
                    try {
                        for await (const topic of GenerateSubtopicsRoute.callArrayStream({
                            skillId: data.skillId,
                            numTopics: 7,
                        })) {
                            if (topic.topic) {
                                saveSubTopicAsSkill(topic.topic, rsnUserId || '', data.skillId, sb);
                            }
                        }
                    } catch (error) {
                        console.error('Error in background subtopics generation:', error);
                    }
                })();
            }
            if (data?.partialSkillId) {
                router.push(`/app/partial_skill?partialSkillId=${data.partialSkillId}`);
            }
        } catch (error: any) {
            console.error('Error processing input:', error);
            onError?.('Failed to process input. Please try again.');
            onProcessingStateChange?.({
                isProcessing: false,
                type: input.userInput ? "text" : "document",
            });
        }
    };

    const handleTextSubmit = async (phrase: string) => {
        if (!phrase.trim()) return;
        setIsPopperOpen(false); // Close the popper before submitting
        await handleProcessing({ userInput: phrase });
    };

    const handleFileUpload = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            if (fileRejections[0].errors[0].code === "file-too-large") {
                setErrorMessage(
                    `File size is too large. Maximum file size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB.`
                );
            } else if (fileRejections[0].errors[0].code === "file-invalid-type") {
                setErrorMessage(
                    "Invalid file type. Only the following file types are supported: " + Object.values(ALLOWED_FILE_TYPES).join(", ")
                );
            } else {
                setErrorMessage(
                    fileRejections[0].errors[0].message || 'Invalid file type or size'
                );
            }
            return;
        }

        if (acceptedFiles.length === 0) return;

        // Double check file sizes even though dropzone should handle this
        const oversizedFiles = acceptedFiles.filter(file => file.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            const fileNames = oversizedFiles.map(f => f.name).join(", ");
            setErrorMessage(
                `The following files exceed the maximum size of ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB: ${fileNames}`
            );
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

            // Upload each file to storage and process them
            const processedDocuments: Array<{
                content: string;
                title: string;
                fileName: string;
                fileType: string;
                pageId: string;
                storagePath: string;
            }> = [];

            for (const file of acceptedFiles) {
                // Create a unique storage path for the file
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

                // Add the processed documents to our array
                processedDocuments.push(...docsData.documents);
            }

            await handleProcessing({
                documents: processedDocuments.map(doc => ({
                    ...doc,
                    // Map this through because expected later
                    resourceId: doc.pageId,
                }))
            });

        } catch (error) {
            console.error('Error uploading files:', error);
            // Hide processing screen
            onProcessingStateChange?.({
                isProcessing: false,
                type: "document"
            });
            // Show error message
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Failed to upload documents. Please try again.'
            );
        }
    }, [rsnUserId, sb, handleProcessing, onProcessingStateChange]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: handleFileUpload,
        noClick: true,
        accept: ALLOWED_FILE_TYPES,
        maxSize: MAX_FILE_SIZE,
    });

    const handleInputClick = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
        setIsPopperOpen(true);
    };

    // Update the input change handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUserPhrase(value);

        // If anchorEl isn't set yet, set it
        if (!anchorEl) {
            const inputElement = e.target.closest('.MuiInputBase-root')?.parentElement;
            if (inputElement) {
                setAnchorEl(inputElement);
            }
        }

        // Always ensure popper is open when typing
        setIsPopperOpen(true);

        if (value.trim()) {
            debouncedGetSuggestions(value);
        } else {
            // If input is empty, show initial suggestions
            setSuggestions(getRandomSuggestions(isSmallDevice));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isPopperOpen && suggestions.length > 0) {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    if (selectedIndex === null) {
                        setSelectedIndex(0);
                    } else if (selectedIndex < suggestions.length - 1) {
                        setSelectedIndex(selectedIndex + 1);
                    }
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    if (selectedIndex === null) {
                        return;
                    } else if (selectedIndex === 0) {
                        setSelectedIndex(null);
                        if (inputRef.current) {
                            inputRef.current.focus();
                        }
                    } else {
                        setSelectedIndex(selectedIndex - 1);
                    }
                    break;
                case "Enter":
                    if (selectedIndex !== null) {
                        e.preventDefault();
                        handleSuggestionClick(suggestions[selectedIndex]);
                        setSelectedIndex(null);
                    } else if (!e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit(userPhrase);
                    }
                    break;
                default:
                    break;
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTextSubmit(userPhrase);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setUserPhrase(suggestion);
        // Focus the input and move cursor to end
        if (inputRef.current) {
            inputRef.current.focus();
            // Set cursor position to end of text
            const length = suggestion.length;
            inputRef.current.setSelectionRange(length, length);
            // Wait for next render cycle before scrolling
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.scrollTop = inputRef.current.scrollHeight;
                }
            }, 0);
        }
        // Get suggestions again
        debouncedGetSuggestions(suggestion);
    };

    const handleQuickSubmit = async (suggestion: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default behavior
        e.stopPropagation(); // Prevent the suggestion click from firing
        await handleTextSubmit(suggestion);
    };

    const handleClickAway = (event: MouseEvent | TouchEvent) => {
        // Check if the click target is the submit button or its parent
        const target = event.target as HTMLElement;
        if (target.closest('.submit-button')) {
            return;
        }
        setIsPopperOpen(false);
        setAnchorEl(null);
    };

    // Reset selected index when suggestions change or popper closes
    useEffect(() => {
        setSelectedIndex(null);
    }, [suggestions, isPopperOpen]);

    // Add effect to monitor isPopperOpen
    useEffect(() => {
        onPopperOpen?.(isPopperOpen);
    }, [isPopperOpen, onPopperOpen]);

    return (
        <div {...getRootProps()}>
            <Stack gap={isSmallDevice ? 2 : 5} width="100%">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Txt variant={isSmallDevice ? "h4" : "h3"} color="text.primary" >
                        {headlineVariant}
                    </Txt>
                </motion.div>

                <Stack gap={isSmallDevice ? 1 : 2} width="100%">
                    <ClickAwayListener onClickAway={handleClickAway}>
                        <Stack gap={0} width="100%" position="relative">
                            <TxtField
                                autoFocus={!isSmallDevice}
                                multiline
                                placeholder="Describe what you want to learn..."
                                value={userPhrase}
                                onKeyDown={(e) => {
                                    // Add escape key handling
                                    if (e.key === 'Escape') {
                                        setIsPopperOpen(false);
                                        // Unfocus the textbox
                                        if (inputRef.current) {
                                            inputRef.current.blur();
                                        }
                                        return;
                                    }
                                    handleKeyDown(e);
                                }}
                                onChange={handleInputChange}
                                inputRef={inputRef}
                                variant="standard"
                                fullWidth
                                minRows={1}
                                maxRows={2}
                                sx={{
                                    width: '100%',
                                    zIndex: 200,
                                    '& .MuiInputBase-root': {
                                        width: '100%',
                                        minHeight: '64px',
                                        height: 'auto',
                                        fontSize: '1.2rem',
                                        padding: '0 20px',
                                        borderRadius: '16px',
                                        borderBottomLeftRadius: isPopperOpen ? 0 : '16px',
                                        borderBottomRightRadius: isPopperOpen ? 0 : '16px',
                                        backgroundColor: theme.palette.background.paper,
                                        transition: 'all 0.2s ease-in-out',
                                        border: `2px solid ${theme.palette.divider}`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        '&:hover': {
                                            borderColor: `${theme.palette.primary.main}40`,
                                        },
                                        '&.Mui-focused': {
                                            borderColor: theme.palette.primary.main,
                                            borderBottom: isPopperOpen ? `1px solid ${theme.palette.divider}` : `2px solid ${theme.palette.primary.main}`,
                                        },
                                        '&:before, &:after': {
                                            display: 'none',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        fontSize: '1.2rem',
                                        '&::placeholder': {
                                            color: theme.palette.text.secondary,
                                            opacity: 0.7,
                                        }
                                    },
                                }}
                                endIcon={
                                    <AnimatedSubmitButton
                                        onClick={() => handleTextSubmit(userPhrase)}
                                        disabled={!userPhrase.trim()}
                                    />
                                }
                                onClick={handleInputClick}
                            />

                            {/* Suggestions */}
                            <AnimatePresence>
                                {isPopperOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }}
                                        animate={{ opacity: 1, scaleY: 1 }}
                                        exit={{ opacity: 0, scaleY: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            ease: [0.4, 0, 0.2, 1], // Material Design easing
                                        }}
                                    >
                                        <Paper
                                            elevation={4}
                                            sx={{
                                                width: '100%',
                                                borderRadius: '16px',
                                                borderTopLeftRadius: 0,
                                                borderTopRightRadius: 0,
                                                overflow: 'hidden',
                                                border: (theme) => `2px solid ${theme.palette.primary.main}`,
                                                borderTop: 'none',
                                                backgroundColor: theme.palette.background.paper,
                                                position: 'relative',
                                                zIndex: 199,
                                            }}
                                        >
                                            <Stack width="100%" spacing={0}>
                                                {isLoadingSuggestions ? (
                                                    <Stack
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        sx={{
                                                            backgroundColor: (theme) => theme.palette.background.paper,
                                                            // Height calculation based on device size
                                                            height: isSmallDevice ? '162px' : '216px', // 3 * 54px for mobile, 4 * 54px for desktop
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <CircularProgress size={24} />
                                                    </Stack>
                                                ) : (
                                                    suggestions.map((phrase, index) => (
                                                        <Stack
                                                            key={index}
                                                            onClick={() => handleSuggestionClick(phrase)}
                                                            direction="row"
                                                            alignItems="center"
                                                            justifyContent="space-between"
                                                            height="54px"
                                                            sx={{
                                                                p: 1.5,
                                                                width: '100%',
                                                                cursor: 'pointer',
                                                                backgroundColor: selectedIndex === index ?
                                                                    (theme) => theme.palette.action.selected :
                                                                    'transparent',
                                                                '&:hover': {
                                                                    backgroundColor: (theme) =>
                                                                        selectedIndex === index ?
                                                                            theme.palette.action.selected :
                                                                            theme.palette.action.hover,
                                                                },
                                                                borderBottom: (theme) =>
                                                                    index !== suggestions.length - 1
                                                                        ? `1px solid ${theme.palette.divider}`
                                                                        : 'none',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Stack alignItems="center" justifyContent="space-between">
                                                                <Txt sx={{
                                                                    flex: 1,
                                                                    color: selectedIndex === index ? 'primary.main' : 'text.primary',
                                                                }}>
                                                                    {phrase}
                                                                </Txt>
                                                            </Stack>
                                                            <Button
                                                                onClick={(e) => handleQuickSubmit(phrase, e)}
                                                                size="small"
                                                                variant="text"
                                                                sx={{
                                                                    minWidth: 'auto',
                                                                    alignSelf: 'center',
                                                                    '&:hover': {
                                                                        backgroundColor: (theme) => theme.palette.primary.main + '20',
                                                                    }
                                                                }}
                                                            >
                                                                <ArrowUpRight
                                                                    size={20}
                                                                    style={{
                                                                        opacity: selectedIndex === index ? 0.9 : 0.7,
                                                                    }}
                                                                />
                                                            </Button>
                                                        </Stack>
                                                    ))
                                                )}
                                            </Stack>
                                        </Paper>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Stack>
                    </ClickAwayListener>

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
                                Drop your files here to learn from them
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
                            Or upload your docs to learn from
                        </Button>
                    )}

                    <input
                        {...getInputProps()}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.txt"
                        multiple
                    />
                </Stack>
            </Stack>

            {/* Error Snackbar */}
            <Snackbar
                open={!!errorMessage}
                autoHideDuration={5000}
                onClose={() => setErrorMessage(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    marginTop: 2,
                    position: 'fixed',
                    zIndex: 9999,
                }}
            >
                <div>
                    <Alert
                        onClose={() => setErrorMessage(null)}
                        severity="error"
                        variant="filled"
                        sx={{
                            width: '100%',
                            minWidth: '300px',
                            boxShadow: (theme) => `0 4px 20px ${theme.palette.error.main}20`,
                            '& .MuiAlert-message': {
                                fontSize: '1rem',
                            },
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                        }}
                    >
                        {errorMessage}
                    </Alert>
                    <LinearProgress
                        variant="determinate"
                        value={100}
                        sx={{
                            backgroundColor: theme.palette.error.light,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.palette.error.dark,
                                animation: 'countdown 5s linear forwards',
                            },
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                        }}
                    />
                </div>
            </Snackbar>
        </div>
    );
}