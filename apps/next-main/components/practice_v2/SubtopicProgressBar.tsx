import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Tune} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import {useTheme} from "@mui/material/styles";

// Import SubTopic and SubtopicProgressBadge
import {SubTopic} from "./PracticeV2Main";
import {SubtopicProgressBadge} from "./SubtopicProgressBadge";

interface SubtopicProgressBarProps {
    topics: SubTopic[];
    currentTopicIndex: number;
    topicScores: Record<string, number>;
    activeTopics: SubTopic[];
    onAddTopic: (topicId: string) => void;
    onRemoveTopic: (topicId: string) => void;
    isTopicSelectorOpen: boolean;
    setIsTopicSelectorOpen: (open: boolean) => void;
}

export function SubtopicProgressBar({
    topics,
    currentTopicIndex,
    topicScores,
    activeTopics,
    onAddTopic,
    onRemoveTopic,
    isTopicSelectorOpen,
    setIsTopicSelectorOpen
}: SubtopicProgressBarProps) {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();

    // We no longer need to track previous topic progress as the badge handles this internally

    const handleTopicToggle = (topicId: string, isActive: boolean) => {
        if (isActive) {
            // Don't allow removing if only one topic left
            if (activeTopics.length <= 1) return;
            onRemoveTopic(topicId);
        } else {
            // Don't allow adding if already at max
            if (activeTopics.length >= 3) return;
            onAddTopic(topicId);
        }
    };

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{
                    width: '100%',
                    pr: 0,
                    pl: 0.5,
                }}
            >
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                        flex: 1,
                        justifyContent: 'center',
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': { height: '4px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { background: theme => theme.palette.divider },
                    }}
                >
                    {activeTopics.map((topic, index) => {
                        return (
                            <Box
                                key={topic.id}
                                position="relative"
                                data-topic-id={topic.id}
                                maxWidth={currentTopicIndex === index ? (isSmallDevice ? '55%' : '45%') : (isSmallDevice ? '20%' : '25%')}
                                sx={{ transition: `max-width ${theme.transitions.duration.standard}ms` }}
                            >
                                <Tooltip title={topic.name} placement="top">
                                    <Chip
                                        label={
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box sx={{
                                                    fontSize: '1rem',
                                                    lineHeight: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {topic.emoji}
                                                </Box>
                                                {(!isSmallDevice || currentTopicIndex === index) && (
                                                    <Box sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.7rem',
                                                        maxWidth: isSmallDevice ? '70%' : 'none'
                                                    }}>
                                                        {topic.name}
                                                    </Box>
                                                )}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    height: isSmallDevice ? 15 : 18,
                                                    width: isSmallDevice ? 15 : 18
                                                }}>
                                                    <SubtopicProgressBadge
                                                        score={topicScores[topic.id]}
                                                        size={isSmallDevice ? 15 : 18}
                                                        id={topic.id}
                                                        showTooltip
                                                    />
                                                </Box>
                                            </Stack>
                                        }
                                        variant={currentTopicIndex === index ? "filled" : "outlined"}
                                        color={currentTopicIndex === index ? "primary" : "default"}
                                        disabled={currentTopicIndex !== index}
                                        sx={{
                                            position: 'relative',
                                            height: 32,
                                            '& .MuiChip-label': {
                                                px: isSmallDevice ? 1 : 2
                                            },
                                        }}
                                    />
                                </Tooltip>
                            </Box>
                        );
                    })}
                </Stack>

                <IconButton
                    size={isSmallDevice ? "medium" : "small"}
                    onClick={() => setIsTopicSelectorOpen(true)}
                    sx={{
                        p: isSmallDevice ? 1 : 0.5,
                    }}
                >
                    <Tune fontSize={isSmallDevice ? "medium" : "small"} />
                </IconButton>
            </Stack>

            {/* Topic selector dialog */}
            <Dialog
                open={isTopicSelectorOpen}
                onClose={() => setIsTopicSelectorOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        maxHeight: '60vh',
                    }
                }}
            >
                <DialogTitle>Select Topics to Practice (1-3)</DialogTitle>
                <DialogContent
                    sx={{
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: theme => theme.palette.divider,
                            borderRadius: '4px',
                            '&:hover': {
                                background: theme => theme.palette.action.hover,
                            },
                        },
                    }}
                >
                    <Stack
                        direction="row"
                        sx={{
                            mt: 1,
                            flexWrap: 'wrap',
                            gap: 1,
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        {topics.map((topic) => {
                            const isActive = activeTopics.some(t => t.id === topic.id);
                            const isDisabled = !isActive && (activeTopics.length >= 3);

                            return (
                                <Tooltip
                                    key={topic.id}
                                    title={isDisabled ? 'Maximum 3 topics allowed' :
                                        (activeTopics.length <= 1 && isActive) ? 'At least 1 topic required' :
                                            topic.description}
                                >
                                    <span>
                                        <Chip
                                            label={
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    sx={{
                                                        maxWidth: '100%',
                                                    }}
                                                >
                                                    <Box sx={{
                                                        fontSize: '1.2rem',
                                                        lineHeight: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        {topic.emoji}
                                                    </Box>
                                                    <span style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {topic.name}
                                                    </span>
                                                    {/* Medal progress in topic selector */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: 20,
                                                        width: 20
                                                    }}>
                                                        <SubtopicProgressBadge
                                                            score={topicScores[topic.id]}
                                                            size={20}
                                                            id={topic.id}
                                                            showTooltip
                                                        />
                                                    </Box>
                                                </Stack>
                                            }
                                            onClick={() => handleTopicToggle(topic.id, isActive)}
                                            variant={isActive ? "filled" : "outlined"}
                                            color={isActive ? "primary" : "default"}
                                            sx={{
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                opacity: isDisabled ? 0.5 : 1,
                                                maxWidth: '250px',
                                            }}
                                        />
                                    </span>
                                </Tooltip>
                            );
                        })}
                    </Stack>
                </DialogContent>
                <DialogActions
                    sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <Button
                        variant="contained"
                        onClick={() => setIsTopicSelectorOpen(false)}
                        sx={{
                            minWidth: 120,
                        }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}