"use client"
import {
  useCallback,
  useState,
} from "react";

import {
  SkillsAddToSkillTreeRoute,
} from "@/app/api/skills/add_to_skill_tree/routeSchema";
import {
  SkillsReorganizeTreeRoute,
} from "@/app/api/skills/reorganize_tree/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSkillSimpleTree} from "@/clientOnly/hooks/useSkillSimpleTree";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import MobileContent from "@/components/positioning/mobile/MobileContent";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import {SkillTreeV2} from "@/components/skill/SkillTreeV2/SkillTreeV2";
import {TxtFieldWithAction} from "@/components/textFields/TxtFieldWithAction";
import {AddCircle} from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  Stack,
  TextField,
} from "@mui/material";

export default function SkillTreeTestingPage(){
    // Pick a skill
    const [skillId, setSkillId] = useState<string | null>(null)
    const {skills: userSkills} = useUserSkills();
    const {refetch} = useSkillSimpleTree({topicOrId: skillId ?? ''});

    const userId = useRsnUserId();

    const [refetchCount, setRefetchCount] = useState(0)

    const [newSkillName, setNewSkillName] = useState<string | null>(null)

    const addSkillToTree = useCallback((addThisSkill: string) => {
        if (!skillId){
            return;
        }

        const addingNames = addThisSkill.split(',');
       
        SkillsAddToSkillTreeRoute.call({
            skill: {
                id: skillId,
            },
            skillsToAdd: addingNames.map((name) => ({name}))
        })
    }, [skillId])

    return <MobileContent>
        <MobileContentMain>
            <Autocomplete 
                options={userSkills}
                // @ts-ignore
                getOptionLabel={(skill) => skill.name as any}
                onChange={(event, value) => {
                    // @ts-ignore
                    setSkillId(value?.id ?? null)
                }}
                renderInput={(params) => <TextField {...params} label="Skill" />}
            />
            <TxtFieldWithAction
                value={newSkillName ?? ''}
                onChange={(e) => setNewSkillName(e.target.value)}
                label={'New Skill Name'}
                actionIcon={<AddCircle/>}
                onAction={() => {
                    if (newSkillName){
                        addSkillToTree(newSkillName)
                    }
                }}
            />
            <Button onClick={async () => {
                await SkillsReorganizeTreeRoute.call({
                    skillId: skillId ?? '',
                    userId: userId ?? ''
                })

                setRefetchCount((count) => count + 1)
            }}>
                Reorganize
            </Button>
            {skillId ? 
                <>
                    <Button onClick={() => refetch()}>Refresh</Button>
                    <Stack sx={{maxHeight: '400px', height: '400px', overflow: 'auto'}}>
                        <SkillTreeV2 skillId={skillId} refreshCount={refetchCount}/>
                    </Stack>
                </>
                :
                null}
        </MobileContentMain>
    </MobileContent>
}