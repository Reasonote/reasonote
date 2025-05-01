import React from "react";

import {Avatar, useTheme} from "@mui/material";

import {EducationalIcons} from "../icons/EducationalIcons";
import VoronoiBackground from "./VoronoiBackground";

interface VoronoiBackgroundDefaultProps {
  scale?: number;
}

const VoronoiBackgroundDefault: React.FC<VoronoiBackgroundDefaultProps> = ({ scale = 1 }) => {
  const theme = useTheme();

  const backgroundColor = theme.palette.background.paper;
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      pointerEvents: 'none',
    }}>
      <VoronoiBackground
        baseColor={theme.palette.gray.light}
        pulseColor={theme.palette.primary.main}
        NodeComponents={EducationalIcons.map((Icon) =>  
          <Avatar 
            sx={{
              backgroundColor: backgroundColor,
              color: theme.palette.gray.light,
            }}
          >
            <Icon fontSize="medium" />
          </Avatar>
        )}
        backgroundColor={backgroundColor}
        scalingFactor={6 * scale}
        smallScreenScalingFactor={10 * scale}
        smallScreenCutoffPx={550}
      />
    </div>
  );
};

export default VoronoiBackgroundDefault;