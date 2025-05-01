import {aib} from "@/clientOnly/ai/aib";
import {
  EditNote,
  Info,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  FillInTheBlankActivityConfig,
  FillInTheBlankResult,
} from "@reasonote/activity-definitions";
import {ActivityResultSkippedBase} from "@reasonote/core";
import {
  ActivityRenderArgs,
  staticValidateActivityTypeClient,
} from "@reasonote/core/src/interfaces/ActivityTypeClient";

import {FillInTheBlankActivity} from "../render";

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class FillInTheBlankActivityTypeClient {
    static type: 'fill-in-the-blank' = 'fill-in-the-blank';

    /**
     * Render the FillInTheBlank activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<FillInTheBlankActivityConfig, FillInTheBlankResult | ActivityResultSkippedBase>){
        return <FillInTheBlankActivity 
            {...args}
        />
    }

    static renderEditor(args: {
        config: FillInTheBlankActivityConfig,
        setConfig: (config: FillInTheBlankActivityConfig) => void
    }){
        return <Stack spacing={2}>
            <TextField 
                multiline
                label="Question Text"
                value={args.config.text}
                onChange={(e) => {
                    args.setConfig({
                        ...args.config,
                        text: e.target.value
                    })
                }}
                maxRows={5}
            />
            <Accordion>
                <AccordionSummary>
                    <Stack direction={'row'} alignItems={'center'} gap={2}>
                        <Info />
                        <Typography>Formatting Tips</Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2">Use <code>{`<span id="hidden-word-1">Hidden Words</span>`}</code> to indicate where the blank should be.</Typography>
                </AccordionDetails>
            </Accordion>
            {/* <BaseCallout icon={<Info />} header={<Typography>Formatting Tips</Typography>}>
            </BaseCallout> */}
            {/* <Typography variant="body2">You can use <code>{`<span id="hidden-word-1">Hidden Words</span>`}</code> to indicate where the blank should be.</Typography> */}
        </Stack>
    }

    static renderEditorPreview(args: {
        config: FillInTheBlankActivityConfig
    }){
        return <FillInTheBlankActivity
            ai={aib}
            config={args.config}
        />
    }

    static renderTypeIcon(iconProps: SvgIconProps){
        return <EditNote {...iconProps} />
    }

    static async getCompletedTip(result: FillInTheBlankResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }
}


staticValidateActivityTypeClient(FillInTheBlankActivityTypeClient);
