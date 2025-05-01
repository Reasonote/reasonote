import React from "react";

import {aib} from "@/clientOnly/ai/aib";
import {TheaterComedy} from "@mui/icons-material";
import {SvgIconProps} from "@mui/material";
import {
  RoleplayActivityConfig,
  RoleplayResult,
  RoleplayResultSchema,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import {RoleplayActivity} from "./render";
import {RoleplayActivityEditor} from "./renderEditor";

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class RoleplayActivityTypeClient {
    static type = "roleplay" as const;

    static typeHumanName = "Roleplay";

    static resultSchema = RoleplayResultSchema;

    static createEmptyConfig(): RoleplayActivityConfig {
        return {
            version: '0.0.0',
            type: RoleplayActivityTypeClient.type,
            setting: {
                name: "",
                description: ""
            },
            userCharacter: {
                objectives: []
            },
            characters: []
        }
    }

    /**
     * Render the multiple choice activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<RoleplayActivityConfig, RoleplayResult | ActivityResultSkippedBase>){
        //@ts-ignore
        return <RoleplayActivity {...args} ai={aib}/>
    }

    static renderEditor({config, setConfig}: {config: RoleplayActivityConfig, setConfig: (config: RoleplayActivityConfig) => void}){
        return <RoleplayActivityEditor config={config} setConfig={setConfig}/> 
    }

    static renderEditorPreview({config}: {config: RoleplayActivityConfig}){
        return <RoleplayActivity config={config} ai={aib}/>
    }

    static renderTypeIcon = (iconProps: SvgIconProps) => {
        return <TheaterComedy {...iconProps}/>
    }

    static async getCompletedTip(result: RoleplayResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        if (result?.feedback?.markdownFeedback) {
            return result.feedback.markdownFeedback;
        }
        return undefined;
    }
}


staticValidateActivityTypeClient(RoleplayActivityTypeClient);
