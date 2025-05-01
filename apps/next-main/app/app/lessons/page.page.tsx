'use client'
import { Stack } from "@mui/material";

import { UserLessonList } from "@/components/lists/UserLessonList";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import { MainMobileLayout } from "@/components/positioning/MainMobileLayout";

export default function LessonsPage() {
  const isSmallDevice = useIsSmallDevice();

  return (
    <Stack height="100%" alignItems="center">
      {isSmallDevice ? (
        <MainMobileLayout>
          <Stack gap={2} p={2} height="100%" alignItems="center">
            <UserLessonList />
          </Stack>
        </MainMobileLayout>
      ) : (
        <Stack gap={2} p={2} height="100%" alignItems="center">
          <UserLessonList />
        </Stack>
      )}
    </Stack>
  );
}
