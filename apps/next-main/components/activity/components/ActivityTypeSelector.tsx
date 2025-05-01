import {
  useCallback,
  useEffect,
  useState,
} from "react";

import _ from "lodash";

import {
  Chip,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  ActivityTypesInternalOnlySchema,
  ActivityTypesPublic,
} from "@reasonote/core";

import {ActivityTypeIndicator} from "../ActivityTypeIndicator";
import {
  getActivityTypeDescription,
} from "../constants/activityTypeDescriptions";

export interface ActivityTypeSelectorProps {
    enabledActivityTypes: string[];
    onActivityTypeChange: (activityTypes: string[]) => any;
    allowInternalActivities?: boolean;
}

export function ActivityTypeSelector({
    enabledActivityTypes,
    onActivityTypeChange,
    allowInternalActivities,
}: ActivityTypeSelectorProps) {
    const theme = useTheme();

    // Local state for optimistic UI updates
    const [localEnabledTypes, setLocalEnabledTypes] = useState<string[]>(enabledActivityTypes);

    // Update local state when props change
    useEffect(() => {
        setLocalEnabledTypes(enabledActivityTypes);
    }, [enabledActivityTypes]);

    const enabledTypesSet = new Set(localEnabledTypes);

    // Filter activity types only when allowInternalActivities changes
    const filteredActivityTypes = useCallback(() => {
        return ActivityTypesPublic.filter((actType) =>
            allowInternalActivities ? true : !ActivityTypesInternalOnlySchema.safeParse(actType).success
        );
    }, [allowInternalActivities])();

    // Optimize the toggle function with useCallback to prevent recreating on every render
    const handleToggle = useCallback((activityType: string) => {
        // Immediately update local state for responsive UI
        if (enabledTypesSet.has(activityType)) {
            // Remove the activity type
            const newTypes = localEnabledTypes.filter(type => type !== activityType);
            setLocalEnabledTypes(newTypes);
            // Asynchronously update parent state
            setTimeout(() => {
                onActivityTypeChange(newTypes);
            }, 0);
        } else {
            // Add the activity type
            const newTypes = [...localEnabledTypes, activityType];
            setLocalEnabledTypes(newTypes);
            // Asynchronously update parent state
            setTimeout(() => {
                onActivityTypeChange(newTypes);
            }, 0);
        }
    }, [localEnabledTypes, enabledTypesSet, onActivityTypeChange]);

    return (
        <Stack
            direction="row"
            flexWrap="wrap"
            justifyContent="center"
            gap={0.5}
            sx={{ p: 1 }}
        >
            {filteredActivityTypes.map((actType) => {
                const isSelected = enabledTypesSet.has(actType);
                const description = getActivityTypeDescription(actType);

                return (
                    <Tooltip
                        key={actType}
                        title={description}
                        arrow
                        placement="top"
                    >
                        <Chip
                            label={
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    sx={{ px: 0.25 }}
                                >
                                    <ActivityTypeIndicator activityType={actType} />
                                </Stack>
                            }
                            onClick={() => handleToggle(actType)}
                            size="small"
                            sx={{
                                height: '24px',
                                backgroundColor: isSelected
                                    ? theme.palette.primary.main
                                    : theme.palette.gray.light,
                                color: isSelected
                                    ? theme.palette.primary.contrastText
                                    : theme.palette.text.secondary,
                                '&:hover': {
                                    backgroundColor: isSelected
                                        ? theme.palette.primary.dark
                                        : theme.palette.gray.main,
                                }
                            }}
                        />
                    </Tooltip>
                );
            })}
        </Stack>
    );
}