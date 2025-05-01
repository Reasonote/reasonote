import {FC} from "react";

import {ActivityResult} from "@reasonote/activity-definitions";
import {
  ActivityResultSkippedBase,
  AIDriver,
} from "@reasonote/core";

export interface ActivityComponentCallbacks<TActivitySubmission, TActivityResult extends ActivityResult> {
    /**
     * Called when the user submits an answer.
     * 
     * This is called when the user has submitted an answer, generally to be graded.
     * @param userAnswer The user's answer.
     * @returns The grade for the answer.
     */
    onSubmission?: (userAnswer: TActivitySubmission) => Promise<TActivityResult>;

    /**
     * Called when the user skips the activity.
     */
    onSkip?: (partialSubmission: any) => Promise<void>;

    onComplete?: (result: TActivityResult | ActivityResultSkippedBase) => void;

    /**
     * Whether to hide the skip button.
     */
    hideSkipButton?: boolean;

    /**
     * Whether to restrict the height of the activity.
     */
    restrictHeight?: boolean;
}

export interface ActivityComponentProps<TActivityDefinition, TActivitySubmission, TActivityResult extends ActivityResult> {
    config: TActivityDefinition;
    callbacks?: ActivityComponentCallbacks<TActivitySubmission, TActivityResult>;
    ai: AIDriver;
}

/**
 * A component that renders an activity.
 */
export type ActivityComponent<
    TActivityDefinition,
    TActivitySubmission,
    TActivityResult extends ActivityResult
> = 
    FC<ActivityComponentProps<TActivityDefinition, TActivitySubmission, TActivityResult>>;