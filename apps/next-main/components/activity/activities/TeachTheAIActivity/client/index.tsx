import {School} from "@mui/icons-material";
import {SvgIconProps} from "@mui/material";
import {
  TeachTheAIActivityConfig,
  TeachTheAIResult,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import {TeachTheAIActivity} from "./render";

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class TeachTheAIActivityTypeClient {
    static type = "teach-the-ai" as const;

    /**
     * Render the multiple choice activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<TeachTheAIActivityConfig, TeachTheAIResult | ActivityResultSkippedBase>){
        //@ts-ignore
        return <TeachTheAIActivity {...args}/>
    }

    static renderTypeIcon = (iconProps: SvgIconProps) => {
        return <School {...iconProps}/>
    }

    static async getCompletedTip(result: TeachTheAIResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }
}


staticValidateActivityTypeClient(TeachTheAIActivityTypeClient);
