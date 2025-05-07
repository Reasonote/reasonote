'use client'

import {
  useEffect,
  useState,
} from "react";

import {useSkillScores} from "@/clientOnly/hooks/useSkillScores";
import {
  Box,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {ToolTabRendererProps} from "./ToolTabsInterface";

interface ToolTabLayoutProps extends Omit<ToolTabRendererProps, 'loading' | 'error' | 'skillTree'> {
  children: React.ReactNode | ((props: ToolTabRendererProps) => React.ReactNode);
}

export const ToolTabLayout = ({ 
  skillId, 
  children 
}: ToolTabLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skillId);
  const {loading, error} = useSkillScores({topicOrId: skillId});

  // When skillId changes (top-level skill changes), update the selected skill
  useEffect(() => {
    setSelectedSkillId(skillId);
  }, [skillId]);

  // Handle skill selection from the tree
  const handleSkillSelect = (selectedId: string) => {
    setSelectedSkillId(selectedId);
  };

  // Create the props to pass to children
  const childrenProps: ToolTabRendererProps = {
    skillId: selectedSkillId,
    loading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null
  };


  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* <Grid item xs={12}>
        <SkillTreeView 
            skillTree={skillTree} 
            loading={loading}
            error={error instanceof Error ? error : error ? new Error(String(error)) : null}
            activeSkillId={selectedSkillId}
            onSkillSelect={handleSkillSelect}
        />
        </Grid> */}
        
        {/* Main Content Area */}
        <Grid item xs={12}>
            {typeof children === 'function' 
              ? children(childrenProps)
              : children
            }
        </Grid>
      </Grid>
    </Box>
  );
}; 