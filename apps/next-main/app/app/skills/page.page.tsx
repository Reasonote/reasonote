"use client";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {UserSkillSetList} from "@/components/lists/UserSkillSetList";
import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import {
  Stack,
} from "@mui/material";

export default function Component() {
  const isSmallDevice = useIsSmallDevice()

  return (
    <MainMobileLayout>
        <Stack style={{height: '800px', width: '100%'}}>
          <UserSkillSetList />
        </Stack>
        {/* <Typography variant="body1" sx={{ mb: 2 }}>
            Suggested Skills
        </Typography>
        <Stack style={{height: '300px', width: '100%', overflowY: 'scroll'}}>
          
          <SuggestedSkills />
        </Stack> */}
    </MainMobileLayout> 
  );
}
