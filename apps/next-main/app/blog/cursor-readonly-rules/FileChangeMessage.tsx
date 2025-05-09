import React from "react";

import {Code} from "@mui/icons-material";
import {
  Box,
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

interface FileChangeMessageProps {
  fileName: string;
  added: number;
  removed: number;
}

export function FileChangeMessage({ fileName, added, removed }: FileChangeMessageProps) {
  const theme = useTheme();

  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      width="100%"
      sx={{ mb: 2 }}
    >
      <Card
        sx={{
          width: "80%",
          maxWidth: "500px",
          borderRadius: "8px",
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}
        elevation={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Code fontSize="small" color="action" />
          <Typography variant="body2" fontWeight="medium" sx={{ flexGrow: 1 }}>
            {fileName}
          </Typography>
          <Box 
            component="span" 
            sx={{ 
              color: theme.palette.success.main, 
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              mr: 1,
            }}
          >
            +{added}
          </Box>
          <Box 
            component="span" 
            sx={{ 
              color: theme.palette.error.main, 
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              fontWeight: 'bold',
            }}
          >
            -{removed}
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
} 