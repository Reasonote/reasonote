import React, {ReactNode} from "react";

import {
  Paper,
  Stack,
} from "@mui/material";

interface ThreadProps {
  children: ReactNode;
}

export function Thread({ children }: ThreadProps) {
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 3, 
        my: 3, 
        borderRadius: 2,
        bgcolor: (theme) => theme.palette.background.paper,
      }}
    >
      <Stack spacing={1}>
        {children}
      </Stack>
    </Paper>
  );
} 