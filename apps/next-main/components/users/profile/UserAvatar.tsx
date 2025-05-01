import {
  useEffect,
  useState,
} from "react";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Avatar} from "@mui/material";

import {CurUserAvatar} from "./CurUserAvatar";

export function UserAvatar({rsnUserId}: {rsnUserId: string}) {
    const currentRsnUserId = useRsnUserId();
    const {sb} = useSupabase();
    const [initials, setInitials] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    useEffect(() => {
        // Get both user info and profile image in one query
        sb.from('user_profile')
          .select(`
            profile_image_url,
            rsn_user:rsn_user (
              given_name,
              family_name
            )
          `)
          .eq('rsn_user_id', rsnUserId)
          .single()
          .then(({data}) => {
            setProfileImageUrl(data?.profile_image_url ?? null);
            setInitials(`${data?.rsn_user?.given_name?.[0] ?? ''}${data?.rsn_user?.family_name?.[0] ?? ''}`);
          });
    }, [rsnUserId, sb]);

    return currentRsnUserId === rsnUserId ?
        <CurUserAvatar /> :
        <Avatar src={profileImageUrl || undefined}>
            {initials}
        </Avatar>;
}
