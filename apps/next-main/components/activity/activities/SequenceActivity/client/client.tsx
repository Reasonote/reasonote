import {Reorder} from "@mui/icons-material";
import {
  Button,
  IconButton,
  Paper,
  Stack,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  SequenceActivityConfig,
  SequenceResult,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import {SequenceActivityPreviewWithAnswers} from "../PreviewWithAnswers";
import {SequenceActivity} from "./render";

/**
 * A helper class for sequence activities.
 */
export class SequenceActivityTypeClient {
    static type = "sequence" as const;
 
    static render(args: ActivityRenderArgs<SequenceActivityConfig, SequenceResult | ActivityResultSkippedBase>) {
        // @ts-ignore - Using server-side grading
        return <SequenceActivity 
            config={args.config}
            // @ts-ignore - Using server-side grading
            callbacks={args.callbacks}
        />;
    }

    static renderEditor({config, setConfig}: {
        config: SequenceActivityConfig, 
        setConfig: (config: SequenceActivityConfig) => void
    }) {

        return (
            <Stack gap={2}>
                <TextField 
                    fullWidth
                    label="Prompt"
                    size="small"
                    value={config.prompt}
                    onChange={(e) => {
                        setConfig({
                            ...config,
                            prompt: e.target.value
                        });
                    }}
                    multiline
                    maxRows={5}
                />
                <TextField 
                    fullWidth
                    label="Position Labels (comma separated)"
                    size="small"
                    value={config.positionLabels ? config.positionLabels.join(', ') : ''}
                    onChange={(e) => {
                        const labels = e.target.value.split(',').map(label => label.trim()).filter(label => label !== '');
                        
                        // Convert to v0.0.2 when adding position labels
                        const updatedItems = config.items.map(item => {
                            // Create v0.0.2 compatible item
                            return {
                                id: item.id,
                                label: item.label,
                                hiddenPositionLabel: 'hiddenPositionLabel' in item ? item.hiddenPositionLabel : ''
                            };
                        });
                        
                        setConfig({
                            ...config,
                            version: "0.0.1",
                            positionLabels: labels.length > 0 ? labels : undefined,
                            items: updatedItems
                        });
                    }}
                    helperText={`Example: "Earliest, Earlier, Later, Latest" or "First, Second, Third, Fourth"`}
                />
                <Paper sx={{ p: 2 }}>
                    <Stack gap={2}>
                        <Typography variant="subtitle2">Sequence Items</Typography>
                        {config.items.map((item, index) => (
                            <Stack key={index} direction="row" gap={2} alignItems="center">
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Item Label"
                                    value={item.label}
                                    onChange={(e) => {
                                        const newItems = [...config.items];
                                        newItems[index] = {
                                            ...newItems[index],
                                            label: e.target.value
                                        };
                                        setConfig({
                                            ...config,
                                            items: newItems
                                        });
                                    }}
                                />
                                {(
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Hidden Position Label"
                                        value={'hiddenPositionLabel' in item ? item.hiddenPositionLabel || '' : ''}
                                        onChange={(e) => {
                                            const newItems = [...config.items];
                                            const updatedItem = {
                                                ...newItems[index],
                                                hiddenPositionLabel: e.target.value
                                            };
                                            newItems[index] = updatedItem;
                                            setConfig({
                                                ...config,
                                                items: newItems
                                            });
                                        }}
                                    />
                                )}
                                <IconButton
                                    onClick={() => {
                                        setConfig({
                                            ...config,
                                            items: config.items.filter((_, i) => i !== index)
                                        });
                                    }}
                                >
                                    <Reorder />
                                </IconButton>
                            </Stack>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={() => {
                                const newItem = {
                                    id: crypto.randomUUID(),
                                    label: "",
                                    hiddenPositionLabel: ""
                                };
                                
                                setConfig({
                                    ...config,
                                    items: [...config.items, newItem]
                                });
                            }}
                        >
                            Add Item
                        </Button>
                    </Stack>
                </Paper> 
            </Stack>
        );
    }

    static renderEditorPreview({config}: {config: SequenceActivityConfig}) {
        return <SequenceActivity config={config} />;
    }

    static renderTypeIcon = (iconProps: SvgIconProps) => {
        return <Reorder {...iconProps} />;
    }
    
    static renderPreviewWithAnswers({config}: {config: SequenceActivityConfig}) {
        return <SequenceActivityPreviewWithAnswers config={config} />;
    }

    static async getCompletedTip(result: SequenceResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }
}

staticValidateActivityTypeClient(SequenceActivityTypeClient);