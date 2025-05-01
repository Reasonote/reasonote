import {useState} from "react";

import {
  useActivityTypeClient,
} from "@/components/activity/activity-type-clients/useActivityTypeClient";
import {
  ActivityTypeIndicator,
} from "@/components/activity/ActivityTypeIndicator";
import {
  Button,
  Grid,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  ActivityType,
  ActivityTypesPublic,
} from "@reasonote/core";

import {
  getActivityTypeDescription,
} from "../constants/activityTypeDescriptions";

export interface CreateActivityDropdownButtonProps {
  onActivityTypeCreate: (activityType: ActivityType) => any;
  buttonProps?: React.ComponentProps<typeof Button>;
  menuProps?: React.ComponentProps<typeof Menu>;
  menuItemProps?: React.ComponentProps<typeof MenuItem>;
  disabled?: boolean;
  disabledActivityTypes?: ActivityType[];
}

export function CreateActivityDropdownButtonMenuItem({ activityType, onActivityTypeCreate, disabled }: { activityType: ActivityType, onActivityTypeCreate: (activityType: ActivityType) => any, disabled?: boolean }) {
  const { data: { definition } } = useActivityTypeClient({ activityType: activityType });
  const description = getActivityTypeDescription(activityType, definition?.typeHumanName);

  return <MenuItem
    key={activityType}
    onClick={() => onActivityTypeCreate(activityType)}
    disabled={disabled}
  >
    <Tooltip title={description} arrow placement="right">
      <Grid container alignItems="center" wrap="nowrap">
        <ActivityTypeIndicator activityType={activityType} />
      </Grid>
    </Tooltip>
  </MenuItem>;
}

export const CreateActivityDropdownButton: React.FC<CreateActivityDropdownButtonProps> = ({
  onActivityTypeCreate,
  buttonProps,
  menuProps,
  menuItemProps,
  disabled,
  disabledActivityTypes
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (activityType: ActivityType) => {
    onActivityTypeCreate(activityType);
    handleClose();
  };

  return (
    <>
      <Button
        aria-controls="activity-type-menu"
        aria-haspopup="true"
        onClick={handleClick}
        {...buttonProps}
        disabled={disabled}
      >
        {buttonProps?.children || 'Create Activity'}
      </Button>
      <Menu
        id="activity-type-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        {...menuProps}
      >
        {ActivityTypesPublic.map((activityType) => (
          <CreateActivityDropdownButtonMenuItem
            key={activityType}
            activityType={activityType}
            onActivityTypeCreate={() => {
              onActivityTypeCreate(activityType);
              handleClose();
            }}
            disabled={disabledActivityTypes?.includes(activityType) || disabled}
          />
        ))}
      </Menu>
    </>
  );
};