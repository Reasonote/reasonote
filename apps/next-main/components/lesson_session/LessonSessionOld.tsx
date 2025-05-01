"use client"
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useApolloClient} from "@apollo/client";
import {
  Card,
  Skeleton,
  Stack,
} from "@mui/material";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {LessonSessionHeader} from "./LessonSessionHeader";
import { createLessonSession } from "@/clientOnly/helpers/createLessonSession";

export interface LessonSessionOldProps {
    lessonId: string;
    entityId?: string | null;
    entityType?: string | null;
}

export function LessonSessionOld({ lessonId, entityId, entityType}: LessonSessionOldProps) {
    const isGenerating = useRef<boolean>(false);
    const [lessonSessionId, setLessonSessionId] = useState<string | null>(null);

    const ac = useApolloClient();
    const {sb} = useSupabase();
    const userId = useRsnUserId();
    const {token} = useToken();

    const router = useRouter();

    useAsyncEffect(async () => {
        if (isGenerating.current || !userId || !token || !!lessonSessionId)  return;

        isGenerating.current = true;
        
        try { 
            if (!lessonId) {
                console.warn("No lessonId provided to LessonSessionOld")
                return;
            }

            const sessionId = await createLessonSession({
                lessonId,
                rsnUserId: userId,
                ac
            });

            if (!sessionId) {
                console.error("Failed to create lesson session")
                return;
            }

            setLessonSessionId(sessionId);
        }
        finally {
            isGenerating.current = false;
        }
    }, [userId, token, ac, sb, lessonId]);

    const [pathToRedirectTo, setPathToRedirectTo] = useState<string>('');

    useEffect(() => {
        if (entityId && entityType) {
            if (entityType === 'skill') {
                setPathToRedirectTo(`/app/skills/${entityId}/lessons/session/${lessonSessionId}`);
            }
            else if (entityType === 'course') {
                setPathToRedirectTo(`/app/courses/${entityId}/view/lessons/session/${lessonSessionId}`);
            }
            else {
                setPathToRedirectTo(`/app/lessons/session/${lessonSessionId}`);
            }
        }
        else {
            setPathToRedirectTo(`/app/lessons/session/${lessonSessionId}`);
        }
    }, [lessonSessionId]);

    useEffect(() => {
        if (lessonSessionId) {
            router.push(pathToRedirectTo);
        }
    }, [pathToRedirectTo]);

    const isSmallDevice = useIsSmallDevice();

    return <Stack gap={isSmallDevice ? 0 : .5} sx={{width: isSmallDevice ? '100vw' : '650px'}} maxHeight={'100dvh'}>
        <Card sx={{flexShrink: 0}}>
            {/* Navigate back to the home page. */}
            {lessonId ? <LessonSessionHeader lessonId={lessonId} onPreviousPage={() => router.push(`/`)} /> : null}
        </Card>
        <Skeleton variant="rounded" height={500} width={'100%'}/>
    </Stack>
            
}