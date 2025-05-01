import React from "react";

import {
  Stack,
  Typography,
} from "@mui/material";

import {TxtProps} from "./Txt";

export interface TypingTxtSimpleProps extends TxtProps {
    minChars?: number;
    typingSpeed?: number; // New prop for typing speed in milliseconds
    pauseSpeed?: number; // New prop for pause duration in milliseconds
}

/**
 * Txt component is a fork of the <Typography> component, with a few extra features.
 * 
 * It allows for a startIcon and endIcon to be added to the text, and it will automatically
 * wrap the text in a Stack component if either of these are provided.
 * 
 * If typingSpeed is provided, it will type out the text letter by letter with the specified speed.
 * After typing is complete, it will pause for the specified pauseSpeed before resetting.
 */
export function TypingTxtSimple(props: TypingTxtSimpleProps) {
    const [displayText, setDisplayText] = React.useState(
        props.minChars ? props.children?.toString().slice(0, props.minChars) : ''
    );
    const [isTyping, setIsTyping] = React.useState(false);

    React.useEffect(() => {
        if (props.typingSpeed && !isTyping) {
            setIsTyping(true);
            const text = props.children?.toString() || '';
            let index = props.minChars ? props.minChars : 0;
            const interval = setInterval(() => {
                setDisplayText(text.slice(0, index));
                index++;
                if (index > text.length) {
                    clearInterval(interval);
                    setIsTyping(false);
                    if (props.pauseSpeed) {
                        setTimeout(() => {
                            setDisplayText('');
                        }, props.pauseSpeed);
                    }
                }
            }, props.typingSpeed);
        }
    }, [props.children, props.typingSpeed, props.pauseSpeed, isTyping, props.minChars]);

    if (props.startIcon || props.endIcon) {
        return <Stack
            direction={'row'}
            alignItems={'center'}
            gap={1}
            {...props.stackOverrides}
        >
            {props.startIcon}
            <Typography
                {...props}
                suppressContentEditableWarning={true}
            >
                {displayText}
            </Typography>
            {props.endIcon}
        </Stack>
    }
    else {
        return <Typography {...props}>{displayText}</Typography>
    }
}