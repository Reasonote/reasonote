import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import _ from "lodash";

import {
  Typography,
  TypographyProps,
} from "@mui/material";

interface TypingTxtProps extends TypographyProps {
    animationDuration?: number;
}

export const TypingTxt: React.FC<TypingTxtProps> = ({ children, animationDuration = 350, ...props }) => {
    const [displayedChunks, setDisplayedChunks] = useState<any[]>([]);
    const prevChildrenRef = useRef('');

    useEffect(() => {
        // Convert a string child to an array of string children with a single element.
        const usingChildren = _.isString(children) ? [children] : children;
        const newStringification = usingChildren?.toString() || '';
        if (newStringification !== prevChildrenRef.current) {

            prevChildrenRef.current = newStringification;
            const newChunks: any[] = [];

            if (typeof usingChildren === 'string') {
                for (const char of usingChildren) {
                    newChunks.push(char);
                }
            } else if (_.isArray(usingChildren)) {
                newChunks.push(...usingChildren);
            } else {
                // All other cases aren't arrays, or special.
                newChunks.push(usingChildren);
            }

            setDisplayedChunks(newChunks);
        }
    }, [children]);

    return (
        <Typography {...props}>
            {displayedChunks.map((chunk, chunkIndex) => (
                _.isString(chunk) ? chunk.split('').map((char, index) => (
                    <span
                        key={`${chunkIndex}-${index}`}
                        style={{
                            animation: `fadeIn ${animationDuration}ms`,
                            animationFillMode: 'both',
                        }}
                    >
                        {char}
                    </span>
                )) 
                :
                <span 
                    key={`${chunkIndex}`}
                    style={{
                        animation: `fadeIn ${animationDuration}ms`,
                        animationFillMode: 'both',
                    }}
                >
                    {chunk}
                </span>
            ))}
        </Typography>
    );
};