import {motion} from "framer-motion";

import {
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {getLearningModes} from "./LearningModes";

export const LearningModeSelectorSmall = ({ onExperiencePicked, disabled }) => {
  const theme = useTheme();
  const LearningModes = getLearningModes(theme);

  return (
    <Stack
      direction={'row'}
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
      gap={1}
    >
      {LearningModes.map((mode, index) => (
        <motion.div
          key={mode.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.15, // Stagger the animations
            ease: "easeOut"
          }}
        >
          <Card
            onClick={disabled ? undefined : () => onExperiencePicked(mode.experience)}
            sx={{
              cursor: disabled ? 'default' : 'pointer',
              maxWidth: '140px',
              minWidth: '140px',
              width: '140px',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              transition: 'transform 0.3s, box-shadow 0.3s, border 0.3s',
              backgroundColor: mode.backgroundColor,
              color: theme.palette.primary.contrastText,
              opacity: disabled ? 0.5 : 1,
              borderRadius: '10px',
              border: `2px solid ${disabled ? 'transparent' : theme.palette.divider}`,
              position: 'relative',
              overflow: 'hidden',
              '&:hover': disabled ? {} : {
                transform: 'translateY(-5px)',
                boxShadow: (theme) => theme.shadows[4],
                border: `4px solid ${theme.palette.divider}`,
                '&::before': {
                  animation: 'shimmer 0.8s forwards',
                },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: (theme) => `linear-gradient(45deg, ${theme.palette.background.paper}00 0%, ${theme.palette.background.paper}33 50%, ${theme.palette.background.paper}00 100%)`,
                transform: 'translateX(-100%)',
              },
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
            }}
          >
            {mode.icon}
            <Typography variant="subtitle2" sx={{ mt: 1, fontSize: '0.75rem' }}>{mode.title}</Typography>
            <Typography variant="caption" textAlign="center" sx={{ fontSize: '0.6rem' }}>{mode.description}</Typography>
          </Card>
        </motion.div>
      ))}
    </Stack>
  );
};
