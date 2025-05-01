'use client'
import {
  useCallback,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {SkillIcon} from "@/components/icons/SkillIcon";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {Txt} from "@/components/typography/Txt";
import {Edit} from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  Stack,
} from "@mui/material";

import {NewActivitiesFromSkillScreen} from "./NewActivitiesFromSkillScreen";

// FUTURE!
// Initial Intent Slide
// - Create from Skill?
// - Create From Existing Activity?
// - Create From Scratch?
// Create From Existing Activity Slide
// - Choose Activities
// - Choose Skills
// - Choose Intent
// Create From Scratch Slide
// - Choose Activity Type
// - Configure Activity Type
// - Choose Skills

export function ActionCard({onClick, children, cardProps, cardActionAreaProps}: {onClick: () => void , children: React.ReactNode, cardProps?: React.ComponentProps<typeof Card>, cardActionAreaProps?: React.ComponentProps<typeof CardActionArea>}){
    return <Card
        {...cardProps}
        sx={{
            borderRadius: '5px',
            padding: '0px',
            ...cardProps?.sx
        }}
    >
        <CardActionArea {...cardActionAreaProps}
            sx={{
                padding: '10px', 
                borderRadius: '5px',
                ...cardActionAreaProps?.sx
            }}
            onClick={onClick}
        >
            <Stack>
                {children}
            </Stack>
        </CardActionArea>
    </Card>
}

function ChooseCreationModeScreen({onModeSelect}: {onModeSelect: (mode: 'fromSkill' | 'fromExistingActivity' | 'fromScratch') => void}){
    return <Stack>
        <Txt variant={'h5'}>Select Creation Mode</Txt>
        <Stack gap={1}>
            <ActionCard onClick={() => {onModeSelect('fromSkill');}}>
                <Stack>
                    <Txt startIcon={<SkillIcon/>} variant={'h6'}>Create From Skill</Txt>
                    <Txt variant={'body1'}>Create new activities from a skill</Txt>
                </Stack>
            </ActionCard>
            <ActionCard onClick={() => {}}>
                <Stack>
                    <Txt startIcon={<ActivityIcon/>} variant={'h6'}>Create From Existing Activity (Coming Soon)</Txt>
                    <Txt variant={'body1'}>Create new activities from an existing activity</Txt>
                </Stack>
            </ActionCard>
            <ActionCard onClick={() => {}}>
                <Stack>
                    <Txt startIcon={<Edit/>} variant={'h6'}>Create From Scratch (Coming Soon)</Txt>
                    <Txt variant={'body1'}>Create new activities from scratch</Txt>
                </Stack>
            </ActionCard>
        </Stack>
    </Stack>
}


export function ComingSoon(){
    return <Stack>
        <Txt variant={'h5'}>Coming Soon</Txt>
    </Stack>
}


export default function ActivityNewPage(){
    const router = useRouter();

    const [createMode, setCreateMode] = useState<'fromSkill' | 'fromExistingActivity' | 'fromScratch' | null>(null);
    
    const createActivityAutomatically = useCallback(async (skillName: string, ) => {

    }, []);
    
    return <CenterPaperStack stackProps={{gap: 1}}>
        {
            createMode === null &&
                <ChooseCreationModeScreen onModeSelect={async (mode) => {
                    setCreateMode(mode);
                }}/>
        }
        {
            createMode === 'fromSkill' &&
                <NewActivitiesFromSkillScreen/>
        }
        {
            createMode === 'fromExistingActivity' &&
                <ComingSoon/>
        }
    </CenterPaperStack>
}
