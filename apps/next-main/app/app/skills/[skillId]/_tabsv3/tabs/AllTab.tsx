'use client'

import {useRouter} from "next/navigation";

import {Check} from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {ToolTabLayout} from "../ToolTabLayout";
import {ToolTabRendererProps} from "../ToolTabsInterface";
import {getAllRegisteredTabs} from "./_TabsRegistry";

export const AllTabRenderer = ({ 
  skillId, 
  skillTree,
  loading,
  error 
}: ToolTabRendererProps) => {
  const router = useRouter();
  const theme = useTheme();

  // Navigate to a specific tab
  const handleToolSelect = (tabId: string) => {
    router.push(`/app/skills/${skillId}?tab=${tabId}`);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {getAllRegisteredTabs().filter(tab => !tab.hideOnAllToolsPage).map(tab => (
          <Grid item xs={12} sm={6} md={4} key={tab.id}>
            <Card 
              elevation={1}
              sx={{ 
                height: 200, 
                bgcolor: `${tab.color}10`, 
                color: theme.palette.text.primary,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  '& .icon-bg': {
                    opacity: 0.3,
                  }
                }
              }}
            >
              <CardActionArea 
                sx={{ height: '100%', p: 3 }}
                onClick={() => handleToolSelect(tab.id)}
              >
                {
                  tab.chipIndicator ? (
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip 
                        icon={<Check sx={{ color: 'white !important' }} />}
                        label="Available" 
                        size="small"
                        sx={{ 
                          bgcolor: tab.color, 
                          color: 'white',
                          '.MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </Stack>
                  ) : null
                }
                
                <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                  {tab.label}
                </Typography>
                
                {/* Icon in the background */}
                <Box 
                  className="icon-bg"
                  sx={{ 
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    opacity: 0.2,
                    transition: 'opacity 0.2s ease-in-out'
                  }}
                >
                  {/*@ts-ignore */}
                  <tab.icon sx={{ fontSize: 140, color: tab.color }} />
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export const AllTab = ({ skillId }: { skillId: string }) => (
  <ToolTabLayout skillId={skillId}>
    {(props: ToolTabRendererProps) => <AllTabRenderer {...props} />}
  </ToolTabLayout>
); 