'use client'
import React, {useMemo} from "react";

import {ZodTypeAny} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {SkeletonProps} from "@mui/material";
import {
  OneShotAIArgs,
  OneShotAIResponse,
} from "@reasonote/core";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {SkeletonWithOverlay} from "./SkeletonWithOverlay";

export interface SmartSkeletonProps<T extends ZodTypeAny> {
    oneShotAIArgs?: OneShotAIArgs<T>;
    formatResponse: (response: OneShotAIResponse<T>) => JSX.Element | null;
    skeletonProps?: SkeletonProps;
    width?: string;
    height?: string;
}


// A skeleton which, on its first render, will ask the AI for something to display,
// Based on the passed configuration.
export function SmartSkeleton<T extends ZodTypeAny>(props: SmartSkeletonProps<T>) {
    const [response, setResponse] = React.useState<OneShotAIResponse<T> | null>(null);

    const formattedResponse = useMemo(() => {
        if (response) {
            return props.formatResponse(response);
        }
    }, [response])

    const isGeneratingRef = React.useRef(false);

    useAsyncEffect(async () => {
        if (response || !props.oneShotAIArgs || isGeneratingRef.current) return;
        isGeneratingRef.current = true;
        
        try {
            const resp = await oneShotAIClient(props.oneShotAIArgs);
            setResponse(resp);
        }
        finally {
            isGeneratingRef.current = false;
        }
    }, [props.oneShotAIArgs]);

    return <SkeletonWithOverlay {...props.skeletonProps} width={props.width} height={props.height}>
        {formattedResponse ? formattedResponse : null}
    </SkeletonWithOverlay>
}