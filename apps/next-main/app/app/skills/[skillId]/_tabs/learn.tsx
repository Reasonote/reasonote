import {useRouter} from "next/navigation";

import {LessonIcon} from "@/components/icons/LessonIcon";
import {Txt} from "@/components/typography/Txt";
import {Stack} from "@mui/material";

import {SkillDiveScreen} from "../dive/page.page";

export function SkillIdLearnTabContent({skillId}: {skillId: string}) {
    const router = useRouter();

    return <Stack gap={1} width={'100%'}>
        <Txt startIcon={<LessonIcon/>} variant="h6"textAlign={'center'} stackOverrides={{sx: {alignContent: 'center', justifyContent: 'center'}}}>Lessons For You</Txt>
        <Stack flex={"1 1 auto"} overflow={'auto'}>
            <SkillDiveScreen 
                skillIdPath={[skillId]}
                onLessonChosen={(l) => {
                    router.push(`/app/lessons/${l.id}/new_session`)
                }}
            />
        </Stack>
    </Stack>
}