import {Stack, useTheme} from "@mui/material";

import {ActivityTypeIndicator} from "./ActivityTypeIndicator";

export interface ActivityHeaderSimpleProps {
    activity: {
        type: string | null | undefined;
    };
    rightOptions?: React.ReactNode;
}

export function ActivityHeaderSimple({activity, rightOptions}: ActivityHeaderSimpleProps){
    const theme = useTheme();
    return <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} padding={'4px'}>
        <Stack direction={'row'}>
            <ActivityTypeIndicator activityType={activity.type} iconProps={{htmlColor: theme.palette.text.secondary}} typographyProps={{variant: 'caption', color: theme.palette.text.secondary}}/> 
        </Stack>
        <Stack direction={'row'} gap={1} alignItems={'center'}>
            {rightOptions}
        </Stack>
    </Stack>
}