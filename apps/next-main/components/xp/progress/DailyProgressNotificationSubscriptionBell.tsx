'use client';

import {
  useEffect,
  useState,
} from "react";

import {
  NotificationSubscriptionsRoute,
} from "@/app/api/notification-subscriptions/routeSchema";
import {usePushNotifications} from "@/clientOnly/hooks/usePushNotifications";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  Add,
  CheckCircle,
  NotificationsActive,
  NotificationsOff,
} from "@mui/icons-material";
import {
  Alert,
  Badge,
  Box,
  Snackbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

interface DailyProgressNotificationSubscriptionBellProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onClick?: () => void;
}

export default function DailyProgressNotificationSubscriptionBell({ 
  size = 'medium', 
  showLabel = false,
  onClick
}: DailyProgressNotificationSubscriptionBellProps) {
  const theme = useTheme();
  const { rsnUserId } = useRsnUser();
  const [notificationSubscribed, setNotificationSubscribed] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const {supabase} = useSupabase();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  
  // Use our new hook for push notifications
  const {
    isSupported,
    isPermissionGranted,
    isEnabledOnDevice,
    isLoading: pushLoading,
    enablePushNotifications,
    disablePushNotifications,
  } = usePushNotifications();

  // Fetch notification subscription status
  useEffect(() => {
    if (!rsnUserId) return;

    async function fetchNotificationStatus() {
      try {
        if (!rsnUserId) {
          console.log('No rsnUserId');
          return;
        }
        setNotificationLoading(true);
        const { data: result, error } = await supabase.rpc(
            'get_or_create_notification_subscription',
            { p_user_id: rsnUserId }
          );

        if (result?.[0]) {
          console.log('get_or_create_notification_subscription result', result);
          setNotificationSubscribed(result[0].daily_streak);
        }
      } catch (error) {
        console.error('Error loading notification subscriptions:', error);
      } finally {
        setNotificationLoading(false);
      }
    }

    fetchNotificationStatus();
  }, [rsnUserId]);

  // Toggle notification subscription
  const toggleNotificationSubscription = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!rsnUserId) return;
    
    try {
      setNotificationLoading(true);
      const newStatus = !notificationSubscribed;
      
      const result = await NotificationSubscriptionsRoute.call({
        daily_streak: newStatus,
      });
      
      if (result.data) {
        setNotificationSubscribed(result.data.daily_streak);
        console.debug('notificationSubscribed', notificationSubscribed);
        console.debug('newStatus', newStatus);
        console.debug('isSupported', isSupported);
        // If user is subscribing, try to enable push notifications
        if (newStatus && isSupported) {
          handleEnablePushNotifications();
        } else if (!newStatus) {
          showSnackbar('Daily streak notifications disabled', 'info');
        }
      }
    } catch (error) {
      console.error('Error updating notification subscriptions:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  // Helper function to show snackbar with appropriate severity
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle enabling push notifications
  const handleEnablePushNotifications = async () => {
    try {
      console.debug('handleEnablePushNotifications');
      
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext = window.isSecureContext;
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext && !isLocalhost) {
        console.error('Push notifications require HTTPS or localhost');
        showSnackbar('Push notifications require a secure connection (HTTPS)', 'error');
        return;
      }
      
      // Check current permission status
      if (typeof Notification !== 'undefined') {
        console.log('Current notification permission:', Notification.permission);
        
        // Check if we're on Android
        const isAndroid = /android/i.test(navigator.userAgent);
        
        // If permission is denied, show a message with error severity
        // On Android, we'll try requesting permission even if it shows as "denied"
        if (Notification.permission === 'denied' && !isAndroid) {
          showSnackbar('Please enable notifications in your browser settings', 'error');
          return;
        }
        
        // If permission is not granted yet or we're on Android, request it
        if (Notification.permission !== 'granted' || isAndroid) {
          console.log('Requesting notification permission...');
          try {
            const permission = await Notification.requestPermission();
            console.debug('Permission result:', permission);
            
            if (permission !== 'granted') {
              console.debug('Push notification permission was denied by the user');
              showSnackbar('Notification permission denied', 'error');
              return;
            }
          } catch (error) {
            console.error('Error requesting notification permission:', error);
            // On Android, we might need to handle this differently
            if (isAndroid) {
              showSnackbar('Please check your notification settings in Chrome', 'info');
            } else {
              showSnackbar('Error requesting notification permission', 'error');
            }
            return;
          }
        }
      } else {
        console.error('Notification API not supported in this browser');
        showSnackbar('Notifications not supported in this browser', 'error');
        return;
      }
      
      // Then enable push notifications through our hook
      const success = await enablePushNotifications();
      
      if (success) {
        showSnackbar('Daily streak notifications enabled', 'success');
      } else {
        showSnackbar('Failed to enable notifications', 'error');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      showSnackbar('Error enabling notifications', 'error');
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: '16px',
      badgeIconSize: '12px',
      boxSize: 'auto'
    },
    medium: {
      iconSize: '20px',
      badgeIconSize: '14px',
      boxSize: 'auto'
    },
    large: {
      iconSize: '28px',
      badgeIconSize: '16px',
      boxSize: 'auto'
    }
  };

  if (notificationLoading || pushLoading) return null;

  // Determine the icon and badge to show based on subscription and push notification status
  const getBadgeContent = () => {
    if (notificationSubscribed) {
      if (isSupported && isEnabledOnDevice) {
        // Subscribed and push notifications enabled
        return (
          <CheckCircle 
            fontSize="small" 
            sx={{ 
              color: theme.palette.success.main,
              backgroundColor: theme.palette.background.paper,
              borderRadius: '50%',
              fontSize: sizeConfig[size].badgeIconSize
            }} 
          />
        );
      } else if (isSupported) {
        // Subscribed but push notifications not enabled
        return (
          <NotificationsOff 
            fontSize="small" 
            sx={{ 
              color: theme.palette.warning.main,
              backgroundColor: theme.palette.background.paper,
              borderRadius: '50%',
              fontSize: sizeConfig[size].badgeIconSize
            }} 
          />
        );
      }
    }
    
    // Not subscribed
    return (
      <Add 
        fontSize="small" 
        sx={{ 
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.background.paper,
          borderRadius: '50%',
          fontSize: sizeConfig[size].badgeIconSize
        }} 
      />
    );
  };

  const getTooltipText = () => {
    if (notificationSubscribed) {
      if (isSupported && !isEnabledOnDevice) {
        return "Enable push notifications for daily reminders";
      }
      return "Unsubscribe from daily reminders";
    }
    return "Subscribe to daily reminders";
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          cursor: 'pointer',
          ...(showLabel && { padding: 1, borderRadius: 2 }),
          ...(showLabel && { 
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          })
        }}
        onClick={(e) => {
          if (onClick) {
            onClick();
          } else if (notificationSubscribed && isSupported && !isEnabledOnDevice) {
            // If subscribed but push notifications not enabled, try to enable them
            handleEnablePushNotifications();
          } else {
            toggleNotificationSubscription(e);
          }
        }}
      >
        <Tooltip title={getTooltipText()}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={getBadgeContent()}
          >
            <NotificationsActive 
              sx={{ 
                fontSize: sizeConfig[size].iconSize,
                color: notificationSubscribed 
                  ? (isSupported && isEnabledOnDevice 
                    ? theme.palette.success.main 
                    : theme.palette.warning.main)
                  : theme.palette.text.secondary
              }} 
              data-testid="notifications-icon"
            />
          </Badge>
        </Tooltip>
        
        {showLabel && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            {notificationSubscribed 
              ? (isSupported && isEnabledOnDevice 
                ? "Daily reminders enabled" 
                : "Enable push notifications")
              : "Enable daily reminders"}
          </Typography>
        )}
      </Box>

      {/* Feedback Snackbar with severity */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 