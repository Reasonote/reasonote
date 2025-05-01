import React from "react";

import { Txt } from "@/components/typography/Txt";
import { PropsOf } from "@emotion/react";
import { Card, CardActionArea, Stack, Typography } from "@mui/material";

interface PracticeCardProps {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  backgroundColor: string;
  textColor?: string;
  border?: string;
  slots?: {
    card?: PropsOf<typeof Card>
  }
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  backgroundColor,
  textColor = 'inherit',
  border,
  slots
}) => {
  return (
    <Card
      {...slots?.card}
      sx={{
        backgroundColor: backgroundColor,
        border: border ?? '2px solid',
        borderRadius: 5,
        cursor: 'pointer',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 0,
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: (theme) => theme.shadows[10],
          ...slots?.card?.sx?.['&:hover']
        },
        ...slots?.card?.sx
      }}
      onClick={onClick}
    >
      <CardActionArea sx={{ p: 2, height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Icon
            fontSize="small"
            sx={{
              color: textColor,
              ...(typeof Icon !== 'string' && {
                '& > *': { stroke: textColor }
              })
            }}
          />
          <Txt variant="body1" fontWeight="bold" color={textColor}>{title}</Txt>
        </Stack>
        <Typography variant="body2" fontWeight="bold" color={textColor}>{description}</Typography>
      </CardActionArea>
    </Card>
  );
};