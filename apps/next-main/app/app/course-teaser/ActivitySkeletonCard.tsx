import React from "react";

import {motion} from "framer-motion";

import {
  Card,
  Skeleton,
  Stack,
} from "@mui/material";

export function ActivitySkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Card
        sx={{
          p: 2,
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={1}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="90%" height={24} />
          <Skeleton variant="text" width="30%" height={20} />
        </Stack>
      </Card>
    </motion.div>
  );
} 