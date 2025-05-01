import React from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Box} from "@mui/material";
import {ReasonoteLicenseType} from "@reasonote/core";

import {
  FriendlyNotifierContent,
  FriendlyNotifierFeature,
} from "./FriendlyNotifierContent";

interface FriendlyNotifierPopoverProps {
  title: string;
  subtitle: string | React.ReactNode;
  features: FriendlyNotifierFeature[];
  licenseType: ReasonoteLicenseType;
  illustration?: string;
}

export function FriendlyNotifierPopover(props: FriendlyNotifierPopoverProps) {
  const isSmallDevice = useIsSmallDevice();

  return (
    <Box
      sx={{
        background: (theme) => theme.palette.background.paper,
        border: '1px solid',
        borderColor: 'primary.light',
        borderRadius: 3,
        boxShadow: (theme) => `0 4px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
        p: isSmallDevice ? 2 : 3,
        pb: isSmallDevice ? 3 : 4,
        maxWidth: 600,
        mx: 'auto',
        maxHeight: '75vh',
        overflow: 'auto',
      }}
    >
      <FriendlyNotifierContent {...props} />
    </Box>
  );
} 