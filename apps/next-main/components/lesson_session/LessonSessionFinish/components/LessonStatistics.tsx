import { Stack, Typography, Card, Box, useTheme } from '@mui/material';
import { CircularProgress } from '@mui/material';

interface LessonStatisticsProps {
    score: number;
    totalQuestions: number;
}

export function LessonStatistics({
    score,
    totalQuestions,
}: LessonStatisticsProps) {
    // Calculate percentage (score out of total possible points)
    const totalPossiblePoints = totalQuestions * 100;
    const percentage = Math.round((score / totalPossiblePoints) * 100);
    const theme = useTheme();
    return (
        <Card 
            sx={{ 
                backgroundColor: theme.palette.background.default,
                p: 0.5,
                borderRadius: 2,
                width: '100%',
                my: 0.5
            }}
        >
            <Stack spacing={1} width="100%" py={1}>
                <Typography 
                    variant="h5"
                    textAlign="center"
                >
                    Lesson Statistics
                </Typography>
                
                <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center"
                    position="relative"
                    py={2}
                >
                    {/* Background circle (grey) */}
                    <CircularProgress
                        variant="determinate"
                        value={100}
                        size={120}
                        thickness={4}
                        sx={{
                            color: theme.palette.gray.light,
                            position: 'absolute'
                        }}
                    />
                    {/* Progress circle (green) */}
                    <CircularProgress
                        variant="determinate"
                        value={percentage}
                        size={120}
                        thickness={4}
                        sx={{
                            color: theme.palette.success.main,
                            position: 'absolute'
                        }}
                    />
                    {/* Percentage text in the middle */}
                    <Box
                        position="relative"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        width={120}
                        height={120}
                    >
                        <Typography variant="h4" component="div">
                            {percentage}%
                        </Typography>
                        <Typography variant="caption" color={theme.palette.text.secondary}>
                            {score}/{totalPossiblePoints}
                        </Typography>
                    </Box>
                </Box>
            </Stack>
        </Card>
    );
} 