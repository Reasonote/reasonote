import {
  useMediaQuery,
  useTheme,
} from "@mui/material";

export const ACTIVITY_MAX_HEIGHT_SMALL = "600px";
export const ACTIVITY_MAX_HEIGHT_MEDIUM = "800px";
export const ACTIVITY_MAX_HEIGHT_LARGE = "1000px";

export type ActivityMaxHeightModeArgument = 'constant' | 'viewport' | string;

export function useActivityMaxHeight(mode: ActivityMaxHeightModeArgument = 'constant'){
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const isMedium = useMediaQuery(theme.breakpoints.down("md"));
    const isLarge = useMediaQuery(theme.breakpoints.down("lg"));

    if (mode === 'constant'){
        if (isSmall){
            return ACTIVITY_MAX_HEIGHT_SMALL;
        }
        if (isMedium){
            return ACTIVITY_MAX_HEIGHT_MEDIUM;
        }
        if (isLarge){
            return ACTIVITY_MAX_HEIGHT_LARGE;
        }
        return ACTIVITY_MAX_HEIGHT_LARGE;
    }
    else if (mode === 'viewport'){
        return '90vh'
    }
    else {
        return mode;
    }
}