import {useState} from "react";

import _ from "lodash";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  ActivityTypeSelector,
} from "@/components/activity/components/ActivityTypeSelector";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {ModalContent} from "@/components/modals/ModalContent";
import {DailyProgress} from "@/components/xp/progress/DailyProgress";
import {LevelProgress} from "@/components/xp/progress/LevelProgress";
import {LevelInfo} from "@/utils/xpCalculations";
import {
  ArrowBackIos,
  MoreVert,
} from "@mui/icons-material";
import {
  Box,
  Card,
  Grid,
  IconButton,
  Modal,
  Stack,
  Typography,
} from "@mui/material";

export interface PracticeHeaderDumbProps {
    currentActivityId?: string | null | undefined;
    handleBack: () => void;
    settingsDisabled?: boolean;
    usingSkillIdStack: string[];
    allowedActivities: string[];
    setAllowedActivityTypes: (newTypes: string[]) => void;
    levelInfo?: LevelInfo;
    dailyXp?: number;
    icon: React.ReactNode;
}

export const PracticeHeaderDumb = ({
    currentActivityId,
    handleBack,
    settingsDisabled,
    usingSkillIdStack,
    allowedActivities,
    setAllowedActivityTypes,
    levelInfo,
    dailyXp,
    icon,
}: PracticeHeaderDumbProps) => {
    const isSmallDevice = useIsSmallDevice();
    const [settingsToggled, setSettingsToggled] = useState(false);
    const firstSkill = usingSkillIdStack[0];
    const [showDailyGoal, setShowDailyGoal] = useState(true);

    return (
        <Card
            id="fyp-header"
            sx={{
                padding: isSmallDevice ? 0.5 : 1.5,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Grid
                container
                spacing={isSmallDevice ? 0.5 : 2}
                alignItems="center"
                sx={{ minHeight: 48 }}
            >
                {/* Back Button */}
                <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        onClick={handleBack}
                        size="small"
                        sx={{ padding: 0.75 }}
                    >
                        <ArrowBackIos fontSize="small" />
                    </IconButton>
                </Grid>

                {/* Icon
                {!isSmallDevice && <Grid item sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    {icon}
                </Grid>} */}

                {/* Skill Chip */}
                <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                    {firstSkill && (
                        <SkillChip
                            disableLevelIndicator
                            key={`${currentActivityId} ${firstSkill} skillchip`}
                            topicOrId={firstSkill}
                            disableAddDelete
                        />
                    )}
                </Grid>

                {/* Level Progress - Takes up available space when Daily Progress is hidden */}
                <Grid
                    item
                    xs={showDailyGoal ? undefined : true}
                    sx={{
                        px: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isSmallDevice && !showDailyGoal ? 'center' : 'flex-start',
                    }}
                >
                    {levelInfo && (
                        <Box sx={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: isSmallDevice && !showDailyGoal ? 'center' : 'flex-start',
                        }}>
                            <LevelProgress
                                levelInfo={levelInfo}
                                skillId={firstSkill}
                                variant={(showDailyGoal || isSmallDevice) ? "circular" : "linear"}
                            />
                        </Box>
                    )}
                </Grid>

                {/* Daily Progress - Takes up available space when shown */}
                {showDailyGoal && (
                    <Grid
                        item
                        xs={!isSmallDevice}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isSmallDevice ? 'center' : 'flex-start',
                            ...(isSmallDevice && {
                                maxWidth: 'fit-content',
                                flex: '0 0 auto'
                            })
                        }}
                    >
                        {typeof dailyXp !== 'undefined' && (
                            <Box sx={{ 
                                width: !isSmallDevice ? '100%' : 'auto',
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: isSmallDevice ? 'center' : 'flex-start',
                                ...(isSmallDevice && {
                                    maxWidth: 'fit-content'
                                })
                            }}>
                                <DailyProgress
                                    dailyXp={dailyXp}
                                    variant={isSmallDevice ? "circular" : "linear"}
                                    onDailyGoalComplete={(bool) => setShowDailyGoal(bool)}
                                />
                            </Box>
                        )}
                    </Grid>
                )}

                {/* Settings Button */}
                <Grid item sx={{ marginLeft: 'auto' }}>
                    {!settingsDisabled && (
                        <IconButton
                            onClick={() => setSettingsToggled(true)}
                            size="small"
                            sx={{ padding: 0.75 }}
                        >
                            <MoreVert />
                        </IconButton>
                    )}
                </Grid>
            </Grid>
            <Modal open={settingsToggled} onClose={() => setSettingsToggled(false)}>
                <ModalContent>
                    <Stack sx={{ padding: "5px", transition: "all 1s ease", maxWidth: '500px' }}>
                        <Stack direction={"column"} gap={2}>
                            <Typography variant="h6">Allowed Activity Types</Typography>
                            <Typography variant="caption">
                                All activity types are enabled by default.
                                Choose which types of activities you want to see.
                            </Typography>
                            <ActivityTypeSelector
                                enabledActivityTypes={allowedActivities}
                                onActivityTypeChange={(newTypes) => {
                                    setAllowedActivityTypes(newTypes);
                                }}
                            />
                        </Stack>
                    </Stack>
                </ModalContent>
            </Modal>
        </Card>
    );
}