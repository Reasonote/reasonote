import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";

import {
  IconButton,
  IconButtonProps,
  keyframes,
  Stack,
  StackProps,
  styled,
} from "@mui/material";

import {
  TxtField,
  TxtFieldProps,
} from "./TxtField";

export type TxtFieldWithIconButtonProps = TxtFieldProps & {
    iconButtonProps?: IconButtonProps;
    stackProps?: StackProps;
    actionIcon?: React.ReactNode;
    enterTriggersAction?: boolean;
    actionClearsText?: boolean;
    onAction?: (s: string) => any;
    actionInProgress?: boolean;
    disableTextDuringAction?: boolean;
}

// Define the keyframes
const pulseFade = keyframes`
  0% {
    opacity: 1;
    scale: 1.25;
  }
  50% {
    opacity: 0.5;
    
    scale: 1;
  }
  100% {
    opacity: 1;
    scale: 1.25;
  }
`;

// Extend IconButton with styled-components and apply the animation
const AnimatedIconButton: any = (styled(IconButton)`
  &.pulsingEffect {
    animation: ${pulseFade} 2s infinite;
  }
` as any)

export function TxtFieldWithAction({iconButtonProps, stackProps, actionIcon, onAction, actionInProgress, disableTextDuringAction, enterTriggersAction, actionClearsText, ...txtFieldProps}: TxtFieldWithIconButtonProps){
    const textValue = txtFieldProps.value;
    const isControlled = txtFieldProps.value !== undefined;
    
    const [value, setValue] = useState(_.isString(textValue) ? textValue : '');
    
    const onActionInner = useCallback((value: string) => {
        onAction?.(value);
        if (actionClearsText){
            setValue('');
        }
    }, [value, onAction, actionClearsText]);

    // When the enter button is pressed, we want to trigger the action
    const onKeyPress = useCallback((e: any) => {
        // Update our cached value...
        setValue(e.target.value);  
      
        if (enterTriggersAction && e.key === 'Enter') {
            // We send the target value to the onAction callback, because it's most up to date.
            onActionInner?.(e.target.value ?? '');
        }

        txtFieldProps?.onKeyPress?.(e);
    }, [txtFieldProps, onAction, enterTriggersAction]);

    const onChange = useCallback((e: any) => {
        setValue(e.target.value);
        txtFieldProps?.onChange?.(e);
    }, []);

    const numLines = _.isString(textValue) ? textValue.split('\n').length : 1;

    return <Stack direction={'row'} gap={1} alignItems={txtFieldProps.multiline && numLines > 1 ? 'start' : 'center'} {...stackProps}>
        <TxtField 
          {...txtFieldProps}
          value={isControlled ? textValue : value}
          fullWidth 
          onKeyUp={onKeyPress}
          onChange={onChange}
          disabled={txtFieldProps?.disabled ?? (actionInProgress && disableTextDuringAction)}
        />
        <AnimatedIconButton 
            {...iconButtonProps}
            className={`${actionInProgress ? 'pulsingEffect' : ''} ${iconButtonProps?.className ?? ''}`}
            onClick={() => {
                onActionInner?.(value);
            }}
            disabled={iconButtonProps?.disabled ?? actionInProgress}
            sx={{
                position: 'relative', // Ensure IconButton is positioned relatively within the container
                zIndex: 1, // Ensures the button is clickable and above the progress spinner
                ...iconButtonProps?.sx
            }}
        >
            {actionIcon}
        </AnimatedIconButton>
    </Stack>
}