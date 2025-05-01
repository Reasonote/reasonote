import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";
import {v4 as uuidv4} from "uuid";

import {
  updateDailyCelebrationTimeRoute,
} from "@/app/api/user/update-daily-celebration-time/routeSchema";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {useDialogManager} from "@/components/dialogs/DialogManager";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {Redo} from "@mui/icons-material";
import {
  Box,
  BoxProps,
  Chip,
  CircularProgress,
  Dialog,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import DailyProgressNotificationSubscriptionBell
  from "./DailyProgressNotificationSubscriptionBell";

interface DailyProgressProps {
      dailyXp: number;
      variant?: 'circular' | 'linear';
      onDailyGoalComplete?: (bool: boolean) => void;
      showPracticeSuggestions?: boolean;
      disableDailyGoalCompleteModal?: boolean;
      boxProps?: BoxProps;
  }
  
  export function DailyProgress({ dailyXp, variant = 'linear', onDailyGoalComplete, showPracticeSuggestions = false, disableDailyGoalCompleteModal = false, boxProps }: DailyProgressProps) {
      const theme = useTheme();
      const [showComponent, setShowComponent] = useState(true);
      const { supabase } = useSupabase();
      const { rsnUserId } = useRsnUser();
      const [currentGoal, setCurrentGoal] = useState<number | null>(null);
      const [showDetailDialog, setShowDetailDialog] = useState(false);
      const router = useRouter();
      const { skills } = useUserSkills();
      const recentSkills = skills?.map(skill => skill) || [];
      const dialogManager = useDialogManager();
      const [hasShownDailyGoalDialog, setHasShownDailyGoalDialog] = useState(false);
      const [isLoading, setIsLoading] = useState(true);
  
      // Fetch the user's daily goal and check celebration time
      useEffect(() => {
          async function fetchUserData() {
              if (!rsnUserId) return;
              setIsLoading(true);
  
              // Get user settings and sysdata
              const [
                  { data: goalData, error: goalError },
                  { data: sysData, error: sysError }
              ] = await Promise.all([
                  supabase
                      .from('user_setting')
                      .upsert({ rsn_user: rsnUserId }, { onConflict: 'rsn_user', ignoreDuplicates: false })
                      .select('daily_xp_goal, temporary_daily_xp_goal, temporary_daily_xp_goal_set_datetime')
                      .single(),
                  supabase
                      .from('rsn_user_sysdata')
                      .select('daily_xp_goal_celebration_time')
                      .eq('rsn_user_id', rsnUserId)
                      .single()
              ]);
  
              if (goalError) {
                  console.error('Error fetching/creating user goal:', goalError);
                  setIsLoading(false);
                  return;
              }
  
              if (sysError) {
                  console.error('Error fetching user sysdata:', sysError);
                  setIsLoading(false);
                  return;
              }
  
              if (goalData) {
                  let goal = goalData.daily_xp_goal;  // default to regular goal
  
                  // If the temporary goal is set and the date is today, use the temporary goal
                  if (goalData.temporary_daily_xp_goal_set_datetime) {
                      const tempGoalDate = new Date(goalData.temporary_daily_xp_goal_set_datetime);
                      const now = new Date();
  
                      // Convert both dates to user's timezone for comparison
                      const { data: userTimezone } = await supabase
                          .from('rsn_user')
                          .select('timezone')
                          .eq('rsn_user_id', rsnUserId)
                          .single();
                      const tempGoalLocal = new Date(tempGoalDate.toLocaleString('en-US', { timeZone: userTimezone?.timezone }));
                      const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: userTimezone?.timezone }));
  
                      // Compare dates (ignoring time)
                      if (tempGoalLocal.getFullYear() === nowLocal.getFullYear() &&
                          tempGoalLocal.getMonth() === nowLocal.getMonth() &&
                          tempGoalLocal.getDate() === nowLocal.getDate()) {
                          goal = goalData.temporary_daily_xp_goal || goalData.daily_xp_goal;
                      }
                  }
                  setCurrentGoal(goal);
                  
                  // Check if we've already celebrated today
                  const lastCelebration = sysData?.daily_xp_goal_celebration_time;
                  const today = new Date();
                  const lastCelebrationDate = lastCelebration ? new Date(lastCelebration) : null;

                  // Instead of setting showDailyGoal, we'll check if we should show the dialog
                  // in the useEffect that uses showDailyGoalDialog
                  setIsLoading(false);
                  
                  if (dailyXp < goal) {
                      setShowComponent(true);
                  } else if (disableDailyGoalCompleteModal || 
                      (lastCelebrationDate && lastCelebrationDate.toDateString() === today.toDateString())) {
                      // Already celebrated today or dialog is disabled, hide the entire component
                      onDailyGoalComplete?.(false);
                  }
              } else {
                  setIsLoading(false);
              }
          }
          fetchUserData();
      }, [rsnUserId, supabase, dailyXp, disableDailyGoalCompleteModal, onDailyGoalComplete]);
  
      const dailyProgress = currentGoal ? Math.min((dailyXp / currentGoal) * 100, 100) : 0;
  
      const handleGoalUpdate = async (newGoal: number, temporary: boolean) => {
          if (!rsnUserId) return;
          // Update goal in user_setting
  
          if (temporary) {
              await supabase
                  .from('user_setting')
                  .update({ temporary_daily_xp_goal: newGoal, temporary_daily_xp_goal_set_datetime: new Date().toISOString() })
                  .eq('rsn_user', rsnUserId);
          }
          else {
              await supabase
                  .from('user_setting')
                  .update({ daily_xp_goal: newGoal, temporary_daily_xp_goal: null, temporary_daily_xp_goal_set_datetime: null })
                  .eq('rsn_user', rsnUserId);
          }
  
          setCurrentGoal(newGoal);
      };
  
      const handleKeepCurrentGoal = async () => {
          setShowComponent(false);
          onDailyGoalComplete?.(false);
          // Update celebration time when user chooses to keep practicing
          if (rsnUserId) {
              await updateDailyCelebrationTimeRoute.call({
                  dailyXpGoalCelebrationTime: new Date().toISOString()
              });
          }
      };

      // Update the showDailyGoalDialog function to use the dialog manager
      const showDailyGoalDialog = useCallback(() => {
          dialogManager.showDialog({
              type: 'DailyGoal',
              id: `daily-goal-${uuidv4()}`,
              dailyXp,
              currentGoal: currentGoal || 0,
              onKeepCurrentGoal: handleKeepCurrentGoal,
              onGoalUpdate: handleGoalUpdate
          });
      }, [dialogManager, dailyXp, currentGoal, handleKeepCurrentGoal, handleGoalUpdate]);

      // Update the useEffect that checks if the daily goal is complete
      useEffect(() => {
          if (
              !disableDailyGoalCompleteModal &&
              currentGoal &&
              dailyXp >= currentGoal &&
              !hasShownDailyGoalDialog &&
              !isLoading
          ) {
              setHasShownDailyGoalDialog(true);
              showDailyGoalDialog();
              if (onDailyGoalComplete) {
                  onDailyGoalComplete(true);
              }
          }
      }, [
          dailyXp,
          currentGoal,
          hasShownDailyGoalDialog,
          disableDailyGoalCompleteModal,
          isLoading,
          onDailyGoalComplete,
          showDailyGoalDialog
      ]);

      if (!showComponent) return null;

      const renderDetailDialogContent = () => (
          <Box position="relative" width="100%">
              {/* Notification Bell at top right corner */}
              <Box
                  sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      zIndex: 1
                  }}
              >
                  <DailyProgressNotificationSubscriptionBell size="medium" />
              </Box>
              
              <Stack spacing={3} alignItems="center" width="100%">
                  {/* Header */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h4" component="div">
                          🔥
                      </Typography>
                      <Typography
                          variant="h5"
                          color="text.primary"
                          sx={{ fontWeight: 600 }}
                      >
                          Daily Progress
                      </Typography>
                  </Stack>

                  {/* Progress Circle and Percentage */}
                  <Stack spacing={1} alignItems="center">
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
                              value={dailyProgress}
                              size={120}
                              thickness={4}
                              sx={{
                                  color: theme.palette.warning.main,
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
                              <Stack direction="column" alignItems="center" spacing={0}>
                                  <Typography
                                      variant="h6"
                                      color="text.secondary"
                                      sx={{
                                          fontWeight: 600,
                                          lineHeight: 1
                                      }}
                                  >
                                      {dailyXp} / {currentGoal}
                                  </Typography>
                                  <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                          fontWeight: 500,
                                          lineHeight: 1
                                      }}
                                  >
                                      XP
                                  </Typography>
                              </Stack>
                          </Box>
                      </Box>

                      <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                              fontWeight: 500,
                          }}
                      >
                          {Math.round(dailyProgress)}% Complete
                      </Typography>
                  </Stack>

                  {/* Practice suggestions */}
                  {showPracticeSuggestions && (
                      <Stack spacing={3} width="100%" alignItems="center">
                          {/* Header */}
                          <Stack
                              spacing={1}
                              width="100%"
                              sx={{
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 2,
                                  padding: 2,
                              }}
                          >
                              <Txt
                                  startIcon={<Redo sx={{
                                      color: theme.palette.text.secondary,
                                      fontSize: '1.2rem'
                                  }} />}
                                  variant="subtitle2"
                                  color="text.secondary"
                              >
                                  Practice to gain XP!
                              </Txt>

                              {recentSkills.length > 0 ? (
                                  <Grid
                                      container
                                      spacing={1}
                                      justifyContent={"center"}
                                      width="100%"
                                  >
                                      {recentSkills.slice(0, 3).map((skill) => (
                                          <SkillChip
                                              key={skill.id}
                                              topicOrId={skill.id}
                                              disableModal
                                              disableAddDelete
                                              disableLevelIndicator
                                              onSimpleClick={() => router.push(`/app/skills/${skill.id}/practice/practice`)}
                                              sx={{
                                                  margin: 0.5,
                                                  '& .MuiChip-root': {
                                                      width: '100%',
                                                      height: 'auto',
                                                      minHeight: 32,
                                                      '& .MuiChip-label': {
                                                          display: 'block',
                                                          whiteSpace: 'normal',
                                                          overflow: 'visible',
                                                          textOverflow: 'clip',
                                                          padding: '8px 12px',
                                                      },
                                                      transition: 'all 0.2s ease-in-out',
                                                      '&:hover': {
                                                          transform: 'translateY(-2px)',
                                                          boxShadow: theme.shadows[2]
                                                      }
                                                  }
                                              }}
                                          />
                                      ))}
                                  </Grid>
                              ) : (
                                  <Box display="flex" justifyContent="center" width="100%">
                                      <Chip
                                          label="Create course"
                                          onClick={() => {
                                              router.push('/app');
                                              setShowDetailDialog(false);
                                          }}
                                          sx={{
                                              height: 'auto',
                                              padding: '8px 16px',
                                              backgroundColor: theme.palette.gray.light,
                                              color: theme.palette.text.primary,
                                              '& .MuiChip-label': {
                                                  fontSize: '0.875rem',
                                                  padding: 0
                                              },
                                              transition: 'all 0.2s ease-in-out',
                                              '&:hover': {
                                                  backgroundColor: theme.palette.gray.main,
                                              }
                                          }}
                                      />
                                  </Box>
                              )}
                          </Stack>
                      </Stack>
                  )}
              </Stack>
          </Box>
      );

      if (variant === 'circular') {
          return (
              <>
                  <Box
                      {...boxProps}
                      sx={{
                          position: 'relative',
                          display: 'inline-flex',
                          cursor: 'pointer',
                          ...boxProps?.sx
                      }}
                      onClick={() => setShowDetailDialog(true)}
                      
                  >
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
                          value={dailyProgress}
                          size={48}
                          thickness={3}
                          sx={{
                              color: theme.palette.warning.main,
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
                              <Typography
                                  variant="h6"
                                  component="div"
                                  sx={{
                                      lineHeight: 1,
                                      fontSize: '1rem'
                                  }}
                              >
                                  🔥
                              </Typography>
                              <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                      fontSize: '0.6rem',
                                      opacity: 0.9,
                                      fontWeight: 600,
                                      lineHeight: 1
                                  }}
                              >
                                  {dailyXp}/{currentGoal}
                              </Typography>
                          </Stack>
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
                              minWidth: 380,
                              maxWidth: 'none',
                              width: 'auto',
                              // Use full device width on mobile
                              '@media (max-width: 600px)': {
                                  minWidth: '100%',
                                  width: '100%',
                                  margin: 0,
                                  maxHeight: '100%',
                                  borderRadius: 0
                              }
                          }
                      }}
                  >
                      {renderDetailDialogContent()}
                  </Dialog>
              </>
          );
      }
  
      // Linear variant
      return (
          <Stack spacing={1} sx={{ width: '100%' }}>
              <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ width: '100%' }}
              >
                  <Txt
                      variant="body2"
                      color={dailyXp >= (currentGoal || 0) ? "warning.main" : "textSecondary"}
                      startIcon={
                          <Typography
                              variant="body2"
                              sx={{
                                  lineHeight: 1,
                                  fontSize: '1.1rem'
                              }}
                          >
                              🔥
                          </Typography>
                      }
                  >
                      Daily Goal
                  </Txt>
                  <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                          fontWeight: 600,
                          opacity: 0.9
                      }}
                  >
                      {dailyXp} {dailyXp < (currentGoal || 0) && `/ ${currentGoal} XP`}
                  </Typography>
              </Stack>
              <Box sx={{ width: '100%' }}>
                  <LinearProgress
                      variant="determinate"
                      value={dailyProgress}
                      sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.action.hover,
                          '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: theme.palette.warning.main,
                              transition: 'transform 0.3s ease-in-out',
                          }
                      }}
                  />
              </Box>
          </Stack>
      );
  }