import {motion} from "framer-motion";
import {
  ArrowUp,
  Circle,
  ArrowRight,
} from "lucide-react";

import {IconButton, useTheme, CircularProgress} from "@mui/material";

interface AnimatedSubmitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function AnimatedSubmitButton({ onClick, disabled, loading }: AnimatedSubmitButtonProps) {
  const theme = useTheme();
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: 'relative',
        width: 40,
        height: 40,
        padding: 0,
        transition: 'all 0.2s ease-in-out',
        opacity: disabled ? 0.5 : 1,
        '&:hover': {
          transform: 'scale(1.1)',
        }
      }}
    >
      {loading ? (
        <CircularProgress size={24} color="primary" />
      ) : (
        <motion.div
          initial={false}
          animate={{
            scale: disabled ? 0.9 : 1,
            opacity: disabled ? 0 : 1,
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Background circle */}
          <motion.div
            initial={false}
            animate={{
              scale: disabled ? 0.9 : 1,
              opacity: disabled ? 0 : 1,
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'rgb(22, 160, 133)',
            }}
          />
          
          {/* Circle outline */}
          <motion.div
            initial={false}
            animate={{
              opacity: disabled ? 1 : 0,
              scale: disabled ? 1 : 0.9,
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Circle 
              size={40} 
              strokeWidth={1.5}
              color="rgb(22, 160, 133)"
            />
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={false}
            animate={{
              y: disabled ? 0 : -1,
              scale: disabled ? 1 : 0.9,
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowRight 
              size={20} 
              color={disabled ? theme.palette.primary.main : theme.palette.text.primary}
              strokeWidth={2}
              className="animate-draw-in"
            />
          </motion.div>
        </motion.div>
      )}
    </IconButton>
  );
} 