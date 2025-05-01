import React from "react";

import {
  Biotech,
  EmojiObjects,
  Psychology,
  School,
  Science,
} from "@mui/icons-material";
import {
  SvgIcon,
  Tooltip,
} from "@mui/material";

interface LevelIconProps {
  level: string;
  isActive: boolean;
}

export const LevelIcon: React.FC<LevelIconProps> = ({ level, isActive }) => {
  let Icon;
  switch (level) {
    case 'Beginner':
      Icon = School;
      break;
    case 'Novice':
      Icon = EmojiObjects;
      break;
    case 'Adept':
      Icon = Psychology;
      break;
    case 'Pro':
      Icon = Science;
      break;
    case 'Expert':
      Icon = Biotech;
      break;
    default:
      Icon = School;
  }

  return (
    <Tooltip title={level}>
      <SvgIcon
        component={Icon}
        sx={{
          fontSize: '1.5rem',
          color: isActive ? 'primary.main' : 'text.secondary',
          opacity: isActive ? 1 : 0.5,
        }}
      />
    </Tooltip>
  );
};
