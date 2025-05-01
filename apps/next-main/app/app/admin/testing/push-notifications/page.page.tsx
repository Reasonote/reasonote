'use client';

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  PushNotificationSendDailyStreakRoute,
} from "@/app/api/push-notifications/send-daily-streak/routeSchema";
import {
  PushNotificationSendSelfNotificationRoute,
} from "@/app/api/push-notifications/send-self-notification/routeSchema";
import {
  PushNotificationSendToUserRoute,
} from "@/app/api/push-notifications/send-to-user/routeSchema";
import {
  PushNotificationSubscribeRoute,
} from "@/app/api/push-notifications/subscribe/routeSchema";
import {
  PushNotificationGetSubscriptionsRoute,
} from "@/app/api/push-notifications/subscriptions/routeSchema";
import {
  PushNotificationUnsubscribeRoute,
} from "@/app/api/push-notifications/unsubscribe/routeSchema";
import {
  PushNotificationUsersWithSubscriptionsRoute,
} from "@/app/api/push-notifications/users-with-subscriptions/routeSchema";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import AlarmIcon from "@mui/icons-material/Alarm";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SendIcon from "@mui/icons-material/Send";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

export default function PushNotificationTest() {
  const [isSubscribed, setIsSubscribed] = useState<any>(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSHomeScreen, setIsIOSHomeScreen] = useState(false);
  const [serviceWorkerSupported, setServiceWorkerSupported] = useState(false);
  const [iosVersion, setIOSVersion] = useState<number | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const { rsnUserId, rsnUserSysdata } = useRsnUser();
  
  // New state for admin section
  const [usersWithSubscriptions, setUsersWithSubscriptions] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationUrl, setNotificationUrl] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationResult, setNotificationResult] = useState<any>(null);

  // New state for notification icon
  const [notificationIcon, setNotificationIcon] = useState('');
  
  // New state for daily streak notifications
  const [sendingDailyStreakNotification, setSendingDailyStreakNotification] = useState(false);
  const [dailyStreakNotificationResult, setDailyStreakNotificationResult] = useState<any>(null);

  useEffect(() => {
    // Detect iOS and version
    const userAgent = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Extract iOS version if available
    if (iOS) {
      const match = userAgent.match(/OS (\d+)_/);
      if (match && match[1]) {
        setIOSVersion(parseInt(match[1], 10));
      }
    }
    
    // Check if running as installed PWA on iOS
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true || 
      document.referrer.includes('ios-app://') ||
      window.location.href.includes('homescreen=1');
    
    console.log('iOS detection:', { 
      iOS, 
      iosVersion: iosVersion,
      standalone: (window.navigator as any).standalone,
      matchMedia: window.matchMedia('(display-mode: standalone)').matches,
      referrer: document.referrer.includes('ios-app://'),
      isStandalone
    });
    
    setIsIOSHomeScreen(iOS && isStandalone);
    
    // Check if service worker is supported
    const isServiceWorkerSupported = 'serviceWorker' in navigator;
    const isPushSupported = 'PushManager' in window;
    
    console.log('Service Worker and Push support:', {
      serviceWorker: isServiceWorkerSupported,
      pushManager: isPushSupported
    });
    
    setServiceWorkerSupported(isServiceWorkerSupported && isPushSupported);
    
    // Register service worker with more robust error handling
    if (isServiceWorkerSupported) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('Service Worker registered successfully', reg);
          setRegistration(reg);
          
          // Force update service worker if needed
          if (reg.waiting) {
            console.log('New service worker waiting');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          return reg.pushManager.getSubscription();
        })
        .then(sub => {
          if (sub) {
            console.log('User already subscribed to push notifications', sub);
            setIsSubscribed(true);
            setSubscription(sub);
          } else {
            console.log('User not subscribed to push notifications');
          }
        })
        .catch(err => {
          console.error('Service Worker registration failed:', err);
          setRegistrationError(err.message);
        });
    } else {
      console.warn('Service Worker or Push API not supported in this browser');
    }
    
    // Load user's subscriptions if logged in
    if (rsnUserId) {
      loadSubscriptions();
    
    }
  }, [rsnUserId]);

  // Function to load user's subscriptions
  const loadSubscriptions = useCallback(async () => {
    console.log("Loading subscriptions");
    if (!rsnUserId) return;
    
    setIsLoadingSubscriptions(true);
    try {
      console.log("Loading subscriptions 2");
      const result = await PushNotificationGetSubscriptionsRoute.call({});
      // Access the data directly from the response
      setSubscriptions(result?.data?.subscriptions || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  }, [rsnUserId]);

  async function subscribeUser() {
    try {
      // Convert the base64 string to a Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      );
      
      const sub = await registration?.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      setSubscription(sub);
      setIsSubscribed(true);

      // Use our new API endpoint
      await PushNotificationSubscribeRoute.call(sub);
      
      // Refresh subscriptions list
      loadSubscriptions();

      console.log('User is subscribed:', sub);
    } catch (error) {
      console.error('Failed to subscribe the user:', error);
    }
  }

  async function unsubscribeUser() {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);
        console.log('User is unsubscribed');
        
        // Use our new API endpoint
        await PushNotificationUnsubscribeRoute.call(subscription);
        
        // Refresh subscriptions list
        loadSubscriptions();
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }

  // Helper function to convert base64 to Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function sendTestNotification() {
    if (!subscription) {
      console.error('No subscription available');
      return;
    }

    try {
      // Use our new API endpoint
      await PushNotificationSendSelfNotificationRoute.call({
        subscription,
        message: { 
          title: 'Test Notification', 
          body: 'This is a test notification!',
          icon: '/logo192.png' // Default icon path
        }
      });
      
      console.log('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Function to delete a subscription
  async function deleteSubscription(endpoint: string) {
    try {
      await PushNotificationUnsubscribeRoute.call({ endpoint, keys: { p256dh: '', auth: '' } });
      // Refresh subscriptions list
      loadSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  }

  // Force reload the page with a special query parameter to help with detection
  const reloadAsHomeScreen = () => {
    window.location.href = window.location.pathname + '?homescreen=1';
  };
  
  // Load users who have push notification subscriptions
  async function loadUsersWithSubscriptions() {
    console.log("Loading users with subscriptions");
    setIsLoadingUsers(true);
    try {
      const result = await PushNotificationUsersWithSubscriptionsRoute.call({});
      if (result.success === false) {
        console.error('Error loading users with subscriptions:', result.error);
        setUsersWithSubscriptions([]);
      } else {
        setUsersWithSubscriptions(result.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users with subscriptions:', error);
      setUsersWithSubscriptions([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }
  useEffect(() => {
    loadUsersWithSubscriptions();
  }, []);
  
  // Send notification to a specific user
  async function sendNotificationToUser() {
    if (!selectedUserId || !notificationTitle || !notificationBody) {
      return;
    }
    
    setSendingNotification(true);
    setNotificationResult(null);
    
    try {
      const result = await PushNotificationSendToUserRoute.call({
        userId: selectedUserId,
        title: notificationTitle,
        body: notificationBody,
        url: notificationUrl || undefined,
        icon: notificationIcon || undefined,
      });
      
      setNotificationResult(result);
      
      // Reset form if successful
      if (result.success) {
        setTimeout(() => {
          setNotificationTitle('');
          setNotificationBody('');
          setNotificationUrl('');
          setNotificationIcon('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
      setNotificationResult({
        success: false,
        error: 'Failed to send notification'
      });
    } finally {
      setSendingNotification(false);
    }
  }

  // Send daily streak notifications to all subscribed users
  async function sendDailyStreakNotifications() {
    setSendingDailyStreakNotification(true);
    setDailyStreakNotificationResult(null);
    
    try {
      const result = await PushNotificationSendDailyStreakRoute.call({});
      
      setDailyStreakNotificationResult(result);
    } catch (error) {
      console.error('Error sending daily streak notifications:', error);
      setDailyStreakNotificationResult({
        success: false,
        error: 'Failed to send daily streak notifications'
      });
    } finally {
      setSendingDailyStreakNotification(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, width: '100%' }}>
        <Typography variant="h4" gutterBottom>Push Notification Test</Typography>
        
        {isIOS && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Important iOS Limitation:</strong> Safari on iOS has limited support for Web Push Notifications.
            </Typography>
            <Typography variant="body2">
              As of iOS 16.4+, push notifications are supported but require:
              <ul>
                <li>The app must be added to the home screen</li>
                <li>The user must open the app from the home screen icon</li>
                <li>The user must grant notification permissions</li>
              </ul>
              <Link href="https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/" target="_blank" rel="noopener">
                Learn more about iOS Web Push
              </Link>
            </Typography>
          </Box>
        )}
        
        
        
        {registrationError && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Service Worker Error:</strong> {registrationError}
            </Typography>
          </Box>
        )}
        
        {!serviceWorkerSupported && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Error:</strong> This browser does not support Service Workers or Push API, which are required for push notifications.
            </Typography>
            {isIOS && iosVersion && iosVersion >= 16 && (
              <Typography variant="body2">
                Your iOS version ({iosVersion}) should support Web Push in PWAs. Make sure you've added the app to your home screen and opened it from there.
              </Typography>
            )}
          </Box>
        )}
        
        {isIOS && !isIOSHomeScreen && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body1" gutterBottom>
              <strong>iOS Users:</strong> To receive push notifications, you need to:
            </Typography>
            <ol>
              <li>Tap the share icon in Safari</li>
              <li>Select "Add to Home Screen"</li>
              <li>Open the app from your home screen</li>
            </ol>
          </Box>
        )}
        
        <Stack spacing={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Device: {isIOS ? `iOS ${iosVersion || ''}` : 'Not iOS'} | 
              Installed as PWA: {isIOSHomeScreen ? 'Yes' : 'No'} | 
              Service Worker Support: {serviceWorkerSupported ? 'Yes' : 'No'}
            </Typography>
          </Box>
          
          {isIOS && (
            <>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  // Force set as homescreen for testing
                  setIsIOSHomeScreen(true);
                  setServiceWorkerSupported(true);
                }}
              >
                Override Detection (For Testing)
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={reloadAsHomeScreen}
              >
                Reload as Home Screen App
              </Button>
            </>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={subscribeUser} 
            disabled={isSubscribed || (isIOS && !isIOSHomeScreen) || !serviceWorkerSupported}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe to Notifications'}
          </Button>
          
          {isSubscribed && (
            <Button 
              variant="outlined" 
              color="error" 
              onClick={unsubscribeUser}
            >
              Unsubscribe Current Device
            </Button>
          )}
          
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={sendTestNotification}
            disabled={!isSubscribed}
          >
            Send Test Notification
          </Button>
          
          {/* Display user's subscriptions */}
          {rsnUserId && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your Notification Subscriptions
              </Typography>
              
              {isLoadingSubscriptions ? (
                <Typography>Loading subscriptions...</Typography>
              ) : subscriptions.length > 0 ? (
                <List>
                  {subscriptions.map((sub, index) => (
                    <React.Fragment key={sub.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Tooltip title={sub._endpoint}>
                              <span>Device {index + 1}</span>
                            </Tooltip>
                          }
                          secondary={
                            <>
                              {sub.userAgent && (
                                <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                                  {sub.userAgent.substring(0, 50)}...
                                </Typography>
                              )}
                              <Typography variant="caption" component="span" sx={{ display: 'block' }}>
                                Added: {new Date(sub.createdDate).toLocaleString()}
                              </Typography>
                              {sub.lastUsedDate && (
                                <Typography variant="caption" component="span" sx={{ display: 'block' }}>
                                  Last used: {new Date(sub.lastUsedDate).toLocaleString()}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => deleteSubscription(sub._endpoint)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography>No subscriptions found.</Typography>
              )}
              
              <Button 
                variant="outlined" 
                startIcon={<NotificationsIcon />}
                onClick={loadSubscriptions}
                sx={{ mt: 2 }}
              >
                Refresh Subscriptions
              </Button>
            </Box>
          )}
          
          {/* Admin section for sending notifications to specific users */}
            <Accordion defaultExpanded sx={{ mt: 4 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="admin-panel-content"
                id="admin-panel-header"
              >
                <Typography variant="h6">Admin: Send Notifications to Users</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Add information about notification icons */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Notification Icons:</strong> You can customize the icon displayed in push notifications.
                  </Typography>
                  <Typography variant="body2">
                    <ul>
                      <li>Icons should be square PNG images (192x192px recommended)</li>
                      <li>The icon URL must be accessible to the user's browser</li>
                      <li>For best results, use an icon with transparency</li>
                      <li>If no icon is specified, the default app icon will be used</li>
                    </ul>
                    <strong>Note:</strong> Icon display varies by browser and operating system. Some platforms may show your icon in a small badge, while others may display it more prominently.
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {isLoadingUsers ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : usersWithSubscriptions.length > 0 ? (
                    <>
                      <Typography variant="subtitle1">
                        Select a user to send a notification to:
                      </Typography>
                      <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                        {usersWithSubscriptions.map((user) => (
                          <ListItem 
                            key={user.id}
                            button
                            selected={selectedUserId === user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            sx={{ 
                              bgcolor: selectedUserId === user.id ? 'action.selected' : 'transparent',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                          >
                            <ListItemText 
                              primary={user.email || user.id}
                              secondary={`${user.subscription_count} device${user.subscription_count !== 1 ? 's' : ''}`}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Button
                        variant="outlined"
                        startIcon={<NotificationsIcon />}
                        onClick={loadUsersWithSubscriptions}
                      >
                        Refresh User List
                      </Button>
                      
                      <Divider />
                      
                      <Typography variant="subtitle1">
                        Notification Content:
                      </Typography>
                      <TextField
                        label="Title"
                        fullWidth
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        disabled={!selectedUserId || sendingNotification}
                      />
                      <TextField
                        label="Message"
                        fullWidth
                        multiline
                        rows={2}
                        value={notificationBody}
                        onChange={(e) => setNotificationBody(e.target.value)}
                        disabled={!selectedUserId || sendingNotification}
                      />
                      <TextField
                        label="URL (optional)"
                        fullWidth
                        value={notificationUrl}
                        onChange={(e) => setNotificationUrl(e.target.value)}
                        disabled={!selectedUserId || sendingNotification}
                        placeholder="e.g., /app/dashboard"
                        helperText="Where to navigate when notification is clicked"
                      />
                      <TextField
                        label="Icon URL (optional)"
                        fullWidth
                        value={notificationIcon}
                        onChange={(e) => setNotificationIcon(e.target.value)}
                        disabled={!selectedUserId || sendingNotification}
                        placeholder="e.g., /logo192.png"
                        helperText="URL to the notification icon image"
                      />
                      
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={sendingNotification ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        onClick={sendNotificationToUser}
                        disabled={!selectedUserId || !notificationTitle || !notificationBody || sendingNotification}
                      >
                        Send Notification
                      </Button>
                      
                      {notificationResult && (
                        <Alert 
                          severity={notificationResult.success ? "success" : "error"}
                          sx={{ mt: 2 }}
                        >
                          {notificationResult.success 
                            ? `Successfully sent to ${notificationResult.sent} device(s)${notificationResult.failed > 0 ? ` (${notificationResult.failed} failed)` : ''}` 
                            : `Error: ${notificationResult.error || 'Failed to send notification'}`}
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert severity="info">
                      No users with push notification subscriptions found.
                    </Alert>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* New section for sending daily streak notifications */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="daily-streak-panel-content"
                id="daily-streak-panel-header"
              >
                <Typography variant="h6">Admin: Send Daily Streak Notifications</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Daily Streak Notifications:</strong> Send reminders to all users who have subscribed to daily streak notifications.
                  </Typography>
                  <Typography variant="body2">
                    This will send a notification to all users who have:
                    <ul>
                      <li>Enabled daily streak notifications in their settings</li>
                      <li>Have at least one active push notification subscription</li>
                    </ul>
                    <strong>Note:</strong> This action is restricted to admin users only. The system will automatically verify your admin status.
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={sendingDailyStreakNotification ? <CircularProgress size={20} color="inherit" /> : <AlarmIcon />}
                    onClick={sendDailyStreakNotifications}
                    disabled={sendingDailyStreakNotification}
                  >
                    Send Daily Streak Notifications
                  </Button>
                  
                  {dailyStreakNotificationResult && (
                    <Alert 
                      severity={dailyStreakNotificationResult.success ? "success" : "error"}
                      sx={{ mt: 2 }}
                    >
                      {dailyStreakNotificationResult.success 
                        ? `Successfully sent to ${dailyStreakNotificationResult.sent} device(s)${dailyStreakNotificationResult.failed > 0 ? ` (${dailyStreakNotificationResult.failed} failed)` : ''}` 
                        : `Error: ${dailyStreakNotificationResult.error || 'Failed to send daily streak notifications'}`}
                    </Alert>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
        </Stack>
      </Paper>
    </Box>
  );
}