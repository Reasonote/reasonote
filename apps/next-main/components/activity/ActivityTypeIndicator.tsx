import {
  Chip,
  ChipProps,
  Stack,
  SvgIconProps,
  Typography,
  TypographyProps,
} from "@mui/material";

import {
  useActivityTypeClient,
} from "./activity-type-clients/useActivityTypeClient";

export function ActivityTypeIndicatorDumb({icon, text, typographyProps}: {icon: React.ReactNode, text: string, typographyProps?: TypographyProps}) {
    return (
      <Stack direction="row" alignItems={'center'} gap={.5}>
        {icon}
        <Typography {...typographyProps}>{text}</Typography>
      </Stack>
    );
}

export function ActivityTypeIcon({activityType, iconProps}: {activityType: string | null | undefined, iconProps?: SvgIconProps}) {
  const {data: {client}} = useActivityTypeClient({activityType: activityType as any});

  return client?.renderTypeIcon(iconProps ?? {}) ?? null;
}

export function ActivityTypeIndicator({ activityType, iconProps, typographyProps }: { activityType: string | null | undefined, iconProps?: SvgIconProps, typographyProps?: TypographyProps }) {
  const {data: {definition}} = useActivityTypeClient({activityType: activityType});
    
    return (
      <Stack direction="row" alignItems={'center'} gap={.5}>
          <ActivityTypeIndicatorDumb 
            icon={<ActivityTypeIcon activityType={activityType} iconProps={iconProps}/>}
            typographyProps={typographyProps}
            text={definition?.typeHumanName ?? 'Unknown'}
          />
      </Stack>
    );
}

export function ActivityTypeIndicatorChip({ activityType, iconProps, typographyProps, chipProps }: { activityType: string | null | undefined, iconProps?: SvgIconProps, typographyProps?: TypographyProps, chipProps?: ChipProps }) {
    return <Chip 
      label={<ActivityTypeIndicator activityType={activityType} iconProps={iconProps} typographyProps={typographyProps}/>} {...chipProps}
    />
}