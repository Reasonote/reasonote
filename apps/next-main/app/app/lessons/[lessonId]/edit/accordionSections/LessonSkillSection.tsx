import {useState} from "react";

import {SkillChip} from "@/components/chips/SkillChip/SkillChip";
import {TxtFieldWithAction} from "@/components/textFields/TxtFieldWithAction";
import {useApolloClient} from "@apollo/client";
import {
  AddCircle,
  AutoAwesome,
  Delete,
} from "@mui/icons-material";
import {
  Badge,
  Card,
  Chip,
  IconButton,
  Stack,
} from "@mui/material";
import {
  ActivityType,
  LessonConfig,
  LessonSkillTreeActivityGenerateSkill,
} from "@reasonote/core";
import {
  createSkillFlatMutDoc,
  createSkillLinkFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {
  CreateActivityIconDropdownButton,
} from "../../../../../../components/activity/generate/CreateActivityTypeIconButton";
import {LessonSkillTree} from "./SkillSection/LessonSkillTree";

export interface EditLessonSkillsAccordionDetailsProps {
    createActivitiesForSkill: (props: {
        skill: LessonSkillTreeActivityGenerateSkill,
        activityType: ActivityType
    }) => any;
    createSlidesForSkill: (props: {
        skill: LessonSkillTreeActivityGenerateSkill,
    }) => any;
    lessonConfig: LessonConfig;
    onAfterSkillAdded?: (id: string, parentIds?: string[]) => any;
    renderExtraActions?: (skill: LessonSkillTreeActivityGenerateSkill) => React.ReactNode;
}

export function EditLessonSkillsSkillCard({skill, createActivitiesForSkill, lessonConfig}: {skill: LessonSkillTreeActivityGenerateSkill, createActivitiesForSkill: (skillName: string, activityType: ActivityType) => any, lessonConfig: LessonConfig}){
    const skillId = skill.id;

    if (!skillId){
        return <Card elevation={10} sx={{padding: '5px'}}>
            Skill not found
        </Card>
    }
   
    return <Card elevation={10} sx={{padding: '5px'}}>
        <Stack direction={'row'} justifyContent="space-between" alignItems={'center'}>
            <Stack direction={'row'} gap={1}>
                <SkillChip topicOrId={skillId} disableAddDelete/>
                <Chip label={`${(lessonConfig.activities ?? []).filter((act) => !!act.forSkills?.find((sk) => sk.id === skill.id)).length} Activities`} variant="outlined" size="small"/>
            </Stack>
            <Stack direction="row">
                <CreateActivityIconDropdownButton
                    onActivityTypeCreate={(activityType) => {
                        createActivitiesForSkill(skillId, activityType);
                    }}
                    // disabled={skil.length === 0}
                    buttonProps={{
                        // size: 'small'
                        // color: 'gray'
                    }}
                    icon={<Badge
                        badgeContent={<AutoAwesome
                            sx={{
                                width: "15px",
                                height: "15px",
                                // color: theme.palette.purple.light,
                            }}
                        />}
                    >
                        <AddCircle fontSize="small"/>
                    </Badge>}
                    
                />
                <IconButton
                    onClick={() => {
                        // setSkillNames((existing) => {
                        //     return existing.filter((ex) => ex !== skillName);
                        // })
                    }}
                >
                    <Delete/>
                </IconButton>
            </Stack>
        </Stack>
        {/* <CreateActivityTypeButtonGroup
            onActivityTypeCreate={(activityType) => {
                createActivitiesForSkill(skillName, activityType);
            }}
            disabled={!skillName || skillName.trim().length < 2}
        /> */}
        
    </Card>
}

export function EditLessonSkillsAccordionDetails({
    createActivitiesForSkill,
    createSlidesForSkill,
    lessonConfig,
    onAfterSkillAdded,
    renderExtraActions,
}: EditLessonSkillsAccordionDetailsProps){
    const [wipSkillName, setWipSkillName] = useState<string>('');
    const ac = useApolloClient();
    const [refreshCount, setRefreshCount] = useState<number>(0);


    return <Stack direction={'column'} gap={2} justifyContent={'center'} alignContent={'center'}>
        <TxtFieldWithAction
            size="small"
            label={'Add Skill'}
            placeholder="My New Skill"
            value={wipSkillName}
            onChange={(e) => {
                setWipSkillName(e.target.value);
            }}
            actionIcon={<AddCircle/>}
            onAction={async () => {
                // Create this skill
                const {data, errors} = await ac.mutate({
                    mutation: createSkillFlatMutDoc,
                    variables: {
                        objects: [
                            {
                                name: wipSkillName
                            }
                        ]
                    }
                })

                const newSkillId = data?.insertIntoSkillCollection?.records?.map((rec) => rec.id)?.[0]

                if (!newSkillId){
                    console.error("Failed to create new skill", errors);
                    return;
                }

                // Add this skill to the lesson's root skill
                const linkResult = await ac.mutate({
                    mutation: createSkillLinkFlatMutDoc,
                    variables: {
                        objects: {
                                downstreamSkill: lessonConfig.rootSkillId,
                                upstreamSkill: newSkillId,
                                metadata: JSON.stringify({
                                    levelOnParent: 'INTRO'
                                })
                            }
                        
                    }
                })

                if (!linkResult.data){
                    console.error("Failed to create new skill", errors);
                    return;
                }

                setRefreshCount((prev) => prev + 1);

                onAfterSkillAdded?.(newSkillId, [lessonConfig.rootSkillId]);

                setWipSkillName('');
            }}
            enterTriggersAction
        />

        {/* <Button
            onClick={suggestMoreSkills}
        >
            Suggest Skills
        </Button> */}
        
        <LessonSkillTree 
            lessonConfig={{
                ...lessonConfig,
            }}
            refreshCount={refreshCount}
            createActivitiesForSkill={createActivitiesForSkill}
            createSlidesForSkill={createSlidesForSkill}
        />
    </Stack>
}