import {useCallback} from "react";

import {
  AddtoUserActivitySetRoute,
} from "@/app/api/activity/add_to_user_activity_set/routeSchema";
import {
  RemoveFromUserActivitySetRoute,
} from "@/app/api/activity/remove_from_user_activity_set/routeSchema";
import {useToken} from "@/clientOnly/hooks/useToken";
import {useUserActivities} from "@/clientOnly/hooks/useUserActivities";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {jwtBearerify} from "@lukebechtel/lab-ts-utils";
import {
  BookmarkAdded,
  BookmarkAddOutlined,
} from "@mui/icons-material";
import {
  Badge,
  IconButton,
  Tooltip,
} from "@mui/material";

export function AddToUserActivityLibraryButton({
    activityId,
    disableUserAvatarBadge = true
}: {
    activityId: string, 
    disableUserAvatarBadge?: boolean
}) {
    const {
        activities: userActivities,
        loading: loadingUserActivities,
        error: errorUserActivities,
        refetch: refetchUserActivities,
      } = useUserActivities();

    const {token} = useToken();
    
    const isInUserLibrary = userActivities?.some((activity) => activity.id === activityId);

    const onAddToLibrary = useCallback(async () => {
        const result = await AddtoUserActivitySetRoute.call({
            addIds: [activityId],
        }, {
            headers: {
                Authorization: jwtBearerify(token ?? '')
            }
        })

        refetchUserActivities();
    }, [activityId, token]);

    const onRemoveFromLibrary = useCallback(async () => {
        const result = await RemoveFromUserActivitySetRoute.call({
            removeActivityIds: [activityId],
        }, {
            headers: {
                Authorization: jwtBearerify(token ?? '')
            }
        })

        refetchUserActivities();
    }, [activityId, token]);

    
    return loadingUserActivities ? null : (
        isInUserLibrary ?
            <Tooltip title="Remove from Library">
                <IconButton onClick={onRemoveFromLibrary}>
                <Badge badgeContent={disableUserAvatarBadge ? null : <CurUserAvatar sx={{width: '15px', height: '15px'}}/>}>
                    
                    <BookmarkAdded color="primary"/>
                    
                </Badge>
                </IconButton>
            </Tooltip>
            :
            <Tooltip title="Add to Library">
                
                    <IconButton onClick={onAddToLibrary}>
                        <Badge badgeContent={disableUserAvatarBadge ? null : <CurUserAvatar sx={{width: '15px', height: '15px'}}/>}>
                            
                            <BookmarkAddOutlined />
                        </Badge>
                    </IconButton>
                
            </Tooltip>
    );
}