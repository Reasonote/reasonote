import {TxtField} from "@/components/textFields/TxtField";
import {HistoryEdu} from "@mui/icons-material";
import {
  Stack,
  SvgIconProps,
} from "@mui/material";
import {
  NarrativeActivityConfig,
  NarrativeActivityResult,
} from "@reasonote/activity-definitions";
import {
  ActivityResultSkippedBase,
  staticValidateActivityTypeClient,
} from "@reasonote/core";

import NarrativeActivity from "./render";

export class NarrativeActivityTypeClient {
    static type = "narrative" as const;

    static render(args: { config: NarrativeActivityConfig }) {
        // Direct rendering isn't handled here in React components; instead, provide the necessary
        // props or configuration for your React component to render the narrative.
        // This method could simply return a JSX component or be used to configure props.
        // For demonstration purposes, here's a speculative example:
        return <NarrativeActivity config={args.config} />;
    }

    static renderEditorPreview({config}: {config: NarrativeActivityConfig}) {
        return <NarrativeActivity config={config} />;
    }

    static renderEditor({config, setConfig}: {config: NarrativeActivityConfig, setConfig: (config: NarrativeActivityConfig) => void}) {
        const genRequest = config.metadata.genRequest;

        // Speculative: Assuming you have a similar setup for editing activity configurations
        // Implement UI for editing narrative text or other properties
        // This is a placeholder and should be adapted to your project's requirements
        return (
           <Stack>
                <TxtField 
                    label="Narrative Text"
                    value={config.narrativeText}
                    onChange={(event) => setConfig({...config, narrativeText: event.target.value})}
                    multiline
                    maxRows={10}
                />
           </Stack>
        );
    }


    static renderTypeIcon = (iconProps: SvgIconProps) => {
        // Assuming you use Material-UI, return an icon relevant to narrative activities
        // Replace ViewAgenda with an appropriate icon for your use case
        return <HistoryEdu {...iconProps} />;
    }

    static async getCompletedTip(result: NarrativeActivityResult | ActivityResultSkippedBase): Promise<string | undefined> {    
        if (result?.feedback?.markdownFeedback) {
            return result.feedback.markdownFeedback;
        }
        return undefined;
    }
}

// Ensure the activity class is validated
staticValidateActivityTypeClient(NarrativeActivityTypeClient);