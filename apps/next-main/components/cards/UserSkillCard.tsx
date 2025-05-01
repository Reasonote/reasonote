import {formatDistanceToNow} from "date-fns";
import {motion} from "framer-motion";

import {Txt} from "@/components/typography/Txt";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  type CardProps,
  Stack,
  useTheme,
} from "@mui/material";

interface UserSkillCardProps {
  name: string;
  emoji?: string;
  lastStudied?: Date;
  onClick?: () => void;
}

//@ts-ignore
const MotionCard = motion<CardProps>(Card);

export function UserSkillCard({ name, emoji, lastStudied, onClick }: UserSkillCardProps) {
  const theme = useTheme();

  return (
    <MotionCard 
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeOut"
      }}
      //@ts-ignore
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        background: theme.palette.background.paper,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick ? {
          borderColor: theme.palette.divider,
          '& .background-emoji': {
            transform: 'translate(-50%, -50%) scale(1.1) rotate(-5deg)',
          }
        } : undefined,
        borderRadius: 2,
      }}
      elevation={4}
    >
      {/* Centered blurred background emoji */}
      {emoji && (
        <Box
          className="background-emoji"
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(-5deg)',
            fontSize: '800px',
            opacity: 0.3,
            background: theme.palette.background.paper,
            filter: 'blur(40px)',
            maskImage: `radial-gradient(circle at center, ${theme.palette.background.paper} 0%, transparent 70%)`,
            WebkitMaskImage: `radial-gradient(circle at center, ${theme.palette.background.paper} 0%, transparent 70%)`,
            pointerEvents: 'none',
            transition: 'transform 0.3s ease-in-out',
            width: '200%',
            height: '200%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0,
          }}
        >
          {emoji}
        </Box>
      )}

      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            {emoji && (
              <Avatar 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  fontSize: '1.5rem',
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                {emoji}
              </Avatar>
            )}
            <Stack spacing={0.5} justifyContent="center">
              <Txt variant="h6">{name}</Txt>
              {lastStudied && (
                <Txt color={theme.palette.text.secondary} variant="body2">
                  Last studied {formatDistanceToNow(lastStudied, { addSuffix: true })}
                </Txt>
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </MotionCard>
  );
} 