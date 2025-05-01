import { CoreMessage } from 'ai';

import {
  LessonConfig,
  UserFeeling,
} from '@reasonote/core';

// Define Stub interfaces for the relevant types
export interface SkillStub {
    id?: string;
    name: string;
    parentSkills?: SkillStub[];
    parentIds?: string[];
}

interface DocumentStub {
    title?: string;
    text: string;
}

interface ActivityConfigStub {
    type: string;
    type_config?: string;
}

interface UserStub {
    givenName?: string;
    familyName?: string;
    aiContext?: string;
    feelings?: UserFeeling[];
}

export interface ActivityGenerateRequestFullyDefined {
    /**
     * The number of activities to generate.
     */
    numActivities?: number;

    /**
     * The special instructions to generate the activities.
     */
    specialInstructions?: string;

    /**
     * The subject of study.
     */
    subject: {
        /**
         * The skill(s) which are the subject of study.
         */
        skills?: SkillStub[];
        
        /**
         * The documents which are the subject of study.
         */
        documents?: DocumentStub[];
        
        /**
         * The activities which define the subject of study.
         */
        activityConfigs?: ActivityConfigStub[];

        /**
         * The lesson which is the subject of study.
         */
        lesson?: LessonConfig;
    },
    /**
     * Context which is used to help generate the activity.
     */
    context: {
        /**
         * Information about the user.
         */
        user?: UserStub;

        /**
         * Information about the user's relationship with any relevant skills.
         */
        userSkill?: any;

        /**
         * The chat history which is the subject of study.
         */
        chatHistory?: CoreMessage[];
    }
}