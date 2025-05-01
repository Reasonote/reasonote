import {useState} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {Check} from "@mui/icons-material";
import {
  Box,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {SequenceActivityConfig} from "@reasonote/activity-definitions";

interface SequenceActivityPreviewProps {
    config: SequenceActivityConfig;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`sequence-preview-tabpanel-${index}`}
            aria-labelledby={`sequence-preview-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export function SequenceActivityPreviewWithAnswers({
    config,
}: SequenceActivityPreviewProps) {
    const isSmallDevice = useIsSmallDevice();
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Paper sx={{ width: '100%', p: 3 }}>
            <Stack spacing={3}>
                <Typography variant="h6">
                    <MuiMarkdownDefault>
                        {config.prompt}
                    </MuiMarkdownDefault>
                </Typography>

                <Divider sx={{ my: 1 }} />
                <Box sx={{ width: '100%' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        aria-label="sequence activity preview tabs"
                        variant={isSmallDevice ? "fullWidth" : "standard"}
                        sx={{ 
                            minHeight: '42px',
                            '& .MuiTabs-flexContainer': {
                                justifyContent: 'center'
                            }
                        }}
                    >
                        <Tab 
                            label="Correct Answer" 
                            icon={<Check fontSize="small" />}
                            iconPosition="start"
                            sx={{ 
                                minHeight: '42px',
                                py: 0.5
                            }}
                        />
                    </Tabs>
                    
                    <TabPanel value={tabValue} index={0}>
                        <Stack spacing={2}>
                            {config.items.map((item, index) => (
                                <Paper
                                    key={index}
                                    sx={{
                                        p: 2,
                                        bgcolor: 'background.paper',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Typography 
                                        variant="body1" 
                                        sx={{ 
                                            mr: 2,
                                            minWidth: '80px',
                                            fontWeight: 'bold' 
                                        }}
                                    >
                                        {config.positionLabels && config.positionLabels[index] 
                                            ? `${config.positionLabels[index]}:` 
                                            : `Position ${index + 1}:`}
                                    </Typography>
                                    <Typography>
                                        {item.label}
                                        {'hiddenPositionLabel' in item && item.hiddenPositionLabel && (
                                            <Typography 
                                                component="span" 
                                                sx={{ 
                                                    ml: 1,
                                                    fontStyle: 'italic',
                                                    color: 'text.secondary'
                                                }}
                                            >
                                                ({item.hiddenPositionLabel})
                                            </Typography>
                                        )}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </TabPanel>
                </Box>
            </Stack>
        </Paper>
    );
}