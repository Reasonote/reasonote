import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {AutoAwesome} from "@mui/icons-material";
import {Chip} from "@mui/material";
import {
  useActivityFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

export function ActivitySourceIndicator({activityId}: {activityId: string}){
    const userId = useRsnUserId();
    const {data: activity, loading: activityLoading} = useActivityFlatFragLoader(activityId);
    const wasMadeForUser = activity?.generatedForUser === userId;
    

    return wasMadeForUser ? <Chip 
        size="small" 
        icon={
            <AutoAwesome color="primary" sx={{width: '15px', height: '15px'}}/>
        }
        label={"Made for You"}
        deleteIcon={<CurUserAvatar sx={{width: '15px', height: '15px'}}/>}
        onDelete={() => {}}
    /> : <Chip
        size="small"
        icon={
            <AutoAwesome color="primary" sx={{width: '15px', height: '15px'}}/>
        }
        label={"Generated"}
    />
}