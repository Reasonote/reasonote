import { Dialog, Stack, Typography, Button, IconButton, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Add, Remove } from '@mui/icons-material';
import { useState } from 'react';

interface DailyGoalDialogProps {
    open: boolean;
    onKeepCurrentGoal: () => void;
    dailyXp: number;
    currentGoal: number;
    onGoalUpdate: (newGoal: number, temporary: boolean) => void;
}

const XP_INCREMENT = 100;

export function DailyGoalDialog({ open, onKeepCurrentGoal, dailyXp, currentGoal, onGoalUpdate }: DailyGoalDialogProps) {
    const theme = useTheme();
    const [showGoalAdjust, setShowGoalAdjust] = useState(false);
    const [newGoal, setNewGoal] = useState(2 * currentGoal);

    const handleClose = () => {
        setShowGoalAdjust(false);
        setNewGoal(currentGoal);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    background: theme.palette.background.paper,
                    padding: '3rem',
                    borderRadius: '1rem',
                    textAlign: 'center',
                    maxWidth: '90vw',
                    minWidth: 300
                }
            }}
        >
            <AnimatePresence mode="wait">
                {!showGoalAdjust ? (
                    // Initial view - Celebration and choice
                    <motion.div
                        key="celebration"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <Stack spacing={3} alignItems="center">
                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 10, 0],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 0.5, repeat: 2 }}
                            >
                                <Typography variant="h2">🔥</Typography>
                            </motion.div>
                            
                            <Stack spacing={1}>
                                <Typography variant="h4" color="warning.main">
                                    Daily Goal Complete!
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    You've earned {dailyXp} XP today
                                </Typography>
                            </Stack>

                            <Stack spacing={2} width="100%">
                                <Button
                                    variant="contained"
                                    color="warning"
                                    size="large"
                                    onClick={onKeepCurrentGoal}
                                    sx={{ 
                                        fontWeight: 600,
                                        py: 1.5
                                    }}
                                >
                                    Keep Practicing
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => setShowGoalAdjust(true)}
                                    sx={{ fontWeight: 600, border: `1.5px solid` }}
                                >
                                    Change Goal
                                </Button>
                            </Stack>
                        </Stack>
                    </motion.div>
                ) : (
                    // Goal adjustment view
                    <motion.div
                        key="goal-adjust"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <Stack spacing={3} alignItems="center">
                            <Typography variant="h4" color="warning.main">
                                Adjust Daily Goal
                            </Typography>

                            <Stack direction="row" alignItems="center" spacing={2}>
                                <IconButton
                                    onClick={() => setNewGoal(Math.max(currentGoal + XP_INCREMENT, newGoal - XP_INCREMENT))}
                                    color="warning"
                                >
                                    <Remove />
                                </IconButton>
                                <Typography variant="h5" color="text.primary">
                                    {newGoal} XP
                                </Typography>
                                <IconButton
                                    onClick={() => setNewGoal(newGoal + XP_INCREMENT)}
                                    color="warning"
                                >
                                    <Add />
                                </IconButton>
                            </Stack>

                            <Stack spacing={2} width="100%">
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={() => {
                                        onGoalUpdate(newGoal, false);
                                        setShowGoalAdjust(false);
                                    }}
                                    sx={{ fontWeight: 600 }}
                                >
                                    Update Goal Going Forward
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => {
                                        onGoalUpdate(newGoal, true);
                                        setShowGoalAdjust(false);
                                    }}
                                    sx={{ fontWeight: 600, border: `1.5px solid` }}
                                >
                                    Update Just For Today
                                </Button>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    onClick={() => setShowGoalAdjust(false)}
                                    sx={{ 
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500
                                    }}
                                >
                                    Back
                                </Button>
                            </Stack>
                        </Stack>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    );
} 