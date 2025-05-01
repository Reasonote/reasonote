import {ReactNode} from "react";

import {useRouter} from "next/navigation";

import {ArrowBackIos} from "@mui/icons-material";
import {
  Breadcrumbs,
  IconButton,
  Stack,
} from "@mui/material";

import {
  SkillChipSkillSelector,
} from "../chips/SkillChip/SkillChipSkillSelector";
import {SkillStreakChip} from "./Streak/SkillStreakChip";

export const SkillHeaderHeight = '60px';

export function SkillHeader({skillId, breadCrumbs, onBack}: {skillId?: string | null | undefined, breadCrumbs?: ReactNode[] | null | undefined, onBack?: () => void}) {
    const router = useRouter();
    
    return <Stack direction={'row'} justifyContent={'space-between'}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
            {onBack && <IconButton onClick={() => {
                onBack();
            }}>
                <ArrowBackIos />
            </IconButton>}
            <Breadcrumbs>
                <SkillChipSkillSelector 
                    topicOrId={skillId || ''} 
                    disableAddDelete 
                    disableLevelIndicator 
                    disableModal
                    onClick={() => {
                        router.push(`/app/skills/${skillId}`);
                    }}
                    onSelectSkill={(newSkillId) => {
                        router.push(`/app/skills/${newSkillId}`);
                    }}
                />
                {breadCrumbs}
            </Breadcrumbs>
        </Stack>
        <Stack>
            <SkillStreakChip skillId={skillId}/> 
        </Stack>
    </Stack>
}