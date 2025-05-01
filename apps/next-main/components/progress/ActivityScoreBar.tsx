import {useRef} from "react";

import {
  motion,
  useInView,
} from "framer-motion";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Box,
  Typography,
} from "@mui/material";

interface ActivityScoreBarProps {
    grade0To100: number;
    animationDuration?: number; // in seconds
    animationDelay?: number; // in seconds
    lpProps?: {
        lpProps?: {
            color?: string;
            sx?: any;
        };
    };
}

export function ActivityScoreBar({
    grade0To100, 
    animationDuration = 0.3,
    animationDelay = 0.1,
    lpProps,
}: ActivityScoreBarProps) {
    const isSmallDevice = useIsSmallDevice();
    const ref = useRef(null);
    const inView = useInView(ref);

    // Use lpProps color if provided, otherwise use our default color logic
    const barColor = lpProps?.lpProps?.color ? 
        lpProps.lpProps.color :
        (grade0To100 >= 70 ? '#4caf50' : 
         grade0To100 >= 60 ? '#ff9800' : 
         '#f44336');


    return (
        <Box ref={ref} sx={{ width: '100%', p: 1 }}>
            <Box
                sx={{ 
                    width: '100%',
                    height: '30px',
                    backgroundColor: theme => theme.palette.background.paper,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: `inset 0 0 0 3px ${barColor}, 0px 0px 10px 0px rgba(0, 0, 0, 0.1)`,
                    ...lpProps?.lpProps?.sx,
                }}
            >
                <motion.div
                    initial={{ width: '0%' }}
                    animate={inView ? { width: `${Math.max(grade0To100, 0)}%` } : { width: '0%' }}
                    transition={{ 
                        duration: animationDuration,
                        delay: animationDelay,
                    }}
                    style={{
                        height: '100%',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        backgroundColor: barColor,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ 
                            duration: animationDuration * 0.5,
                            delay: animationDelay + animationDuration * 0.5
                        }}
                    >
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: grade0To100 === 0 ? 'text.primary' : 'white',
                                textShadow: grade0To100 === 0 ? 'none' : '0px 0px 4px rgba(0,0,0,0.5)',
                                fontWeight: 'bold',
                            }}
                        >
                            {grade0To100}%
                        </Typography>
                    </motion.div>
                </Box>
            </Box>
        </Box>
    );
}