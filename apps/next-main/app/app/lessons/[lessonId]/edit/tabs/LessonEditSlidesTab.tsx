'use client'
import {useState} from "react";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {IconButtonDelete} from "@/components/buttons/IconButtonDelete";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  DragDropContext,
  Draggable,
  Droppable,
} from "@hello-pangea/dnd";
import {
  AddCircle,
  AutoAwesome,
  DragIndicator,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  Card,
  CardHeader,
  LinearProgress,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import {LessonSkillTreeActivityGenerateSkill} from "@reasonote/core";
import {typedUuidV4} from "@reasonote/lib-utils";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

export type Slide = {
    id: string;
    emoji: string;
    title: string;
    content: string;
    skillId?: string;
    isLoading?: boolean;
}

function generateSlideId() {
    return typedUuidV4('actvty');
}

interface LessonEditSlidesTabProps {
    slides: Slide[];
    setSlides: (slides: Slide[]) => void;
    isSlidesLoading: boolean;
    generateSlidesForLesson: () => Promise<void>;
    generateSlideForSkill: (props: {skill: LessonSkillTreeActivityGenerateSkill}) => Promise<void>;
    slidesError: string | null;
    rootSkillId: string;
}

export function LessonEditSlidesTab({ 
    slides, 
    setSlides, 
    isSlidesLoading,
    generateSlidesForLesson,
    generateSlideForSkill,
    slidesError,
    rootSkillId,
}: LessonEditSlidesTabProps) {
    const [editingSlideStates, setEditingSlideStates] = useState<{[key: string]: 'edit' | 'preview'}>({});
    const [skillMenuAnchor, setSkillMenuAnchor] = useState<null | HTMLElement>(null);

    const [skills, setSkills] = useState<LessonSkillTreeActivityGenerateSkill[]>([]);
    const {supabase: sb} = useSupabase();
    const userId = useRsnUserId();

    useAsyncEffect(async () => {
        if (!rootSkillId || !userId){
            console.warn('No root skill id or user id found');
            return;
        }

        const ret = await sb.rpc('get_linked_skills_with_scores', {
            input_skill_id: rootSkillId,
            user_id: userId,
        });

        if (ret.data){
            setSkills(ret.data.map((skill) => ({
                id: skill.skill_id,
                pathTo: skill.path_to,
            })));
        }
    }, [rootSkillId, userId]);

    if (!rootSkillId || !userId){
        console.warn('No root skill id or user id found');
        return null;
    }

    return (
        <Stack 
            gap={2} 
            alignItems={'center'} 
            width={'100%'} 
            sx={{
                position: 'relative'
            }}
        >
            <Box 
                sx={{ 
                    position: 'sticky',
                    top: -16,
                    zIndex: 1,
                    bgcolor: 'background.default',
                    width: '100%',
                    mt: -2,
                    py: 2,
                }}
            >
                <Stack direction="row" gap={1} justifyContent="center">
                    <Button
                        variant="outlined"
                        startIcon={<AddCircle fontSize="small" />}
                        onClick={() => {
                            setSlides([...slides, {
                                id: generateSlideId(),
                                emoji: '📝',
                                title: 'New Slide',
                                content: ''
                            }]);
                        }}
                        sx={{ textTransform: 'none' }}
                    >
                        Create Slide
                    </Button>
                    
                    <Button
                        variant="contained"
                        disabled={isSlidesLoading || (slides.length > 0)}
                        onClick={async () => await generateSlidesForLesson()}
                    >
                        {isSlidesLoading ? 'Generating Slides...' : 'Generate Slides'}
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={
                            <Badge
                                badgeContent={<AutoAwesome sx={{ width: "15px", height: "15px" }} />}
                            >
                                <AddCircle fontSize="small" />
                            </Badge>
                        }
                        onClick={(e) => setSkillMenuAnchor(e.currentTarget)}
                        sx={{ textTransform: 'none' }}
                    >
                        Generate Slide
                    </Button>

                    <Menu
                        anchorEl={skillMenuAnchor}
                        open={Boolean(skillMenuAnchor)}
                        onClose={() => setSkillMenuAnchor(null)}
                    >
                        {skills.map((skill) => (
                            <MenuItem 
                                key={skill.id}
                                onClick={() => {
                                    generateSlideForSkill({
                                        skill: {
                                            id: skill.id,
                                            pathTo: skill.pathTo
                                        }
                                    });
                                    setSkillMenuAnchor(null);
                                }}
                                sx={{ 
                                    minWidth: '200px',
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    gap: 1
                                }}
                            >
                                <SkillChip 
                                    topicOrId={skill.id}
                                    disableAddDelete
                                    disableModal
                                    disableLevelIndicator
                                />
                            </MenuItem>
                        ))}
                    </Menu>
                </Stack>
            </Box>

            {slidesError && (
                <Card elevation={4} sx={{ padding: 2, bgcolor: 'error.light' }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Txt color="error.contrastText" startIcon={<ErrorIcon />}>
                            {slidesError}
                        </Txt>
                    </Stack>
                </Card>
            )}
            {slides.length > 0 ? (
                <div>
                <DragDropContext
                    onDragEnd={(result) => {
                        if (!result.destination) return;
                        
                        const newSlides = Array.from(slides);
                        const [reorderedSlide] = newSlides.splice(result.source.index, 1);
                        newSlides.splice(result.destination.index, 0, reorderedSlide);
                        
                        setSlides(newSlides);
                    }}
                >
                    <Droppable droppableId="slides">
                        {(provided) => (
                            <Stack 
                                gap={2} 
                                width="100%"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {slides.map((slide, index) => (
                                    <Draggable 
                                        key={slide.id} 
                                        draggableId={slide.id} 
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <Card 
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                elevation={snapshot.isDragging ? 8 : 6}
                                                sx={{ width: '100%' }}
                                            >
                                                {slide.isLoading ? (
                                                    <Stack gap={2} sx={{ p: 2 }}>
                                                        <Skeleton variant="rounded" height={200} />
                                                    </Stack>
                                                ) : (
                                                    <Stack gap={2}>
                                                        <Stack 
                                                            direction="row" 
                                                            justifyContent="space-between" 
                                                            alignItems="center"
                                                            {...provided.dragHandleProps}
                                                            sx={{ 
                                                                cursor: 'grab',
                                                                px: 2,
                                                                pt: 2
                                                            }}
                                                        >
                                                            <Stack direction="row" alignItems="center" gap={1}>
                                                                <DragIndicator 
                                                                    sx={{ 
                                                                        color: 'text.secondary',
                                                                        opacity: 0.5,
                                                                        '&:hover': {
                                                                            opacity: 1
                                                                        }
                                                                    }} 
                                                                />
                                                                <CardHeader
                                                                    title={<Txt startIcon={slide.emoji} variant="h5">{slide.title}</Txt>}
                                                                    sx={{ wordBreak: 'break-word', p: 0 }}
                                                                />
                                                            </Stack>
                                                            <IconButtonDelete 
                                                                onConfirmDelete={() => {
                                                                    const newSlides = [...slides];
                                                                    newSlides.splice(index, 1);
                                                                    setSlides(newSlides);
                                                                }}
                                                                iconButtonProps={{
                                                                    size: 'small'
                                                                }}
                                                                svgIconProps={{
                                                                    fontSize: 'small'
                                                                }}
                                                            />
                                                        </Stack>

                                                        <Tabs 
                                                            value={editingSlideStates[slide.id] || 'preview'}
                                                            onChange={(e, newValue) => {
                                                                setEditingSlideStates(prev => ({
                                                                    ...prev,
                                                                    [slide.id]: newValue
                                                                }));
                                                            }}
                                                            sx={{ px: 2 }}
                                                            centered
                                                        >
                                                            <Tab 
                                                                label="Preview" 
                                                                value="preview"
                                                                sx={{ minHeight: 48 }}
                                                            />
                                                            <Tab 
                                                                label="Edit" 
                                                                value="edit"
                                                                sx={{ minHeight: 48 }}
                                                            />
                                                        </Tabs>

                                                        <Box sx={{ px: 2, pb: 2 }}>
                                                            {editingSlideStates[slide.id] === 'edit' ? (
                                                                <Stack gap={2}>
                                                                    <TextField
                                                                        value={slide.title}
                                                                        onChange={(e) => {
                                                                            const newSlides = [...slides];
                                                                            newSlides[index] = {
                                                                                ...slide,
                                                                                title: e.target.value
                                                                            };
                                                                            setSlides(newSlides);
                                                                        }}
                                                                        label="Title"
                                                                        fullWidth
                                                                        size="small"
                                                                    />
                                                                    <TextField
                                                                        value={slide.content}
                                                                        onChange={(e) => {
                                                                            const newSlides = [...slides];
                                                                            newSlides[index] = {
                                                                                ...slide,
                                                                                content: e.target.value
                                                                            };
                                                                            setSlides(newSlides);
                                                                        }}
                                                                        label="Content"
                                                                        multiline
                                                                        rows={4}
                                                                        fullWidth
                                                                        sx={{
                                                                            whiteSpace: 'pre-wrap',
                                                                            wordWrap: 'break-word',
                                                                        }}
                                                                    />
                                                                </Stack>
                                                            ) : (
                                                                <Stack gap={2}>
                                                                    <MuiMarkdownDefault>
                                                                        {slide.content}
                                                                    </MuiMarkdownDefault>
                                                                </Stack>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                )}
                                            </Card>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Stack>
                        )}
                    </Droppable>
                </DragDropContext>
                
                </div>
            ) : (
                <Card elevation={1} sx={{ padding: 2, textAlign: 'center' }}>
                    <Txt color="text.secondary">No slides generated yet. Click the button above to generate slides.</Txt>
                </Card>
            )}

            {isSlidesLoading ? (
                <Card elevation={4} sx={{ padding: 2, textAlign: 'center' }}>
                    <Stack gap={2} alignItems="center">
                        <Txt color="text.secondary">Generating slides...</Txt>
                        <LinearProgress sx={{width: '100%'}} />
                    </Stack>
                </Card>
            ) : null}
        </Stack>
    );
} 