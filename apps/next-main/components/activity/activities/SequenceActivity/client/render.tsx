import {
  useEffect,
  useState,
} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  ActivityComponentCallbacks,
} from "@/components/activity/activities/ActivityComponent";
import {vAIPageContext} from "@/components/chat/ChatBubble";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {
  DragDropContext,
  Draggable,
  Droppable,
} from "@hello-pangea/dnd";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Check,
  Close,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  SequenceActivityConfig,
  SequenceResult,
  SequenceSubmitRequest,
} from "@reasonote/activity-definitions";

interface SequenceActivityProps {
    config: SequenceActivityConfig;
    // @ts-ignore - Using server-side grading
    callbacks?: ActivityComponentCallbacks<SequenceSubmitRequest, SequenceResult>;
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
            id={`sequence-tabpanel-${index}`}
            aria-labelledby={`sequence-tab-${index}`}
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

export function SequenceActivity({
    config,
    callbacks,
}: SequenceActivityProps) {
    const [items, setItems] = useState(config.items);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [tabValue, setTabValue] = useState(1);
    const isSmallDevice = useIsSmallDevice();

    const correctSequence = config.items.map(item => item.id);

    useEffect(() => {
        // Shuffle items initially
        setItems([...config.items].sort(() => Math.random() - 0.5));
    }, []);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const reorderedItems = Array.from(items);
        const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, reorderedItem);

        setItems(reorderedItems);
    };

    const handleSubmit = async () => {
        setIsSubmitted(true);
        
        // Prepare submission data
        const userSequence = items.map(item => item.id);
        
        // Submit to server for grading
        if (callbacks?.onSubmission) {
            // @ts-ignore - Using server-side grading
            const submitResult = await callbacks.onSubmission({
                userSequence
            });

            // TODO: use submission result...
            submitResult.submitResult.details
        }
        
        // Log context for AI
        vAIPageContext(
            trimLines(`
                The user has completed the sequence activity:
                Prompt: ${config.prompt}
                User's sequence: ${items.map(item => item.label).join(' → ')}
            `)
        );
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Get the correct order of items
    const correctItems = correctSequence.map(id => 
        config.items.find(item => item.id === id)
    ).filter(Boolean);

    // Check if an item is in the correct position
    const isItemCorrect = (item: any, index: number) => {
        return item.id === correctSequence[index];
    };

    // Render user's submitted sequence
    const renderUserSequence = () => (
        <Stack spacing={2}>
            {items.map((item, index) => (
                <Stack 
                    key={index} 
                    direction="row" 
                    spacing={2} 
                    alignItems="center"
                >
                    <Typography 
                        sx={{ 
                            fontWeight: 'bold',
                            textAlign: 'right'
                        }}
                    >
                        {config.positionLabels && config.positionLabels[index] 
                            ? `${config.positionLabels[index]}: ` 
                            : `${index + 1}: `}
                    </Typography>
                    <Paper
                        sx={{
                            p: 2,
                            bgcolor: 'background.paper',
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {isItemCorrect(item, index) ? (
                            <Check sx={{ color: 'success.main', mr: 1 }} />
                        ) : (
                            <Close sx={{ color: 'error.main', mr: 1 }} />
                        )}
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
                </Stack>
            ))}
        </Stack>
    );

    // Render correct sequence
    const renderCorrectSequence = () => (
        <Stack spacing={2}>
            {correctItems.map((item, index) => {
                // Find this item's position in the user's sequence
                const userIndex = items.findIndex(i => i.id === item?.id);
                const isCorrectlyPlaced = userIndex === index;
                
                return (
                    <Stack 
                        key={index} 
                        direction="row" 
                        spacing={2} 
                        alignItems="center"
                    >
                        <Typography 
                            sx={{ 
                                fontWeight: 'bold',
                                textAlign: 'right'
                            }}
                        >
                            {config.positionLabels && config.positionLabels[index] 
                                ? `${config.positionLabels[index]}: ` 
                                : `${index + 1}: `}
                        </Typography>
                        <Paper
                            sx={{
                                p: 2,
                                bgcolor: 'background.paper',
                                flexGrow: 1,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {isCorrectlyPlaced ? (
                                <Check sx={{ color: 'success.main', mr: 1 }} />
                            ) : (
                                <Close sx={{ color: 'error.main', mr: 1 }} />
                            )}
                            <Typography>
                                {item?.label}
                                {item && 'hiddenPositionLabel' in item && item.hiddenPositionLabel && (
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
                    </Stack>
                );
            })}
        </Stack>
    );

    return (
        <Paper sx={{ width: '100%', p: 3 }}>
            <Stack spacing={3}>
                <Typography variant="h6">
                    <MuiMarkdownDefault>
                        {config.prompt}
                    </MuiMarkdownDefault>
                </Typography>

                {!isSubmitted ? (
                    <>
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="sequence-items" isDropDisabled={isSubmitted}>
                                {(provided, snapshot) => (
                                    <Stack
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        spacing={2}
                                    >
                                        {items.map((item, index) => (
                                            <Stack 
                                                key={item.id} 
                                                direction="row" 
                                                spacing={2} 
                                                alignItems="center"
                                            >
                                                <Typography 
                                                    sx={{ 
                                                        fontWeight: 'bold',
                                                        textAlign: 'right'
                                                    }}
                                                >
                                                    {config.positionLabels && config.positionLabels[index] 
                                                        ? `${config.positionLabels[index]}: ` 
                                                        : `${index + 1}: `}
                                                </Typography>
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={index}
                                                    isDragDisabled={isSubmitted}
                                                >
                                                    {(provided) => (
                                                        <Paper
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            sx={{
                                                                p: 2,
                                                                bgcolor: 'background.paper',
                                                                flexGrow: 1,
                                                                cursor: isSubmitted ? 'default' : 'grab'
                                                            }}
                                                        >
                                                            <Typography>
                                                                {item.label}
                                                                {isSubmitted && 
                                                                'hiddenPositionLabel' in item && 
                                                                item.hiddenPositionLabel && (
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
                                                    )}
                                                </Draggable>
                                            </Stack>
                                        ))}
                                        {provided.placeholder}
                                    </Stack>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <Button
                            variant="contained"
                            startIcon={<Check />}
                            onClick={handleSubmit}
                            fullWidth={isSmallDevice}
                        >
                            Submit
                        </Button>
                    </>
                ) : (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ width: '100%' }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange}
                                aria-label="sequence activity tabs"
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
                                <Tab 
                                    label="Your Answer" 
                                    icon={<CurUserAvatar sx={{ width: 24, height: 24 }} />}
                                    iconPosition="start"
                                    sx={{ 
                                        minHeight: '42px',
                                        py: 0.5
                                    }}
                                />
                            </Tabs>
                            
                            <TabPanel value={tabValue} index={0}>
                                {renderCorrectSequence()}
                            </TabPanel>
                            
                            <TabPanel value={tabValue} index={1}>
                                {renderUserSequence()}
                            </TabPanel>
                        </Box>
                    </>
                )}
            </Stack>
        </Paper>
    );
}