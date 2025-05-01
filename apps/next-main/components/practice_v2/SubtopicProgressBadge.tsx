import {
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {Shield} from "@mui/icons-material";
import {
  Box,
  Tooltip,
} from "@mui/material";
import {styled} from "@mui/material/styles";

import {
  determineLevel,
  LEVEL_THRESHOLDS,
  NEXT_LEVEL,
} from "./utils";

// Define gradient IDs
const GRADIENT_IDS = {
  BEGINNER: 'bronze-gradient',
  INTERMEDIATE: 'silver-gradient',
  ADVANCED: 'gold-gradient',
  BEGINNER_BG: 'bronze-bg-gradient',
  INTERMEDIATE_BG: 'silver-bg-gradient',
  ADVANCED_BG: 'gold-bg-gradient',
};

// Plain gray color for empty shield
const EMPTY_COLOR = '#b3b3b3';

// Create styled Shield components with gradients
const BronzeShield = styled(Shield)(() => ({
  '& path': {
    fill: 'url(#bronze-gradient)',
  },
}));

const SilverShield = styled(Shield)(() => ({
  '& path': {
    fill: 'url(#silver-gradient)',
  },
}));

const GoldShield = styled(Shield)(() => ({
  '& path': {
    fill: 'url(#gold-gradient)',
  },
}));

// Background shield components
const EmptyBgShield = styled(Shield)(() => ({
  '& path': {
    fill: EMPTY_COLOR,
  },
  opacity: 0.7,
}));

const BronzeBgShield = styled(Shield)(() => ({
  '& path': {
    fill: 'url(#bronze-bg-gradient)',
  },
  opacity: 0.7,
}));

const SilverBgShield = styled(Shield)(() => ({
  '& path': {
    fill: 'url(#silver-bg-gradient)',
  },
  opacity: 0.7,
}));

// Map level to shield component
const LEVEL_SHIELDS = {
  BEGINNER: BronzeShield,
  INTERMEDIATE: SilverShield,
  ADVANCED: GoldShield,
};

// Map level to background shield component
const BG_LEVEL_SHIELDS = {
  BEGINNER: EmptyBgShield,
  INTERMEDIATE: BronzeBgShield,
  ADVANCED: SilverBgShield,
};

export interface SubtopicProgressBadgeProps {
  // Can accept either a pre-calculated progress value or a score with level
  score: number;
  size?: number;
  id: string;
  showTooltip?: boolean;
}

/**
 * A reusable badge component that displays a user's progress within a level
 * using a shield icon with a fill effect based on the progress percentage.
 * 
 * @param progress - Optional: Number between 0 and 1 representing progress within the current level
 * @param score - Optional: Raw score value (will be used to calculate progress if provided)
 * @param size - Size of the badge in pixels (default: 18)
 * @param id - Unique identifier for the badge (used for animations)
 * @param showTooltip - Whether to show a tooltip on hover (default: false)
 */
export function SubtopicProgressBadge({
  score,
  size = 18,
  id,
  showTooltip = false,
}: SubtopicProgressBadgeProps) {
  const level = determineLevel(score);
  // Calculate progress if score is provided, otherwise use the provided progress
  const calculatedProgress = (score - LEVEL_THRESHOLDS[level]) / (NEXT_LEVEL[level] - LEVEL_THRESHOLDS[level]) || 0

  // Ensure progress is between 0 and 1
  const progress = Math.max(0, Math.min(1, calculatedProgress));

  // Track previous progress to animate from
  const [prevProgress, setPrevProgress] = useState(progress);

  // Update prevProgress when progress changes
  useEffect(() => {
    // Only update after initial render to allow animation from previous state
    const timer = setTimeout(() => {
      setPrevProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress]);

  // Format progress percentage for tooltip
  const progressPercentage = Math.round(progress * 100);
  const tooltipContent = `${level} Level: ${progressPercentage}%`;

  // Get the appropriate shield components based on level
  const ShieldComponent = LEVEL_SHIELDS[level];
  const BgShieldComponent = BG_LEVEL_SHIELDS[level];

  const badgeContent = (
    <Box sx={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* SVG Definitions for gradients - only for the medal badges, not for empty/gray */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Bronze gradient - more reddish/copper tone */}
          <linearGradient id={GRADIENT_IDS.BEGINNER} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8c5e28" />
            <stop offset="50%" stopColor="#cd9c59" />
            <stop offset="100%" stopColor="#8c5e28" />
          </linearGradient>

          {/* Bronze background gradient (more muted) */}
          <linearGradient id={GRADIENT_IDS.BEGINNER_BG} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c4e18" />
            <stop offset="50%" stopColor="#ad8c49" />
            <stop offset="100%" stopColor="#7c4e18" />
          </linearGradient>

          {/* Silver gradient */}
          <linearGradient id={GRADIENT_IDS.INTERMEDIATE} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c0c0c0" />
            <stop offset="50%" stopColor="#f5f5f5" />
            <stop offset="100%" stopColor="#c0c0c0" />
          </linearGradient>

          {/* Silver background gradient (more muted) */}
          <linearGradient id={GRADIENT_IDS.INTERMEDIATE_BG} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a0a0a0" />
            <stop offset="50%" stopColor="#d5d5d5" />
            <stop offset="100%" stopColor="#a0a0a0" />
          </linearGradient>

          {/* Gold gradient - more vibrant yellow/gold */}
          <linearGradient id={GRADIENT_IDS.ADVANCED} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffc000" />
            <stop offset="50%" stopColor="#fffacd" />
            <stop offset="100%" stopColor="#ffc000" />
          </linearGradient>

          {/* Gold background gradient (more muted) */}
          <linearGradient id={GRADIENT_IDS.ADVANCED_BG} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0a800" />
            <stop offset="50%" stopColor="#f0e0a0" />
            <stop offset="100%" stopColor="#e0a800" />
          </linearGradient>
        </defs>
      </svg>

      {/* Background medal (always full) */}
      <BgShieldComponent
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Foreground medal (filled based on progress) - using a clipPath approach */}
      <AnimatePresence mode="wait">
        <Box
          component={motion.div}
          key={`${id}-${level}-${progress}`}
          initial={{ clipPath: `inset(${100 - (prevProgress * 100)}% 0 0 0)` }}
          animate={{ clipPath: `inset(${100 - (progress * 100)}% 0 0 0)` }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: "easeOut"
          }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ShieldComponent
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </Box>
      </AnimatePresence>
    </Box>
  );

  // Wrap with tooltip if showTooltip is true
  return showTooltip ? (
    <Tooltip title={tooltipContent} placement="top" arrow>
      {badgeContent}
    </Tooltip>
  ) : badgeContent;
} 