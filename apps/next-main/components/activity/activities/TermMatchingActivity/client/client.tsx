import React from "react";

import {aib} from "@/clientOnly/ai/aib";
import {
  CompareArrows,
  Delete,
} from "@mui/icons-material";
import {
  Button,
  IconButton,
  Stack,
  SvgIconProps,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  TermMatchingActivityConfig,
  TermMatchingActivityConfigSchema,
  TermMatchingResult,
} from "@reasonote/activity-definitions";
import {ActivityResultSkippedBase} from "@reasonote/core";
import {
  ActivityRenderArgs,
  staticValidateActivityTypeClient,
} from "@reasonote/core/src/interfaces/ActivityTypeClient";

import {TermMatchingActivity} from "./renderer";

export class TermMatchingActivityTypeClient {
    static type: 'term-matching' = 'term-matching';

    static render(args: ActivityRenderArgs<TermMatchingActivityConfig, TermMatchingResult>) {
        // Check that the config is valid
        
        const parsed = TermMatchingActivityConfigSchema.safeParse(args.config);

        //@ts-ignore
        return parsed.success ? <TermMatchingActivity 
            {...args}
        /> : <div>Invalid configuration</div>
    }

    static renderEditor(args: {
        config: TermMatchingActivityConfig,
        setConfig: (config: TermMatchingActivityConfig) => void
    }) {
        const { config, setConfig } = args;

        const handleAddPair = () => {
            setConfig({
                ...config,
                termPairs: [...config.termPairs, { term: "", definition: "" }]
            });
        };

        const handleRemovePair = (index: number) => {
            const newPairs = [...config.termPairs];
            newPairs.splice(index, 1);
            setConfig({
                ...config,
                termPairs: newPairs
            });
        };

        const handlePairChange = (index: number, field: 'term' | 'definition', value: string) => {
            const newPairs = [...config.termPairs];
            newPairs[index][field] = value;
            setConfig({
                ...config,
                termPairs: newPairs
            });
        };

        const handleHardModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (config.version === '0.0.1') {
                setConfig({
                    ...config,
                    version: '0.0.1',
                    hardMode: e.target.checked
                });
            }
        };

        return (
            <Stack 
                spacing={3} 
                sx={{ 
                    px: 2
                }}
            >
                <Stack 
                    alignItems="center"
                    sx={{ pt: 2 }}
                >
                    <Stack 
                        direction="row" 
                        alignItems="center" 
                        spacing={1}
                    >
                        <Typography variant="body1">Hard Mode</Typography>
                        <Tooltip 
                            title="In hard mode, users can continue after incorrect matches, but each mistake reduces their final score by 10%" 
                            arrow
                            placement="bottom"
                        >
                            <Switch
                                checked={config.version === '0.0.1' && config.hardMode}
                                onChange={handleHardModeToggle}
                                size="small"
                            />
                        </Tooltip>
                    </Stack>
                </Stack>

                <TextField 
                    multiline
                    label="Instructions"
                    value={config.instructions}
                    onChange={(e) => setConfig({...config, instructions: e.target.value})}
                    maxRows={5}
                />

                {config.termPairs.map((pair, index) => (
                    <Stack 
                        key={index} 
                        direction="row" 
                        spacing={2} 
                        alignItems="flex-start"
                    >
                        <TextField 
                            label="Term"
                            value={pair.term}
                            onChange={(e) => handlePairChange(index, 'term', e.target.value)}
                            multiline
                            sx={{ flex: 1 }}
                        />
                        <TextField 
                            label="Definition"
                            value={pair.definition}
                            onChange={(e) => handlePairChange(index, 'definition', e.target.value)}
                            multiline
                            sx={{ flex: 1 }}
                        />
                        <IconButton 
                            onClick={() => handleRemovePair(index)}
                            color="error"
                            sx={{ mt: 1 }}
                        >
                            <Delete />
                        </IconButton>
                    </Stack>
                ))}
                <Button 
                    onClick={handleAddPair}
                    sx={{ mb: 2 }}  // Add some bottom padding
                >
                    Add Pair
                </Button>
            </Stack>
        );
    }

    static renderEditorPreview(args: {
        config: TermMatchingActivityConfig
    }) {
        return <TermMatchingActivity
            ai={aib}
            config={args.config}
        />
    }

    static renderTypeIcon(iconProps: SvgIconProps) {
        return <CompareArrows {...iconProps} />
    }

    static async getCompletedTip(result: TermMatchingResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }
}

staticValidateActivityTypeClient(TermMatchingActivityTypeClient);