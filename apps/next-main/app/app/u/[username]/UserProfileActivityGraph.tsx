"use client";

import {
  useEffect,
  useState,
} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  type UserProfile,
  useUserProfile,
} from "@/clientOnly/hooks/useUserProfile";
import {ActivityHeatmap} from "@/components/activity/ActivityHeatmap";
import {
  Box,
  Typography,
} from "@mui/material";

interface UserProfileActivityGraphProps {
  username: string;
}

export function UserProfileActivityGraph({ username }: UserProfileActivityGraphProps) {
  const { getUserProfileByUsername } = useUserProfile();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const isSmallDevice = useIsSmallDevice();

  useEffect(() => {
    async function loadProfile() {
      const { data } = await getUserProfileByUsername(username);
      setUserProfile(data);
    }
    loadProfile();
  }, [username, getUserProfileByUsername]);

  if (!userProfile?.show_activity_graph) return null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Activity
      </Typography>
      <ActivityHeatmap maxDays={isSmallDevice ? 130 : 300} />
    </Box>
  );
} 