'use client';

import LessonSessionV2 from "@/components/practice_v2/LessonSessionV2";
import {
  Box,
  Typography,
} from "@mui/material";

export default function LessonV2Page({ params }: { params: { skillId: string, lessonSkillId: string } }) {
    const { skillId, lessonSkillId } = params;

    if (!lessonSkillId) {
        return (
            <Box>
                <Typography>
                    Lesson not found
                </Typography>
            </Box>
        )
    }

    return (
        <LessonSessionV2 rootSkillId={skillId} lessonSkillId={lessonSkillId} numActivitiesPerPart={5} />
    )
}