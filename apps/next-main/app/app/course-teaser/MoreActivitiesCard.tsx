import React from "react";

import {motion} from "framer-motion";
import {Plus} from "lucide-react";

import {
  Box,
  Card,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

interface MoreActivitiesCardProps {
  onClick?: () => void;
}

export function MoreActivitiesCard({ onClick }: MoreActivitiesCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        onClick={onClick}
        sx={{
          p: 2,
          cursor: 'pointer',
          borderRadius: '10px',
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[2],
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Plus size={24} />
          </Box>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Create Your Free Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a free account to unlock all activities
            </Typography>
          </Stack>
        </Stack>
      </Card>
    </motion.div>
  );
} 