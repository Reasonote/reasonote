import { Dialog, Typography, useTheme, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiEvents } from '@mui/icons-material';
import useIsSmallDevice from '@/clientOnly/hooks/useIsSmallDevice';

const LEVEL_MESSAGES: Record<number, { title: string, message: string }> = {
    2: {
        title: "Building Momentum!",
        message: "You're getting the hang of it. Each practice session makes you stronger!"
    },
    3: {
        title: "Rising Star!",
        message: "You're developing great study habits. Your dedication is showing!"
    },
    4: {
        title: "Unstoppable!",
        message: "You're making impressive progress. Keep up this amazing pace!"
    },
    5: {
        title: "Milestone Achieved!",
        message: "You've reached Level 5! You're becoming a true learning champion!"
    },
    6: {
        title: "Knowledge Master!",
        message: "Your commitment to learning is inspiring. The sky's the limit!"
    },
    7: {
        title: "Elite Learner!",
        message: "You're in the top tier now. Your persistence is paying off!"
    },
    8: {
        title: "Learning Legend!",
        message: "Outstanding progress! You're mastering the art of learning!"
    },
    9: {
        title: "Almost There!",
        message: "Level 10 is within reach! You've come so far, keep pushing!"
    },
    10: {
        title: "Perfect 10!",
        message: "What an achievement! You're now among our most dedicated learners!"
    }
};

const DEFAULT_MESSAGE = {
    title: "Level Up!",
    message: "Your dedication to learning is remarkable. Keep pushing your boundaries!"
};

interface LevelUpDialogProps {
    open: boolean;
    onClose: () => void;
    level: number;
}

export function LevelUpDialog({ open, onClose, level }: LevelUpDialogProps) {
    const isSmallDevice = useIsSmallDevice();
    const theme = useTheme();
    const message = LEVEL_MESSAGES[level] || DEFAULT_MESSAGE;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    background: theme.palette.background.paper,
                    padding: isSmallDevice ? '1rem' : '3rem',
                    borderRadius: '1rem',
                    textAlign: 'center',
                    maxWidth: '90vw',
                    margin: 2
                }
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key="level-up"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                >
                    <Stack
                        alignItems="center"
                        sx={{
                            width: '100%',
                            textAlign: 'center',
                            overflow: 'hidden'
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{ width: '100%' }}
                        >
                            <Typography
                                variant="h3"
                                align="center"
                                sx={{
                                    mt: 2,
                                    fontWeight: 600
                                }}
                            >
                                {message.title}
                            </Typography>
                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 10, 0],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 0.5, repeat: 2 }}
                            >
                                <EmojiEvents sx={{
                                    fontSize: 80,
                                    color: theme.palette.primary.main,
                                    display: 'block',
                                    margin: '0 auto'
                                }} />
                            </motion.div>
                            <Typography
                                variant="h5"
                                color="primary"
                                align="center"
                                sx={{ mt: 1 }}
                            >
                                Level {level}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                align="center"
                                sx={{
                                    mt: 3,
                                    maxWidth: '80%',
                                    mx: 'auto'
                                }}
                            >
                                {message.message}
                            </Typography>
                        </motion.div>
                    </Stack>
                </motion.div>
            </AnimatePresence>
        </Dialog>
    );
} 