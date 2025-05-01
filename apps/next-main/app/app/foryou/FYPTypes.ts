import {ActivityType} from "@reasonote/core";
import {Activity as ActivitySDK} from "@reasonote/lib-sdk-apollo-client";

import {LessonConfig} from "@reasonote/core"

export type ActivityWithSkillStack = {
    activity: ActivitySDK;
    skillIdStack: string[];
};

export type FYPPinnedItems = {
    skillIdPath: string[];
    
    // TODO: probably move to stored lesson.
    lesson?: LessonConfig;
    /**
     * The subskills which were chosen.
     */
    subSkillIds?: string[];
};

export type FYPIntentActivitiesAllowed = {
    type: 'allowAll'
} | {
    type: 'allowOnly',
    allowedActivityTypes: ActivityType[],
}

export type FYPIntentReviewPinned = {
    type: 'review-pinned',
    pinned: FYPPinnedItems,
    activitiesAllowed?: FYPIntentActivitiesAllowed
}

export type FYPIntentReviewAll = {
    type: 'review-all',
    activitiesAllowed?: FYPIntentActivitiesAllowed
}

export type FYPIntent = FYPIntentReviewPinned | FYPIntentReviewAll;

export enum SkillActivityCountLevel {
    NONE = 'NONE',
    FEW = 'FEW',
    SOME = 'SOME',
    MANY = 'MANY',
    TONS = 'TONS',
  }