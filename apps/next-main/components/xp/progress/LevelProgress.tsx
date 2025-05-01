import {
  useEffect,
  useState,
} from "react";

import {v4 as uuidv4} from "uuid";

import {
  updateHighestLevelShownRoute,
} from "@/app/api/user/update-highest-level-shown/routeSchema";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {useDialogManager} from "@/components/dialogs/DialogManager";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {LevelInfo} from "@/utils/xpCalculations";
import {EmojiEvents} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Dialog,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

interface LevelProgressProps {
    levelInfo: LevelInfo;
    skillId?: string;
    variant?: 'circular' | 'linear';
}

export function LevelProgress({ levelInfo, skillId, variant = 'circular' }: LevelProgressProps) {
    const theme = useTheme();
    const { supabase } = useSupabase();
    const { rsnUserId } = useRsnUser();
    const [showComponent, setShowComponent] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [prevLevel, setPrevLevel] = useState(levelInfo.level);
    const isSmallDevice = useIsSmallDevice();
    const dialogManager = useDialogManager();

    useEffect(() => {
        async function checkLevelProgress() {
            if (!rsnUserId || !levelInfo || !skillId) return;

            const { data: sysData, error } = await supabase
                .from('user_skill_sysdata')
                .select('highest_level_shown')
                .eq('rsn_user', rsnUserId)
                .eq('skill', skillId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching level data:', error);
                return;
            }

            const highestShownLevel = sysData?.highest_level_shown || 0;

            if (levelInfo.level > highestShownLevel && highestShownLevel > 0) {
                // Instead of setting showLevelUp, we'll use the dialog manager
                // in the check below
                
                // Update the highest level shown using the API route
                try {
                    await updateHighestLevelShownRoute.call({
                        level: levelInfo.level,
                        skillId
                    });
                } catch (error) {
                    console.error('Error updating highest level shown:', error);
                }
            }

            // If level has increased, show the level up dialog
            if (levelInfo.level > prevLevel) {
                // Use dialog manager instead of local state
                dialogManager.showDialog({
                    type: 'LevelUp',
                    id: `level-up-${uuidv4()}`,
                    level: levelInfo.level
                });
                
                // Update the previous level
                setPrevLevel(levelInfo.level);
            }

            setShowComponent(true);
        }

        checkLevelProgress();
    }, [rsnUserId, levelInfo, supabase, skillId, dialogManager, prevLevel]);

    if (!showComponent) return null;

    if (variant === 'linear') {
        return (
            <>
                <Box sx={{ width: '100%', position: 'relative', minWidth: 200 }}>
                    {/* Top row with level and XP */}
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                    >
                        <Txt
                            variant="body2"
                            color="primary"
                            startIcon={
                                <EmojiEvents
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontSize: '1rem',
                                        marginRight: '-4px'
                                    }}
                                />
                            }
                            typographyOverrides={{
                                sx: {
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                }
                            }}
                        >
                            {levelInfo.level}
                        </Txt>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                fontSize: '0.75rem',
                                opacity: 0.9,
                                fontWeight: 500,
                            }}
                        >
                            {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel} XP
                        </Typography>
                    </Stack>

                    {/* Progress bars */}
                    <Box sx={{ position: 'relative' }}>
                        <LinearProgress
                            variant="determinate"
                            value={100}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: theme.palette.action.hover,
                                position: 'absolute',
                                width: '100%',
                            }}
                        />
                        <LinearProgress
                            variant="determinate"
                            value={levelInfo.progress * 100}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: theme.palette.gray.light,
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    transition: 'transform 0.3s ease-in-out',
                                },
                            }}
                        />
                    </Box>
                </Box>
            </>
        );
    }

    return (
        <>
            <Box
                sx={{
                    display: 'inline-flex',
                    position: 'relative',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: 'transparent',
                    cursor: 'pointer'
                }}
                onClick={() => setShowDetailDialog(true)}
            >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                        variant="determinate"
                        value={100}
                        size={48}
                        thickness={3}
                        sx={{
                            color: theme.palette.action.hover,
                            position: 'absolute',
                            left: 0,
                        }}
                    />
                    <CircularProgress
                        variant="determinate"
                        value={levelInfo.progress * 100}
                        size={48}
                        thickness={3}
                        sx={{
                            color: theme.palette.primary.main,
                            position: 'relative',
                            '& .MuiCircularProgress-circle': {
                                strokeLinecap: 'round',
                                transition: 'all 0.3s ease-in-out',
                            },
                        }}
                    />
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Stack direction="column" alignItems="center" spacing={0}>
                            <Txt
                                variant="body2"
                                color="primary"
                                startIcon={
                                    <EmojiEvents
                                        sx={{
                                            color: theme.palette.primary.main,
                                            fontSize: '1rem',
                                            marginRight: '-4px'
                                        }}
                                    />
                                }
                                typographyOverrides={{
                                    sx: {
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        lineHeight: 1
                                    }
                                }}
                            >
                                {levelInfo.level}
                            </Txt>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* Detail Dialog */}
            <Dialog
                open={showDetailDialog}
                onClose={() => setShowDetailDialog(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        padding: 3,
                        minWidth: 300,
                    }
                }}
            >
                <Stack spacing={2} alignItems="center">
                    <Stack direction="column" spacing={1} alignItems="center">
                        {skillId && <SkillChip topicOrId={skillId} disableAddDelete disableLevelIndicator />}
                        <Typography variant="h5" fontWeight={600} color="text.primary">
                            Level Progress
                        </Typography>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgress
                                variant="determinate"
                                value={100}
                                size={120}
                                thickness={4}
                                sx={{
                                    color: theme.palette.action.hover,
                                    position: 'absolute',
                                    left: 0,
                                }}
                            />
                            <CircularProgress
                                variant="determinate"
                                value={levelInfo.progress * 100}
                                size={120}
                                thickness={4}
                                sx={{
                                    color: theme.palette.primary.main,
                                    position: 'relative',
                                    '& .MuiCircularProgress-circle': {
                                        strokeLinecap: 'round',
                                    },
                                }}
                            />
                            <Box
                                sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Txt
                                    variant="h4"
                                    color="primary"
                                    startIcon={
                                        <EmojiEvents sx={{
                                            color: theme.palette.primary.main,
                                            fontSize: '2.5rem',
                                            marginRight: '-4px'
                                        }} />
                                    }
                                >
                                    {levelInfo.level}
                                </Txt>
                            </Box>
                        </Box>

                    </Stack>

                    <Stack spacing={0.5} alignItems="center">

                        <Typography variant="body1" color="text.secondary">
                            {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel} XP
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {Math.round((levelInfo.currentLevelXp / levelInfo.xpForNextLevel) * 100)}% Complete
                        </Typography>
                    </Stack>
                </Stack>
            </Dialog>
        </>
    );
} 