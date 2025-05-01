import {
  LinearProgress,
  LinearProgressProps,
  Stack,
} from "@mui/material";

export function LinearProgressWithLabel({label, lpProps, wrapperProps, labelPos}: {label: JSX.Element | string | null, lpProps?: Partial<LinearProgressProps>, wrapperProps?: React.ComponentProps<typeof Stack>, labelPos?: 'above' | 'center'}) {
    const labelStyle = labelPos === 'above' ? {
        position: 'absolute',
        top: '-20px',
        left: '50%',
        transform: 'translateX(-50%)'
    } as const : {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    } as const
    
    return <Stack
        className="LinearProgressWithLabel"
        {...wrapperProps}
        sx={{
            ...wrapperProps?.sx,
            position: 'relative',
            justifyContent: 'center',
        }}
    >
        {
            labelPos === 'above' ?
                label
                :
                null
        }
        <LinearProgress 
            {...lpProps}
        />
        {
            !labelPos || labelPos === 'center' ?
                <div
                    style={labelStyle}
                >
                    {label}
                </div>
                :
                null
        }
    </Stack>
    
}