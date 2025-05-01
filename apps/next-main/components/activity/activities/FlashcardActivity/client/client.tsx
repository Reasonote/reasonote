import {ViewAgenda} from "@mui/icons-material";
import {
  Stack,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  FlashcardActivityConfig,
  FlashcardResult,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import {FlashcardActivity} from "./render";

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class FlashcardActivityTypeClient {
    static type = "flashcard" as const;

    /**
     * Render the multiple choice activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<FlashcardActivityConfig, FlashcardResult | ActivityResultSkippedBase>){
        return <FlashcardActivity 
            config={args.config}
            //@ts-ignore
            callbacks={args.callbacks}
            ai={args.ai}
        />
    }

    static renderEditor({config, setConfig}: {config: FlashcardActivityConfig, setConfig: (config: FlashcardActivityConfig) => void}){
        return <Stack>
            <Typography variant="h6">Front</Typography>
            <TextField 
                multiline
                value={config.flashcardFront} onChange={(e) => {
                    setConfig({
                        ...config,
                        flashcardFront: e.target.value
                    })
                }}
                maxRows={5}
            />
            <Typography variant="h6">Back</Typography>
            <TextField 
                multiline
                maxRows={10}
                value={config.flashcardBack} onChange={(e) => {
                setConfig({
                    ...config,
                    flashcardBack: e.target.value
                })
            }}/>
        </Stack>
    }


    static renderEditorPreview({config}: {config: FlashcardActivityConfig}){
        //@ts-ignore
        return <FlashcardActivity config={config} />
    }


    static renderTypeIcon = (iconProps: SvgIconProps) => {
        return <ViewAgenda {...iconProps}/>
    }

    static async getCompletedTip(result: FlashcardResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        return undefined;
    }
}


staticValidateActivityTypeClient(FlashcardActivityTypeClient);
