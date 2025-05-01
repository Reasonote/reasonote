'use client'

import {
  Box,
  Typography,
} from "@mui/material";

import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";

// Helper function to check if URL is a YouTube link
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const SourcesTabRenderer = ({ 
  skillId, 
  skillTree,
  loading: treeLoading,
  error: treeError
}: ToolTabRendererProps) => {
  
  // NOTE: This component might become unused if resource browsing
  // is handled entirely within the ResourceViewerSidebar.
  // For now, let's just return a placeholder.
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Resources
      </Typography>
      <Typography color="text.secondary">
        Resources are now managed in the dedicated Resources Panel.
        Click the 'Resources' button in the header to open it.
      </Typography>
    </Box>
  );
};

export const SourcesTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <SourcesTabRenderer {...props} />}
  </ToolTabLayout>
); 