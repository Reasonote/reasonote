import {useTheme} from "@mui/material";

export function useDuration(duration: string) {
  const theme = useTheme();

  return theme.transitions.duration[duration];
}

export function useDurationMs(duration: string) {
  const theme = useTheme();

  return theme.transitions.duration[duration] * .001;
}

export function useDurationsMs() {
  const theme = useTheme();

  // Create object identical to theme.transitions.duration, but with values in ms
  const durationsMs = Object.keys(theme.transitions.duration).reduce((acc, duration) => {
    acc[duration] = theme.transitions.duration[duration as keyof typeof theme.transitions.duration] * .001;
    return acc;
  }, {} as Record<string, number>);

  return durationsMs;
}
