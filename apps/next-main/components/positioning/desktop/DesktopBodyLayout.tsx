import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Stack,
  useTheme,
} from "@mui/material";

export function DesktopBodyLayout({children, disableBottomBar = false, disableHeader = false}: {children: React.ReactNode, disableBottomBar?: boolean, disableHeader?: boolean}) {
    const isSmallDevice = useIsSmallDevice();
    const theme = useTheme();

    const effectiveHeaderHeight = disableHeader ? 0 : (isSmallDevice ? 56 : 64);
    const effectiveBottomBarHeight = disableBottomBar ? 0 : (isSmallDevice ? 48 : 0);

    const bodyHeight = `calc(100dvh - ${effectiveHeaderHeight + effectiveBottomBarHeight}px)`;
    return <Stack sx={{
            height: bodyHeight,
            width: '100vw',
            backgroundColor: theme.palette.background.paper,
        }}>
            {children}
    </Stack>
}