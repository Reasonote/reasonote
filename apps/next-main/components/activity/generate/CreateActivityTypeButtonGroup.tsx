import {
  useActivityTypeClient,
} from "@/components/activity/activity-type-clients/useActivityTypeClient";
import {ActivityTypeIcon} from "@/components/activity/ActivityTypeIndicator";
import {
  Button,
  Grid,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  ActivityType,
  ActivityTypesPublic,
} from "@reasonote/core";

import {
  getActivityTypeDescription,
} from "../constants/activityTypeDescriptions";

export interface CreateActivityTypeButtonGroupProps {
    onActivityTypeCreate: (activityType: ActivityType) => any;
    disabled?: boolean;
    gridContainerProps?: React.ComponentProps<typeof Grid>;
}

function CreateActivityButtonGroupButton({ activityType, onActivityTypeCreate, disabled }: { activityType: ActivityType, onActivityTypeCreate: (activityType: ActivityType) => any, disabled?: boolean }) {
    const { data: { definition } } = useActivityTypeClient({ activityType: activityType });
    const description = getActivityTypeDescription(activityType, definition?.typeHumanName);

    return <Grid item>
        <Tooltip title={description} arrow placement="top">
            <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => {
                    onActivityTypeCreate(activityType);
                }}
                disabled={disabled}
                sx={{
                    textTransform: 'none'
                }}

            >
                <Stack direction="row">
                    + <ActivityTypeIcon activityType={activityType} />
                </Stack>
            </Button>
        </Tooltip>
    </Grid>;
}

export function CreateActivityTypeButtonGroup({
    onActivityTypeCreate,
    disabled,
    gridContainerProps,
}: CreateActivityTypeButtonGroupProps) {
    return <Grid gap={1} {...gridContainerProps} container>
        {ActivityTypesPublic.map((ex) => {
            return <CreateActivityButtonGroupButton key={ex} activityType={ex} onActivityTypeCreate={onActivityTypeCreate} disabled={disabled} />
        })}
    </Grid>
}