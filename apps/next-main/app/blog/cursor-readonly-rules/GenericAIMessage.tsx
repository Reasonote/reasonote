import React from "react";

import {
  Avatar,
  Box,
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

interface GenericAIMessageProps {
  children: React.ReactNode;
}

export function GenericAIMessage({ children }: GenericAIMessageProps) {
  const theme = useTheme();

  return (
    <Stack
      justifyContent="start"
      alignContent="start"
      alignItems="start"
      flexDirection="column"
      height="max-content"
      gap={1}
      sx={{ mb: 2 }}
    >
      <Stack
        key="msg-header"
        justifyContent="start"
        alignContent="center"
        alignItems="center"
        flexDirection="row"
        gap={2}
        height="max-content"
      >
        <Avatar
          sx={{ 
            width: 24, 
            height: 24, 
            bgcolor: theme.palette.primary.main,
            color: theme.palette.common.white,
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          AI
        </Avatar>
        <Typography color={theme.palette.grey[600]}>AI</Typography>
      </Stack>
      <Card
        sx={{
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "8px",
          maxWidth: "80%",
          padding: "13px",
          width: "max-content",
          height: "min-content",
          "& p": {
            height: "min-content",
            margin: 0,
          },
        }}
        elevation={2}
      >
        <Box>
          {children}
        </Box>
      </Card>
    </Stack>
  );
} 