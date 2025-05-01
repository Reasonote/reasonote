// React and Material UI imports
import React from "react";

import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {
  Paper,
  Stack,
} from "@mui/material";
import {NarrativeActivityConfig} from "@reasonote/activity-definitions";

const NarrativeActivity: React.FC<{ config: NarrativeActivityConfig }> = ({ config }) => {
  return (
    <Paper sx={{width: '100%'}}>
      <Stack padding={2} gap={2}>
        <MuiMarkdownDefault>{config.narrativeText}</MuiMarkdownDefault>
        {/* Optionally, add interactive elements or further information here */}
      </Stack>
    </Paper>
  );
};

export default NarrativeActivity;