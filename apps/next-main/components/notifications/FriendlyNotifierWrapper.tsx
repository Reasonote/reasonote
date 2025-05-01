import {motion} from "framer-motion";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Box} from "@mui/material";

interface FriendlyNotifierWrapperProps {
    children: React.ReactNode;
    isVisible: boolean;
    style?: Partial<React.CSSProperties>;
    motionProps?: {
        initial?: any;
        animate?: any;
        exit?: any;
        transition?: any;
    };
}

export function FriendlyNotifierWrapper({ 
    children, 
    isVisible,
    style,
    motionProps
}: FriendlyNotifierWrapperProps) {
    const isSmallDevice = useIsSmallDevice();

    return (
        <>
            {isVisible && (
                <motion.div
                    initial={motionProps?.initial ?? { y: 100, opacity: 0 }}
                    animate={motionProps?.animate ?? { y: 0, opacity: 1 }}
                    exit={motionProps?.exit ?? { y: 100, opacity: 0 }}
                    transition={motionProps?.transition ?? {
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                    }}
                    style={{
                        position: 'fixed',
                        left: isSmallDevice ? '1vw' : '20vw',
                        right: isSmallDevice ? '1vw' : '20vw',
                        zIndex: 1000,
                        ...style
                    }}
                >
                    <Box sx={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        width: '100%',
                    }}>
                        {children}
                    </Box>
                </motion.div>
            )}
        </>
    );
} 