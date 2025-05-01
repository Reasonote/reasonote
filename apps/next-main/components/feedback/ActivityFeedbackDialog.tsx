import React, {
  useCallback,
  useState,
} from "react";

import {Flag} from "lucide-react";
import posthog from "posthog-js";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {RsnSnackbar} from "../snackbars/RsnSnackbar";

const FEEDBACK_OPTIONS = [
    { label: "Instructions are unclear", emoji: "❓", tag: "unclear_instructions" },
    { label: "Technical issue", emoji: "🔧", tag: "technical_issue" },
    { label: "Content is incorrect", emoji: "❌", tag: "content_incorrect" },
    { label: "Activity graded incorrectly", emoji: "📊", tag: "graded_incorrectly" },
    { label: "Other", emoji: "💭", tag: "other" }
];

interface ActivityFeedbackDialogProps {
    onSubmit: (feedback: { tags: string[]; details?: string }) => void;
    sx?: any;
}

export function ActivityFeedbackDialog({ onSubmit, sx }: ActivityFeedbackDialogProps) {
    const isSmallDevice = useIsSmallDevice();
    const [open, setOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = useCallback(() => {
        setOpen(false);
        setTimeout(() => {
            setSelectedTags([]);
            setDetails('');
        }, 300);
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        
        try {
            posthog.capture("feedback_initiated", {
                source: "activity_feedback",
                location: window.location.pathname,
            }, {
                send_instantly: true
            });
            onSubmit({ 
                tags: selectedTags,
                details: details.trim() || undefined 
            });
            console.log("user sent activity feedback");
            handleClose();
            setShowSnackbar(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTagToggle = useCallback((tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    }, []);

    return (
        <>
            <Stack 
                direction="row" 
                spacing={1} 
                alignItems="center"
                onClick={handleOpen}
                sx={{ 
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    ...sx
                }}
            >
                <Flag size={20} />
                {!isSmallDevice && (
                    <Typography variant="body2" sx={{ fontWeight: 500, userSelect: 'none' }}>
                        Report
                    </Typography>
                )}
            </Stack>

            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                fullScreen={isSmallDevice}
            >
                <DialogTitle>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Flag size={20} />
                        <Typography>Report a Problem</Typography>
                    </Stack>
                </DialogTitle>
                
                <DialogContent>
                    <Stack spacing={3} py={2}>
                        {error && (
                            <Alert severity="error" onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        <Stack spacing={1}>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                What's wrong with this activity?
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {FEEDBACK_OPTIONS.map(({ label, emoji, tag }) => (
                                    <Chip
                                        key={tag}
                                        label={
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <span>{emoji}</span>
                                                <span>{label}</span>
                                            </Stack>
                                        }
                                        onClick={() => handleTagToggle(tag)}
                                        color={selectedTags.includes(tag) ? "primary" : "default"}
                                        variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                                        sx={{ 
                                            m: 0.5,
                                            '&:hover': {
                                                backgroundColor: selectedTags.includes(tag) ? 
                                                    'primary.dark' : 'action.hover'
                                            }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Stack>
                        <TextField
                            multiline
                            rows={4}
                            placeholder="Additional details (optional)"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={isSubmitting || selectedTags.length === 0}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>

            <RsnSnackbar
                color="primary"
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={() => setShowSnackbar(false)}
                message={
                    <Stack>
                        <Typography variant="body1">
                            Thanks for the feedback 🫡
                        </Typography>
                    </Stack>
                }
            />
        </>
    );
} 