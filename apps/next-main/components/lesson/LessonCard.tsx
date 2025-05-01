import { formatDistanceToNow } from "date-fns";
import { Box, Card, CardContent, IconButton, Stack, CircularProgress } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { Txt } from "@/components/typography/Txt";

interface LessonCardProps {
    lesson: {
        id: string;
        name?: string | null;
        summary?: string | null;
        icon?: string | null;
        createdDate?: string | null;
        updated_date?: string | null;
        editable?: boolean;
        _name?: string | null;
        _summary?: string | null;
    };
    onClick?: () => void;
    onEdit?: () => void;
    showEditButton?: boolean;
    showCreatedDate?: boolean;
    isLoading?: boolean;
}

export function LessonCard({ lesson, onClick, onEdit, showEditButton = true, showCreatedDate = true, isLoading = false }: LessonCardProps) {
    const displayName = lesson.name || lesson._name || "Unnamed Lesson";
    const displayDescription = lesson.summary || lesson._summary || "No description available";
    const displayIcon = lesson.icon || '📚';
    const displayDate = lesson.updated_date || lesson.createdDate;

    return (
        <Card
            elevation={4}
            onClick={!isLoading ? onClick : undefined}
            sx={{
                cursor: isLoading ? 'wait' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '200px',
                width: '100%',
                '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                }
            }}
        >
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: (theme) => theme.palette.background.paper,
                        opacity: 0.7,
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <CircularProgress size={40} />
                </Box>
            )}
            {/* Blurred background emoji */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(-5deg)',
                    fontSize: '800px',
                    opacity: 0.2,
                    background: (theme) => `radial-gradient(circle at center, transparent 0%, ${theme.palette.background.default} 70%)`,
                    filter: 'blur(40px)',
                    maskImage: (theme) => `radial-gradient(circle at center, ${theme.palette.background.paper} 0%, transparent 70%)`,
                    WebkitMaskImage: (theme) => `radial-gradient(circle at center, ${theme.palette.background.paper} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                    transition: 'transform 0.3s ease-in-out',
                    width: '200%',
                    height: '200%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 0,
                }}
            >
                {displayIcon}
            </Box>

            <CardContent sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
                <Stack spacing={2} height="100%">
                    {/* Top row with emoji and edit button */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        {/* Emoji circle */}
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: 1
                            }}
                        >
                            {displayIcon}
                        </Box>
                        {showEditButton && onEdit && (
                            <IconButton 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        )}
                    </Stack>

                    <Stack spacing={1} sx={{ flex: 1 }}>
                        <Txt variant="h5" noWrap>{displayName}</Txt>
                        <Stack overflow="hidden" sx={{ maxHeight: '72px' }}>
                            <Txt variant="body1" color="text.secondary">
                                {displayDescription}
                            </Txt>
                        </Stack>
                        <Box sx={{ flex: 1 }} />
                        {showCreatedDate && displayDate && (
                            <Txt variant="body2" color="text.secondary">
                                Last updated {formatDistanceToNow(new Date(displayDate), { addSuffix: true })}
                            </Txt>
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
} 