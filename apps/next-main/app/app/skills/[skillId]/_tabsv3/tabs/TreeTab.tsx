'use client'

import {useRef} from "react";

import {SkillTreeV2} from "@/components/skill/SkillTreeV2/SkillTreeV2";
import {
  Box,
  CircularProgress,
  Stack,
} from "@mui/material";

import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";

export const TreeTabRenderer = ({
  skillId,
  loading: propsLoading,
  error: propsError
}: ToolTabRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (propsLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <SkillTreeV2 
        skillId={skillId}
        variant="graph"
        containerRef={containerRef}
      />
    </Box>
  );
};

export const TreeTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <TreeTabRenderer {...props} />}
  </ToolTabLayout>
); 