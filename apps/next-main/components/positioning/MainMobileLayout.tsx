import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  PaperProps,
  StackProps,
} from "@mui/material";

import CenterPaperStack from "./FullCenterPaperStack";

interface MainMobileLayoutProps {
    children: React.ReactNode;
    sx?: any;
    paperProps?: PaperProps;
    stackProps?: StackProps;
}

// TODO: this should encapsulate breadcrumbs,
// and bottom-bar.

export function MainMobileLayout({children, sx, paperProps, stackProps}: MainMobileLayoutProps) {
    const isSmallDevice = useIsSmallDevice();

    return <CenterPaperStack 
        sx={{display: 'flex', flexGrow: 1, ...sx}}
        paperProps={{sx: {height: '100%'}, ...paperProps}}
        stackProps={{sx: {
            height: '100%',
            padding: isSmallDevice ? '10px' : '15px',
            paddingBottom: '0px',
            ...stackProps?.sx
        }}}
    >
        {children}
    </CenterPaperStack>
}