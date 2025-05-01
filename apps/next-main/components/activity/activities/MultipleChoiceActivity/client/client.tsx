import {aib} from "@/clientOnly/ai/aib";
import {
  Add,
  CheckBox,
  CheckBoxOutlineBlank,
  Dashboard,
  Delete,
} from "@mui/icons-material";
import {
  Button,
  Divider,
  Grid,
  IconButton,
  Stack,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  MultipleChoiceActivityConfig,
  MultipleChoiceActivityConfigv1_0_0,
  MultipleChoiceActivityTypeDefinition,
  MultipleChoiceResult,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import {MultipleChoiceActivityPreviewWithAnswers} from "../PreviewWithAnswers";
import {MultipleChoiceActivity} from "./render";

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class MultipleChoiceActivityTypeClient {
    static type = "multiple-choice" as const;
 
    /**
     * Render the multiple choice activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<MultipleChoiceActivityConfig, MultipleChoiceResult | ActivityResultSkippedBase>){
        return <MultipleChoiceActivity 
            config={args.config}
            //@ts-ignore
            callbacks={args.callbacks}
            ai={args.ai}
        />
    }

    static renderEditor({config, setConfig}: {config: MultipleChoiceActivityConfig, setConfig: (config: MultipleChoiceActivityConfigv1_0_0) => void}){

        const configv1_0_0 = MultipleChoiceActivityTypeDefinition.convertConfigToV1_0_0(config);

        return <Stack gap={2}>
            <TextField 
                fullWidth
                label="Question"
                size="small"
                value={configv1_0_0.question} onChange={(e) => {
                    setConfig({
                        ...configv1_0_0,
                        question: e.target.value
                    })
                }}
                multiline
                maxRows={5}
            />
            <Divider/>
            <Grid container rowGap={2}>
                <Grid item xs={2}>
                    <Typography variant="caption">Correct?</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="caption">Answer Choice</Typography>
                </Grid>
                <Grid item xs={1}/>
                {config.answerChoices?.map((choice, idx) => {
                    return <>
                        <Grid item xs={2}>
                            <IconButton onClick={() => {
                                setConfig({
                                    ...configv1_0_0,
                                    answerChoices: configv1_0_0.answerChoices.map((c, i) => {
                                        if (i === idx) {
                                            return {
                                                ...c,
                                                isCorrect: !c.isCorrect
                                            }
                                        }
                                        return c;
                                    })
                                })
                            }}>
                                {
                                    choice.isCorrect ? 
                                        <CheckBox color="success"/>
                                        :
                                        <CheckBoxOutlineBlank color="disabled"/>
                                }
                            </IconButton>
                        </Grid>
                        <Grid item xs={9}>
                                <TextField 
                                fullWidth
                                multiline
                                size="small"
                                maxRows={5}
                                label={"Answer Choice " + (idx + 1)}
                                value={choice} onChange={(e) => {
                                    const newChoices = [...configv1_0_0.answerChoices];
                                    newChoices[idx] = {
                                        text: e.target.value,
                                        isCorrect: choice.isCorrect
                                    }
                                    setConfig({
                                        ...configv1_0_0,
                                        answerChoices: newChoices
                                    })
                                }}
                            />
                        </Grid>
                        <Grid item xs={1}>
                            <IconButton onClick={() => {
                                setConfig({
                                    ...configv1_0_0,
                                    answerChoices: configv1_0_0.answerChoices.filter((_, i) => i !== idx)
                                })
                            }}>
                                <Delete />
                            </IconButton>
                        </Grid>
                        </>
                })}
                <Grid item xs={12}>
                    <Button 
                        startIcon={<Add/>}
                        onClick={() => {
                            setConfig({
                                ...configv1_0_0,
                                answerChoices: [...configv1_0_0.answerChoices, {
                                    text: "",
                                    isCorrect: false
                                }]
                            })
                        }}
                    >
                        Add Answer Choice
                    </Button>
                </Grid>
            </Grid>
        </Stack>
    }

    static renderEditorPreview({config}: {config: MultipleChoiceActivityConfig}){
        return <MultipleChoiceActivity config={config} ai={aib}/>
    }

    static renderTypeIcon = (iconProps: SvgIconProps) => {
        return <Dashboard {...iconProps}/>
    }
    
    static renderPreviewWithAnswers({config}: {config: MultipleChoiceActivityConfig}){
        return <MultipleChoiceActivityPreviewWithAnswers config={config}/>
    }

    static async getCompletedTip(result: MultipleChoiceResult): Promise<string | undefined> {    
        if (result.type === 'skipped') {
            return undefined;
        }

        if (result.type === 'graded') {
            return result.submitResult.shortFeedback;
        }
    }
}


//@ts-ignore
staticValidateActivityTypeClient(MultipleChoiceActivityTypeClient);
