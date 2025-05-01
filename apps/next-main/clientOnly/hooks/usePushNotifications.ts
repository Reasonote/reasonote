'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  arrayBufferToBase64,
  urlBase64ToUint8Array,
} from "../../utils/encodingUtils";
import {useRsnUser} from "./useRsnUser";

interface UsePushNotificationsResult {
  /** Whether push notifications are supported by the browser */
  isSupported: boolean;
  /** Whether the user has granted permission for push notifications */
  isPermissionGranted: boolean;
  /** Whether push notifications are enabled on this device */
  isEnabledOnDevice: boolean;
  /** Whether we're currently checking the status */
  isLoading: boolean;
  /** More granular loading states for each operation */
  loadingStates: {
    checkingPermission: boolean;
    checkingSubscription: boolean;
    enabling: boolean;
    disabling: boolean;
  };
  /** Any error that occurred during the process */
  error: Error | null;
  /** Request permission and subscribe to push notifications */
  enablePushNotifications: () => Promise<boolean>;
  /** Unsubscribe from push notifications on this device */
  disablePushNotifications: () => Promise<boolean>;
}

/**
 * Hook to manage push notification permissions and subscriptions for the current device
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const { rsnUserId } = useRsnUser();
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isEnabledOnDevice, setIsEnabledOnDevice] = useState<boolean>(false);
  
  // Replace single loading state with granular loading states
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState<boolean>(false);
  const [isEnabling, setIsEnabling] = useState<boolean>(false);
  const [isDisabling, setIsDisabling] = useState<boolean>(false);
  
  const [error, setError] = useState<Error | null>(null);

  // Compute overall loading state
  const isLoading = isCheckingPermission || isCheckingSubscription || 
                    isEnabling || isDisabling;

  const isSupported = useMemo(() => {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;
    const isAndroid = /android/i.test(navigator.userAgent);

    console.debug('isSupported', (hasServiceWorker && hasPushManager) || (isAndroid && hasNotifications));  
    return (hasServiceWorker && hasPushManager) || (isAndroid && hasNotifications);
  }, []);

  // Add a new state to track if we're in fallback mode
  const [isServiceWorkerAvailable, setIsServiceWorkerAvailable] = useState<boolean>(true);

  // Check permission status
  useEffect(() => {
    const checkPermission = async () => {
      if (!isSupported) return;
      
      setIsCheckingPermission(true);
      
      try {
        // Just check the current permission status without requesting it
        if (typeof Notification !== 'undefined') {
          // This just reads the current permission without prompting
          const currentPermission = Notification.permission;
          setIsPermissionGranted(currentPermission === 'granted');
        }
      } catch (err) {
        console.error('Error checking notification permission:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsCheckingPermission(false);
      }
    };
    
    checkPermission();
  }, [isSupported]);

  // Check if this device is subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      console.debug('checking subscription');
      if (!isSupported) {
        console.debug('subscription not supported');
        return;
      }
      if (!rsnUserId) {
        console.debug('subscription no rsnUserId');
        return;
      }
      console.debug('subscription supported and rsnUserId');
      
      try {
        setIsCheckingSubscription(true);

        // Debug service worker registrations
        console.debug('Checking available service worker registrations...');
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.debug('Available service worker registrations:', registrations);
          console.debug('Number of registrations:', registrations.length);
          
          // Log details about each registration
          registrations.forEach((reg, index) => {
            console.debug(`Registration #${index + 1}:`, {
              scope: reg.scope,
              updateViaCache: reg.updateViaCache,
              active: !!reg.active,
              installing: !!reg.installing,
              waiting: !!reg.waiting
            });
          });
          
          // If no service workers are registered, try to register one
          if (registrations.length === 0) {
            console.debug('No service workers found, attempting to register one...');
            try {
              // Check if there's a service worker file at the root
              const swRegistration = await navigator.serviceWorker.register('/service-worker.js');
              console.debug('Service worker registered successfully:', swRegistration);
            } catch (regError) {
              console.error('Failed to register service worker:', regError);
            }
          }
        } catch (swError) {
          console.error('Error checking service worker registrations:', swError);
        }

        // Check if service worker is registered
        console.debug('subscription: waiting for service worker');
        
        // Add timeout to prevent getting stuck waiting for service worker
        let registration;
        try {
          // Create a promise that rejects after 5 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Service worker registration timed out after 5 seconds')), 5000);
          });
          
          // Race the service worker ready promise against the timeout
          registration = await Promise.race([
            navigator.serviceWorker.ready,
            timeoutPromise
          ]);
          
          setIsServiceWorkerAvailable(true);
          console.debug('subscription: service worker ready', registration);
          console.debug('Service worker ready details:', {
            scope: registration.scope,
            updateViaCache: registration.updateViaCache,
            active: !!registration.active,
            installing: !!registration.installing,
            waiting: !!registration.waiting
          });
        } catch (swError) {
          console.error('Service worker ready failed:', swError);
          // If we time out or encounter another error, we should stop the subscription check
          setIsEnabledOnDevice(false);
          setIsServiceWorkerAvailable(false);
          // Don't rethrow, instead handle gracefully
          console.log('Continuing without service worker - push notifications will be unavailable');
          return; // Exit the function early instead of throwing
        }

        // Check if there's an active push subscription
        console.debug('subscription: pushManager.getSubscription');
        const subscription = await registration.pushManager.getSubscription();
        console.debug('subscription: pushManager.getSubscription result', subscription);

        if (subscription) {
          // Verify with the server if this subscription is active
          console.debug('subscription: PushNotificationGetSubscriptionsRoute.call');
          const response = await PushNotificationGetSubscriptionsRoute.call({});
          console.debug('subscription: PushNotificationGetSubscriptionsRoute.call result', response);
          
          if (response.data && response.data.subscriptions.length > 0) {
            // Check if current subscription endpoint matches any server subscriptions
            const isSubscribed = response.data.subscriptions.some(
              sub => sub.endpoint === subscription.endpoint
            );
            setIsEnabledOnDevice(isSubscribed);
          } else {
            setIsEnabledOnDevice(false);
          }
        } else {
          console.debug('no subscription');
          setIsEnabledOnDevice(false);
        }
        console.debug('subscription end of try');
      } catch (err) {
        console.error('Error checking push subscription:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsCheckingSubscription(false);
      }
    };
    
    checkSubscription();
  }, [isSupported, rsnUserId]);

  // Enable push notifications
  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !rsnUserId) {
      return false;
    }
    
    if (!isServiceWorkerAvailable) {
      console.debug('Service worker not available, cannot enable push notifications');
      setError(new Error('Push notifications are not available on this device because the service worker could not be registered.'));
      return false;
    }
    
    try {
      setIsEnabling(true);
      setError(null);
      
      // We don't check or request permission here
      // The component should have already requested and received permission
      // Just update our state based on the current permission
      if (typeof Notification !== 'undefined') {
        setIsPermissionGranted(Notification.permission === 'granted');
        
        if (Notification.permission !== 'granted') {
          console.debug('Push notification permission not granted');
          return false;
        }
      } else {
        console.error('Notification API not supported in this browser');
        return false;
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription or create a new one
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Get public VAPID key
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!publicVapidKey) {
          throw new Error('VAPID public key not available');
        }
        
        console.log('Creating new push subscription...');
        
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });
        
        console.log('Subscription created:', subscription);
      }
      
      // Convert subscription to the format expected by the API
      const authKey = subscription.getKey('auth');
      const p256dhKey = subscription.getKey('p256dh');
      
      console.log('Sending subscription to server...');
      
      // Send subscription to server
      await PushNotificationSubscribeRoute.call({
        endpoint: subscription.endpoint,
        keys: {
          auth: authKey ? arrayBufferToBase64(authKey) : '',
          p256dh: p256dhKey ? arrayBufferToBase64(p256dhKey) : '',
        },
        expirationTime: subscription.expirationTime,
      });
      
      console.log('Subscription sent to server successfully');
      
      setIsEnabledOnDevice(true);
      return true;
    } catch (err) {
      console.error('Error enabling push notifications:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsEnabling(false);
    }
  }, [isSupported, rsnUserId, isServiceWorkerAvailable]);

  // Disable push notifications
  const disablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !rsnUserId) {
      return false;
    }
    
    try {
      setIsDisabling(true);
      setError(null);
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Get keys before unsubscribing
        const authKey = subscription.getKey('auth');
        const p256dhKey = subscription.getKey('p256dh');
        
        // Unsubscribe locally
        await subscription.unsubscribe();
        
        // Unsubscribe on server
        await PushNotificationUnsubscribeRoute.call({
          endpoint: subscription.endpoint,
          keys: {
            auth: authKey ? arrayBufferToBase64(authKey) : '',
            p256dh: p256dhKey ? arrayBufferToBase64(p256dhKey) : '',
          },
        });
      }
      
      setIsEnabledOnDevice(false);
      return true;
    } catch (err) {
      console.error('Error disabling push notifications:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsDisabling(false);
    }
  }, [isSupported, rsnUserId]);

  return {
    isSupported: isSupported && isServiceWorkerAvailable,
    isPermissionGranted,
    isEnabledOnDevice,
    isLoading,
    loadingStates: {
      checkingPermission: isCheckingPermission,
      checkingSubscription: isCheckingSubscription,
      enabling: isEnabling,
      disabling: isDisabling,
    },
    error,
    enablePushNotifications,
    disablePushNotifications,
  };
} 