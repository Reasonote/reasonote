import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {LocalFireDepartment} from "@mui/icons-material";
import {
  Chip,
  Skeleton,
} from "@mui/material";

import {useSkillStreak} from "./useSkillStreak";

export interface SkillStreakChipProps {
    skillId?: string | null | undefined;
    noStreakLabel?: string | JSX.Element;
    noStreakColor?: string;
}

export function SkillStreakChip({skillId, noStreakLabel, noStreakColor}: SkillStreakChipProps) {
    if (notEmpty(skillId)) {
        return <SkillStreakChipLoaded skillId={skillId} noStreakLabel={noStreakLabel} noStreakColor={noStreakColor}/>
    }
    else {
        return <Skeleton variant="rounded">
            <Chip/>
        </Skeleton>
    }
}

export function SkillStreakChipLoaded({skillId, noStreakLabel, noStreakColor}: Omit<SkillStreakChipProps, 'skillId'> & {skillId: string}) {
    const {data: streakCount} = useSkillStreak(skillId);

    return notEmpty(streakCount) ? 
        streakCount > 0 ?
            <Chip color="warning" icon={<LocalFireDepartment color="error" />} label={<b>{streakCount} day streak</b>} />
            :
            <Chip icon={<LocalFireDepartment />} color={noStreakColor ? noStreakColor as any : 'gray'} label={noStreakLabel ? noStreakLabel : <b>No streak</b>} />
        :
        <Chip icon={<LocalFireDepartment />} label={<b>? day streak</b>} />
}