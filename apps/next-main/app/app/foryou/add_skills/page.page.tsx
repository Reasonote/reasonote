'use client'
import {useRouter} from "next/navigation";

import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import FullCenter from "@/components/positioning/FullCenter";
import {
  NewUserCreateSkillDialog,
} from "@/components/skill/NewUserCreateSkillDialog";
import {
  Button,
  Stack,
} from "@mui/material";

export default function ForYouAddSkillsPage(){
    const router = useRouter();
    const { skills: skillData, loading: skillLoading, error } = useUserSkills();

    const hasSkills = skillData && skillData.length > 0;

    return <FullCenter>
        <Stack alignItems={'center'}>
            <NewUserCreateSkillDialog />
            <div>
                <Button 
                    variant={'contained'}
                    disabled={!hasSkills}
                    onClick={() => router.push("/app/foryou")}
                >
                    Let's Go!
                </Button>
            </div>
        </Stack>
    </FullCenter>
}