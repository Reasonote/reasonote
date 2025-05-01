import { SvgIconProps } from "@mui/material";
import {
    ActivityConfig,
    ActivityResultBase,
    AIDriver,
} from "@reasonote/core";

export interface ActivityRenderArgs<TConfig extends ActivityConfig, TResult> {
    config: TConfig;
    callbacks: {
        onSubmission?: (userAnswer: any) => Promise<TResult>;
        onSkip?: (partialSubmission: any) => Promise<void>;
        hideSkipButton?: boolean;
        restrictHeight?: boolean;
    };
    ai: AIDriver;
}

export interface ActivityEditorArgs<TConfig extends ActivityConfig> {
    config: TConfig;
    setConfig: (config: TConfig) => void;
}

export interface ActivityEditorPreviewArgs<TConfig extends ActivityConfig> {
    config: TConfig;
}

export interface ValidActivityTypeClient<TConfig extends ActivityConfig, TResult extends ActivityResultBase> {
    type: string; 
    /**
     * 
     * @param args 
     * @returns 
     */
    render: (args: ActivityRenderArgs<TConfig, TResult>) => JSX.Element;

    /**
     * Renders the editor for this activity.
     * @param args 
     * @returns 
     */
    renderEditor?: (args: ActivityEditorArgs<TConfig>) => JSX.Element;

    /**
     * Renders a preview of this activity that will be shown alongside the editor.
     * 
     * Usually, this is just the full activity rendered with a smaller width.
     * @param args 
     * @returns 
     */
    renderEditorPreview?: (args: ActivityEditorPreviewArgs<TConfig>) => JSX.Element;

    /**
     * The icon for this activity type.
     * @param iconProps 
     * @returns 
     */
    renderTypeIcon: (iconProps: SvgIconProps) => JSX.Element | null;

    /**
     * Preview With Answers is the preview of the activity that is shown in the editor before entering edit mode.
     * 
     * This should only be shown to lesson content creators -- should not be shown to students
     */
    renderPreviewWithAnswers?: (args: ActivityEditorPreviewArgs<TConfig>) => JSX.Element;

    /**
     * Gets a tip for the user based on the result of the activity.
     * 
     * TODO: move this to server.
     * 
     * @param result 
     * @returns 
     */
    getCompletedTip?: (result: TResult) => Promise<string | undefined>;
}

export function staticValidateActivityTypeClient<TConfig extends ActivityConfig, TResult extends ActivityResultBase>(act: ValidActivityTypeClient<TConfig, TResult>){}
