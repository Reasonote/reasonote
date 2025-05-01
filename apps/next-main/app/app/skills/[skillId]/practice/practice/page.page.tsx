'use client'
import { useRouteParamsSingle } from "@/clientOnly/hooks/useRouteParams";
import { Stack } from "@mui/material";
import { Txt } from "@/components/typography/Txt";
import { useRouter } from "next/navigation";
import { PracticePageMain } from "@/components/practice/PracticePageMain";

export default function CoursePracticePage() {
    const { skillId } = useRouteParamsSingle(['skillId']);
    const router = useRouter();


    const handleBack = () => {
        router.push(`/app/skills/${skillId}/practice`);
    };

    if (!skillId) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100%">
                <Txt color="error">Skill not found</Txt>
            </Stack>
        );
    }

    return (
        <Stack height="100%" alignItems="center">
            <Stack
                direction="column"
                sx={{
                    width: '100%',
                    height: '100%',
                    alignContent: "center",
                    justifyContent: "center",
                    maxWidth: '48rem'
                }}
            >
                <PracticePageMain skillId={skillId} onBack={handleBack} />
            </Stack>
        </Stack>
    );
} 