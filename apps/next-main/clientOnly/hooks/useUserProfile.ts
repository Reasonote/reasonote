"use client";

import {useCallback} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Database} from "@reasonote/lib-sdk";

import {useRsnUser} from "./useRsnUser";

export type UserProfile = Database['public']['Tables']['user_profile']['Row'];
export type UserProfileUpdate = Database['public']['Tables']['user_profile']['Update'];

export function useUserProfile() {
  const { supabase } = useSupabase();
  const { rsnUserId } = useRsnUser();

  const getUserProfileByUsername = useCallback(async (username: string) => {
    return await supabase
      .from('user_profile')
      .select('*')
      .eq('username', username)
      .single();
  }, [supabase]);

  const updateUserProfile = useCallback(async (updates: UserProfileUpdate) => {
    if (!rsnUserId) return { error: new Error('No user logged in') };

    return await supabase
      .from('user_profile')
      .update(updates)
      .eq('rsn_user_id', rsnUserId)
      .select()
      .single();
  }, [supabase, rsnUserId]);

  const updatePinnedItems = useCallback(async (action: 'add' | 'remove', itemId: string) => {
    if (!rsnUserId) return { error: new Error('No user logged in') };

    // First get current pinned items
    const { data: profile } = await supabase
      .from('user_profile')
      .select('pinned_items')
      .eq('rsn_user_id', rsnUserId)
      .single();

    const currentPinnedItems = profile?.pinned_items || [];
    let newPinnedItems = [...currentPinnedItems];

    if (action === 'add' && !currentPinnedItems.includes(itemId)) {
      newPinnedItems.push(itemId);
    } else if (action === 'remove') {
      newPinnedItems = newPinnedItems.filter(id => id !== itemId);
    }

    return await supabase
      .from('user_profile')
      .update({ pinned_items: newPinnedItems })
      .eq('rsn_user_id', rsnUserId)
      .select()
      .single();
  }, [supabase, rsnUserId]);

  return {
    getUserProfileByUsername,
    updateUserProfile,
    updatePinnedItems,
  };
} 