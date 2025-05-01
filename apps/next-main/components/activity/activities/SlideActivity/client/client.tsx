import {Note} from "@mui/icons-material";
import {
  Stack,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  SlideActivityConfig,
  SlideResult,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import {SlideActivity} from "./render";

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class SlideActivityTypeClient {
    static type = "slide" as const;

    /**
     * Render the multiple choice activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<SlideActivityConfig, SlideResult>){
        //@ts-ignore
        return <SlideActivity {...args}/>
    }

    static renderEditor({config, setConfig}: {config: SlideActivityConfig, setConfig: (config: SlideActivityConfig) => void}){
        return <Stack>
            <Typography variant="h6">Title Emoji</Typography>
            <TextField 
                value={config.titleEmoji}
                onChange={(e) => {
                    setConfig({
                        ...config,
                        titleEmoji: e.target.value
                    })
                }}
            />
            <Typography variant="h6">Title</Typography>
            <TextField 
                multiline
                value={config.title} onChange={(e) => {
                    setConfig({
                        ...config,
                        title: e.target.value
                    })
                }}
                maxRows={5}
            />
            <Typography variant="h6">Content</Typography>
            <TextField 
                multiline
                maxRows={10}
                value={config.markdownContent} 
                onChange={(e) => {
                    setConfig({
                        ...config,
                        markdownContent: e.target.value
                    })
                }}
            />
        </Stack>
    }


    static renderEditorPreview({config}: {config: SlideActivityConfig}){
        // @ts-ignore
        return <SlideActivity config={config}/>
    }


    static renderTypeIcon = (iconProps: SvgIconProps) => {
        return <Note {...iconProps}/>
    }

    static async getCompletedTip(result: SlideResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        return undefined;
    }
}


staticValidateActivityTypeClient(SlideActivityTypeClient);
