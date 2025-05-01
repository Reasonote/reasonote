
import {
  Paper,
  PaperProps,
  Stack,
  StackProps,
  useTheme,
} from "@mui/material";

import FullCenter from "./FullCenter";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

interface CenterPaperStackProps {
    children: React.ReactNode;
    sx?: any;
    paperProps?: PaperProps;
    stackProps?: StackProps;
}


export default function CenterPaperStack({children, sx, paperProps, stackProps}: CenterPaperStackProps) {
    const isSmallDevice = useIsSmallDevice()
    const theme = useTheme();

    return <FullCenter sx={sx}>
        <Paper 
            {...paperProps}
        >
            <Stack
                className="center-paper-stack"
                {...stackProps}
                sx={{
                    padding: '20px',
                    width: isSmallDevice ? "100vw" : theme.breakpoints.values["sm"],
                    height: isSmallDevice ? 'calc(~"100dvh - 56px");' : "fit-content",
                    alignContent: "center",
                    justifyContent: "center",
                    ...stackProps?.sx
                }}
            >
                {children}
            </Stack>
        </Paper>
    </FullCenter>
}