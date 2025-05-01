import { useEffect } from 'react';

import { useSupabase } from '@/contexts/SupabaseContext';

/**
 * Hook that stores the Supabase authentication token in Chrome storage
 * whenever the user is authenticated. This allows background scripts
 * to access the token for API requests without needing complex content scripts.
 */
export function useStoreAuthToken() {
  const { supabase } = useSupabase();
  
  useEffect(() => {
    // Store the initial session if available
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        console.log('[RSN_AUTH] Storing initial auth token in Chrome storage');
        chrome.storage.local.set({ authToken: session.access_token }, () => {
          if (chrome.runtime.lastError) {
            console.error('[RSN_AUTH] Error storing auth token:', chrome.runtime.lastError);
          } else {
            console.log('[RSN_AUTH] Auth token stored successfully');
          }
        });
      }
    });

    // Listen for auth changes and update the token in storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        console.log('[RSN_AUTH] Auth state changed, updating token in Chrome storage');
        chrome.storage.local.set({ authToken: session.access_token }, () => {
          if (chrome.runtime.lastError) {
            console.error('[RSN_AUTH] Error updating auth token:', chrome.runtime.lastError);
          } else {
            console.log('[RSN_AUTH] Auth token updated successfully');
          }
        });
      }
      else {
        console.log('[RSN_AUTH] Auth state changed, no token found');
        chrome.storage.local.remove('authToken', () => {
          if (chrome.runtime.lastError) {
            console.error('[RSN_AUTH] Error removing auth token:', chrome.runtime.lastError);
          } else {
            console.log('[RSN_AUTH] Auth token removed successfully');
          }
        });
      }
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
} 