import {ActivityEditor} from "@/components/activity/ActivityEditor";
import {
  ActivityTypesPublic,
} from "@reasonote/core";
import {IconButtonDelete} from "@/components/buttons/IconButtonDelete";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {
  AutoAwesome,
  ContentCopy,
} from "@mui/icons-material";
import {
  Badge,
  Stack,
} from "@mui/material";
import {
  useActivityFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

import {
  CreateActivityIconDropdownButton,
} from "../../../../../components/activity/generate/CreateActivityTypeIconButton";

export interface LessonEditActivityListItemProps {
    activityId: string;
    skills?: {id: string, pathTo: string[]}[];
    onDelete?: () => any;
    onMoveDown?: () => any;
    onMoveUp?: () => any;
    onCreateSimilar?: (props: {activityType: string, skills?: {id: string, pathTo: string[]}[]}) => any;
    dragHandleProps?: any;
}

export function LessonEditActivityListItem({
    activityId, 
    onDelete, 
    onCreateSimilar, 
    skills,
    dragHandleProps
}: LessonEditActivityListItemProps) {
    const {data: act} = useActivityFlatFragLoader(activityId);
    
    return <ActivityEditor 
        activityId={activityId} 
        disableTabIcons={true}
        dragHandleProps={dragHandleProps}
        headerRightContent={<Stack direction={'row'} gap={1}>
            
            {
                skills?.map((skill) => {
                    return <SkillChip topicOrId={skill.id} disableAddDelete disableModal disableLevelIndicator/>
                })
            }
            <CreateActivityIconDropdownButton
                onActivityTypeCreate={(activityType) => {
                    onCreateSimilar?.({skills, activityType});
                }}
                buttonProps={{
                    // size: 'small'
                    // color: 'gray'
                }}
                disabledActivityTypes={ActivityTypesPublic.filter((acttype) => {
                    return acttype !== act?.type;
                })}
                icon={<Badge
                    badgeContent={<AutoAwesome
                        sx={{
                            width: "15px",
                            height: "15px",
                            // color: theme.palette.purple.light,
                        }}
                    />}
                >
                    <ContentCopy fontSize="small"/>
                </Badge>}
            />
            <IconButtonDelete onConfirmDelete={onDelete}/>
            {/* <IconButton size="small" onClick={onDelete}><Delete/></IconButton> */}
            {/* <IconButton size="small" onClick={onMoveUp}><ArrowUpward/></IconButton> */}
            {/* <IconButton size="small" onClick={onMoveDown}><ArrowDownward/></IconButton> */}
        </Stack>}
        tabOrder={['preview', 'edit']}
        startingTab={'preview'}
    />
}