"use client";

import {useHasLicenseType} from "@/clientOnly/hooks/useHasLicenseType";
import {Txt} from "@/components/typography/Txt";
import {Lock} from "@mui/icons-material";
import {
  Card,
  LinearProgress,
  Typography,
} from "@mui/material";

import FullCenter from "../../../components/positioning/FullCenter";

export default function AdminLayout({ children }: any) {
  const {data: isAdminUser, loading: isAdminUserLoading} = useHasLicenseType("Reasonote-Admin");
  
  const isLoading = isAdminUserLoading;

  return isLoading ? 
    <FullCenter>
      <Card sx={{ padding: "25px" }}>
        <Typography variant="h3">Loading...</Typography>
        <LinearProgress/>
      </Card>
    </FullCenter> 
    :
      isAdminUser ? (
        <div style={{ height: "100%", width: "100%" }}>{children}</div>
      ) : (
        <FullCenter>
          <Card sx={{ padding: "25px" }}>
            <Txt startIcon={<Lock/>} variant="h3">Not Allowed</Txt>
          </Card>
        </FullCenter>
      );
}
