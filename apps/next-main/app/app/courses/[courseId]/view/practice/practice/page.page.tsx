'use client'
import {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import {PracticePageMain} from "@/components/practice/PracticePageMain";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {Stack} from "@mui/material";

export default function CoursePracticePage() {
    const { courseId } = useRouteParamsSingle(['courseId']);
    const { sb } = useSupabase();
    const router = useRouter();
    const [rootSkillId, setRootSkillId] = useState<string | null>(null);
    const isMobile = useIsSmallDevice();

    useEffect(() => {
        if (!courseId) {
            return;
        }
        const fetchRootSkillId = async () => {
            const { data, error } = await sb.from('course').select('root_skill').eq('id', courseId).single();
            if (error) {
                console.error('Error fetching root skill ID:', error);
            } else {
                setRootSkillId(data?.root_skill ?? null);
            }
        };
        fetchRootSkillId();
    }, [courseId]);

    const handleBack = () => {
        router.push(`/app/courses/${courseId}/view/practice`);
    };

    if (!courseId || !rootSkillId) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100%">
                <Txt color="error">Course not found</Txt>
            </Stack>
        );
    }

    return (
        <Stack gap={2} p={isMobile ? 0 : 2} height="100%" alignItems="center">
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
                <PracticePageMain skillId={rootSkillId} onBack={handleBack} />
            </Stack>
        </Stack>
    );
} 