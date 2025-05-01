'use client';

import React, {
  useEffect,
  useState,
} from "react";

import {
  GetNotificationSubscriptionsRoute,
  NotificationSubscriptionsRoute,
} from "@/app/api/notification-subscriptions/routeSchema";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

interface NotificationSubscription {
  id: string;
  rsn_user_id: string;
  daily_streak: boolean;
  created_date: string;
  updated_date: string;
}

export default function NotificationSubscriptionSettings() {
  const { rsnUserId } = useRsnUser();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription | null>(null);
  const [dailyStreakEnabled, setDailyStreakEnabled] = useState(false);

  // Load user's notification subscriptions
  useEffect(() => {
    if (!rsnUserId) return;

    async function loadSubscriptions() {
      try {
        setLoading(true);
        const result = await GetNotificationSubscriptionsRoute.call({});
        if (result.data) {
          setSubscriptions(result.data as NotificationSubscription);
          setDailyStreakEnabled(result.data.daily_streak);
        }
      } catch (error) {
        console.error('Error loading notification subscriptions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSubscriptions();
  }, [rsnUserId]);

  // Update notification subscription preferences
  const handleDailyStreakChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setDailyStreakEnabled(checked);

    try {
      const result = await NotificationSubscriptionsRoute.call({
        daily_streak: checked,
      });
      if (result.data) {
        setSubscriptions(result.data as NotificationSubscription);
      }
    } catch (error) {
      console.error('Error updating notification subscriptions:', error);
      // Revert UI state if update fails
      setDailyStreakEnabled(!checked);
    }
  };

  if (!rsnUserId) {
    return null;
  }

  return (
    <Box position="relative">
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={dailyStreakEnabled}
              onChange={handleDailyStreakChange}
              disabled={loading}
              color="primary"
            />
          }
          label={
            <Stack spacing={0.5}>
              <Typography variant="body1">Daily Streak Reminders</Typography>
              <Typography variant="caption" color="text.secondary">
                Receive a daily reminder to maintain your learning streak
              </Typography>
            </Stack>
          }
        />
      </FormGroup>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Note: You'll need to enable push notifications in your browser to receive these notifications.
      </Typography>
    </Box>
  );
} 