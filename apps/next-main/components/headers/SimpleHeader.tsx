import { Stack } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";

export interface SimpleHeaderProps {
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    leftWrapperProps?: React.ComponentProps<typeof Stack>;
    rightWrapperProps?: React.ComponentProps<typeof Stack>;
    wrapperProps?: React.ComponentProps<typeof Stack>;
    dragHandleProps?: any;
}

export function SimpleHeader({
    leftContent, 
    rightContent, 
    leftWrapperProps, 
    rightWrapperProps, 
    wrapperProps,
    dragHandleProps
}: SimpleHeaderProps) {
    return (
        <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'space-between'}
            {...dragHandleProps}
            {...wrapperProps}
            sx={{
                cursor: dragHandleProps ? 'grab' : 'default',
                borderRadius: 1,
                px: dragHandleProps ? 1 : 0,
                py: dragHandleProps ? 0.5 : 0,
                ...wrapperProps?.sx
            }}
        >
            <Stack
                direction={'row'}
                alignItems={'center'}
                gap={1}
                {...leftWrapperProps}
            >
                {dragHandleProps && <DragIndicator />}
                {leftContent}
            </Stack>
            <Stack
                direction={'row'}
                gap={1}
                alignItems={'center'}
                {...rightWrapperProps}
            >
                {rightContent}
            </Stack>
        </Stack>
    );
}