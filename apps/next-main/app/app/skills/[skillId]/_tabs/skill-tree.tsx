import {useRef} from "react";

import {
  useUserActivityCountForSkill,
} from "@/clientOnly/hooks/useUserActivitiesForSkill";
import {SkillTreeV2} from "@/components/skill/SkillTreeV2/SkillTreeV2";
import {Txt} from "@/components/typography/Txt";
import {AccountTree} from "@mui/icons-material";
import {
  Stack,
  Typography,
} from "@mui/material";

export interface SkillIdSkillTreeTabContentProps {
    skillId: string;
}

export function SkillIdSkillTreeTabContent(props: SkillIdSkillTreeTabContentProps) {
    const {skillId} = props;
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Get the Activities associated with this skill
    const activities = useUserActivityCountForSkill({skillId});

    return <Stack width={'100%'} ref={containerRef}>
        <Txt startIcon={<AccountTree/>} variant={'h5'}>Skill Tree</Txt>
        <Typography variant={'body1'}>Your skill tree grows over time, as you study.</Typography>

        <SkillTreeV2 
          skillId={skillId} 
          hideAfterDepth={1}
          showActivityCount
          showScore
          showCreateLesson
          containerRef={containerRef}
        />
    </Stack>
}