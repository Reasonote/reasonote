import _ from "lodash";

import {
  ActivityLoadingSkeleton,
} from "@/components/activity/ActivityLoadingSkeleton";
import {createEmptyActivity} from "@/components/activity/createEmptyActivity";
import {
  CreateActivityDropdownButton,
} from "@/components/activity/generate/CreateActivityDropdownButton";
import {
  GenerateActivitiesModalButton,
} from "@/components/activity/generate/GenerateActivityModalButton";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  DragDropContext,
  Draggable,
  Droppable,
} from "@hello-pangea/dnd";
import {typedUuidV4} from "@lukebechtel/lab-ts-utils";
import {
  AddCircle,
  AutoAwesome,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Card,
  Stack,
} from "@mui/material";
import {
  ActivityType,
  LessonSkillTreeActivityGenerateSkill,
} from "@reasonote/core";

import {LessonEditActivityListItem} from "../LessonEditActivityListItem";

export type ActivityGenerateResult = {
    tmpId: string,
    resultType: 'loading',
    type: ActivityType,
    forSkills?: LessonSkillTreeActivityGenerateSkill[];
    metadata?: {
        activityId: string,
    }
} | {
    tmpId: string,
    resultType: 'success',
    id: string,
    type: ActivityType,
    name: string,
    subject: string,
    metadata: {
        activityId: string,
    },
    forSkills?: LessonSkillTreeActivityGenerateSkill[],
} | {
    tmpId: string,
    resultType: 'error',
    type: ActivityType,
    error: string,
    forSkills?: LessonSkillTreeActivityGenerateSkill[],
    metadata?: {
        activityId: string,
    }
}

interface LessonEditActivitiesTabProps {
    currentActivities: ActivityGenerateResult[];
    setCurrentActivities: React.Dispatch<React.SetStateAction<ActivityGenerateResult[]>>;
    createActivitySystemChooseSkill: (activityType: ActivityType, options?: { additionalInstructions?: string }) => void;
    createActivitiesForSkill: (props: {
        skill: any,
        activityType?: ActivityType,
        fromActivity?: string,
        additionalInstructions?: string
    }) => void;
    lessonId: string;
}

export function LessonEditActivitiesTab({
    currentActivities,
    setCurrentActivities,
    createActivitySystemChooseSkill,
    createActivitiesForSkill,
    lessonId
}: LessonEditActivitiesTabProps) {
    const { sb } = useSupabase();

    const handleCreateActivity = async (activityType: ActivityType) => {
        try {
            const res = await createEmptyActivity(sb, activityType);
            const id = res.id ?? '';
            
            if (currentActivities.some(a => 
                a.resultType === 'success' && 
                a.metadata?.activityId === id
            )) {
                throw new Error('Activity ID already exists');
            }

            const tmpId = Math.random().toString();
            if (currentActivities.some(a => a.tmpId === tmpId)) {
                return handleCreateActivity(activityType);
            }

            setCurrentActivities(existing => [
                ...existing,
                {
                    tmpId,
                    resultType: 'success',
                    id: typedUuidV4('activity_stub'),
                    type: activityType,
                    name: '',
                    forSkill: 'none',
                    subject: 'none',
                    metadata: {
                        activityId: id,
                    }
                }
            ]);
        } catch (e) {
            console.error(e);
        }
    };

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
                <Stack direction={'row'} gap={1} width={'100%'} alignContent={'center'} justifyContent={'center'}>
                    <CreateActivityDropdownButton
                        onActivityTypeCreate={handleCreateActivity}
                        buttonProps={{
                            variant: 'outlined',
                            startIcon: <AddCircle fontSize="small" />,
                            sx: { textTransform: 'none' }
                        }}
                    />
                    <GenerateActivitiesModalButton
                        onGenerateActivities={(props) => {
                            const { activityTypes, activityCount, additionalInstructions } = props;
                            _.range(activityCount).forEach((i) => {
                                const activityType = _.sample(activityTypes);
                                if (activityType) {
                                    createActivitySystemChooseSkill(activityType, { additionalInstructions });
                                }
                            });
                        }}
                    />
                    <CreateActivityDropdownButton
                        onActivityTypeCreate={(activityType) => {
                            createActivitySystemChooseSkill(activityType);
                        }}
                        buttonProps={{
                            variant: 'outlined',
                            startIcon: <Badge
                                badgeContent={<AutoAwesome
                                    sx={{
                                        width: "15px",
                                        height: "15px",
                                    }}
                                />}
                            >
                                <AddCircle fontSize="small" />
                            </Badge>,
                            children: 'Generate Activity',
                            sx: {
                                textTransform: 'none',
                            }
                        }}
                    />
                </Stack>
            </Box>

            <DragDropContext
                onDragEnd={(result) => {
                    if (!result.destination) return;
                    
                    const items = Array.from(currentActivities);
                    const [reorderedItem] = items.splice(result.source.index, 1);
                    items.splice(result.destination.index, 0, reorderedItem);
                    
                    setCurrentActivities(items);
                }}
            >
                <Droppable droppableId="activities">
                    {(provided) => (
                        <Stack 
                            gap={1} 
                            width={'100%'}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {currentActivities.map((act, index) => (
                                <Draggable 
                                    key={act.tmpId} 
                                    draggableId={act.tmpId} 
                                    index={index}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <Card elevation={10} sx={{padding: '10px', width: '100%'}}>
                                                {act.resultType === 'loading' ? (
                                                    <ActivityLoadingSkeleton activityType={act.type} />
                                                ) : act.resultType === 'error' ? (
                                                    <Txt variant={'h6'}>Error: {act.error}</Txt>
                                                ) : (
                                                    <LessonEditActivityListItem
                                                        activityId={act.metadata?.activityId}
                                                        skills={act.forSkills}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        onDelete={() => {
                                                            setCurrentActivities((existing) => {
                                                                return existing.filter((ex) => ex.tmpId !== act.tmpId);
                                                            })
                                                        }}
                                                        onCreateSimilar={(props) => {
                                                            const { skills, activityType } = props;
                                                            const firstSkill = skills?.[0];
                                                            if (!firstSkill) return;
                                                            createActivitiesForSkill({
                                                                skill: firstSkill,
                                                                activityType: activityType as any,
                                                                fromActivity: act.id,
                                                            });
                                                        }}
                                                    />
                                                )}
                                            </Card>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </Stack>
                    )}
                </Droppable>
            </DragDropContext>
        </Stack>
    );
} 