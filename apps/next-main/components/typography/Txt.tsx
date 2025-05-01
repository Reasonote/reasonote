import {useCallback} from "react";

import {motion} from "framer-motion";

import {
  Stack,
  Typography,
  TypographyProps,
} from "@mui/material";

export interface TxtProps extends TypographyProps {
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    stackOverrides?: React.ComponentProps<typeof Stack>;
    typographyOverrides?: React.ComponentProps<typeof Typography>;
    disableMotion?: boolean;
    /**
     * If provided, the text will be wrapped in a motion.div component.
     */
    motion?: React.ComponentProps<typeof motion.div>;
}

/**
 * Txt component is a fork of the <Typography> component, with a few extra features.
 * 
 * It allows for a startIcon and endIcon to be added to the text, and it will automatically
 * wrap the text in a Stack component if either of these are provided.
 */
export function Txt(props: TxtProps) {
    const { disableMotion, motion: motionProps, startIcon, endIcon, stackOverrides, typographyOverrides, ...restProps } = props;

    const MotionWrapper = useCallback((props: { children: React.ReactNode }) => {
        if (disableMotion || !motionProps) {
            return <>{props.children}</>;
        }
        return <motion.div {...motionProps}>{props.children}</motion.div>;
    }, [disableMotion, motionProps]);

    if (props.startIcon || props.endIcon) {
        const hasOnClick = !!props.onClick;
        return (
            <MotionWrapper>
                <Stack
                    direction={'row'}
                    alignItems={'center'}
                    gap={1}
                    {...stackOverrides}
                    onClick={props.onClick}
                    sx={{
                        // @ts-ignore
                        cursor: (hasOnClick ? 'pointer' : 'unset') as 'pointer' | 'unset',
                        '&:hover': hasOnClick ? { filter: 'brightness(1.2)' } : {},
                        ...stackOverrides?.sx,
                        ...restProps.sx
                    }}
                >
                    {startIcon}
                    <Typography
                        {...restProps}
                        onClick={props.onClick ? (() => {}) : undefined}
                        sx={{
                            p: 0,
                            m: 0,
                            ...typographyOverrides?.sx,
                        }}
                        suppressContentEditableWarning={true}
                    />
                    {endIcon}
                </Stack>
            </MotionWrapper>
        );
    }
    
    return (
        <MotionWrapper>
            <Typography 
                {...restProps} 
                sx={{
                    p: 0,
                    m: 0,
                    ...typographyOverrides?.sx,
                }}
                suppressContentEditableWarning={true}
            />
        </MotionWrapper>
    );
}