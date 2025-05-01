import {
  useMediaQuery,
  useTheme,
} from "@mui/material";

export default function useIsSmallDevice() {
  const theme = useTheme();
  
  return useMediaQuery(() => theme.breakpoints.down('sm'));
}