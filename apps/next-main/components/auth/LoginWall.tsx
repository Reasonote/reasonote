"use client";

import {useEffect} from "react";

import {useRouter} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  Card,
  LinearProgress,
  Typography,
} from "@mui/material";

import FullCenter from "../positioning/FullCenter";

interface LoginWallProps {
  children: React.ReactNode;
  extraUrlParams?: Record<string, string>;
}

export default function LoginWall({ children, extraUrlParams }: LoginWallProps) {
  const router = useRouter();
  const {userStatus, loading} = useRsnUser();

  useEffect(() => {
    if (!loading && userStatus === "unknown") {
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);

      const urlParams = new URLSearchParams(extraUrlParams);
      router.push(`/app/login?redirectTo=${currentUrl}&${urlParams.toString()}`);
    }
  }, [loading, userStatus]);

  if (loading) {
    return (
      <FullCenter>
        <Card sx={{ padding: "25px" }}>
          <Typography variant="h5">Loading...</Typography>
          <LinearProgress />
        </Card>
      </FullCenter>
    );
  }

  if (userStatus === "unknown") {
    return null; // This will prevent any flicker before redirect
  }

  return <>{children}</>;
}