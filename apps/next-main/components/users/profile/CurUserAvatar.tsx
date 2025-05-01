import {
  useEffect,
  useState,
} from "react";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  Avatar,
  AvatarProps,
} from "@mui/material";

export function CurUserAvatar(props: AvatarProps) {
  const { rsnUserId } = useRsnUser();
  const { sb } = useSupabase();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (rsnUserId) {
      sb.from('user_profile')
        .select('profile_image_url')
        .eq('rsn_user_id', rsnUserId)
        .single()
        .then(({data}) => {
          setProfileImageUrl(data?.profile_image_url ?? null);
        });
    }
  }, [rsnUserId, sb]);

  return <Avatar src={profileImageUrl || undefined} {...props} />;
}
