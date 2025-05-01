import {aib} from "@/clientOnly/ai/aib";
import {TextSnippet} from "@mui/icons-material";
import {
  Stack,
  SvgIconProps,
  TextField,
} from "@mui/material";
import {
  ShortAnswerActivityConfig,
  ShortAnswerResult,
} from "@reasonote/activity-definitions";
import {ActivityResultSkippedBase} from "@reasonote/core";
import {
  ActivityRenderArgs,
  staticValidateActivityTypeClient,
} from "@reasonote/core/src/interfaces/ActivityTypeClient";

import {ShortAnswerActivity} from "./render";

/**
 * A helper class for short answer activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class ShortAnswerActivityTypeClient {
    static type: 'short-answer' = 'short-answer';

    /**
     * Render the ShortAnswer activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<ShortAnswerActivityConfig, ShortAnswerResult>){
        return <ShortAnswerActivity 
            config={args.config}
            // @ts-ignore
            callbacks={args.callbacks}
            ai={args.ai}
        />
    }

    static renderEditor(args: {
        config: ShortAnswerActivityConfig,
        setConfig: (config: ShortAnswerActivityConfig) => void
    }){
        return <Stack spacing={2}>
            <TextField 
                multiline
                label="Question Text"
                value={args.config.questionText}
                onChange={(e) => {
                    args.setConfig({
                        ...args.config,
                        questionText: e.target.value
                    })
                }}
                maxRows={5}
            />
            <TextField 
                multiline
                label="Grading Criteria"
                value={args.config.gradingCriteria}
                onChange={(e) => {
                    args.setConfig({
                        ...args.config,
                        gradingCriteria: e.target.value
                    })
                }}
                maxRows={5}
            />
        </Stack>
    }

    static renderEditorPreview(args: {
        config: ShortAnswerActivityConfig
    }){
        return <ShortAnswerActivity
            config={args.config}
            ai={aib}
        />
    }

    static renderTypeIcon(iconProps: SvgIconProps){
        return <TextSnippet {...iconProps} />
    }

    static async getCompletedTip(result: ShortAnswerResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }
}


staticValidateActivityTypeClient(ShortAnswerActivityTypeClient);
