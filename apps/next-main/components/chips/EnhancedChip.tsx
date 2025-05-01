import React from "react";

import {
  Chip,
  ChipProps,
  Tooltip,
} from "@mui/material";

export type EnhancedChipProps = Omit<ChipProps, 'label'> & {
  label: string;
  maxWidth?: number;
  maxLines?: number;
}

export function EnhancedChip({ label, maxWidth = 200, maxLines = 2, ...rest }: EnhancedChipProps) {
  const isLongLabel = label.length > 20;
  const isVeryLongLabel = label.length > 40;

  const chipLabel = (
    <span
      style={{
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word',
        fontSize: isVeryLongLabel ? 'xx-small' : isLongLabel ? 'x-small' : 'inherit',
      }}
    >
      {label}
    </span>
  );

  return (
    <Tooltip title={label} enterDelay={500}>
      <Chip
        label={chipLabel}
        {...rest}
        sx={{
          maxWidth: `${maxWidth}px`,
          ...rest.sx,
        }}
      />
    </Tooltip>
  );
}
