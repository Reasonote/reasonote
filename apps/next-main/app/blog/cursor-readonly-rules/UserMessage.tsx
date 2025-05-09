import React from "react";

import {
  Avatar,
  Box,
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {grey} from "@mui/material/colors";

interface UserMessageProps {
  children: React.ReactNode;
}

export function UserMessage({ children }: UserMessageProps) {
  const theme = useTheme();

  return (
    <Stack
      justifyContent="end"
      alignContent="end"
      alignItems="end"
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
            bgcolor: theme.palette.grey[700],
            color: theme.palette.grey[100],
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          U
        </Avatar>
        <Typography color={theme.palette.grey[600]}>User</Typography>
      </Stack>
      <Card
        sx={{
          color: grey[50],
          backgroundColor: theme.palette.primary.main,
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
        elevation={4}
      >
        <Box>
          {children}
        </Box>
      </Card>
    </Stack>
  );
} 