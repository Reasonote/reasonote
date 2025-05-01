import React from "react";

import {
  ArrowDownward,
  ArrowUpward,
  HorizontalRule,
} from "@mui/icons-material";
import {
  Chip,
  Stack,
} from "@mui/material";

export const highMedLow = ['high', 'medium', 'low'] as const;

export const HighMedLowChip = ({ value, label, colorOverride, chipOverrides }) => {
    return (
        <Chip
            size="small"
            label={
                <Stack alignItems={'center'} justifyItems={'center'} direction={'row'}>
                    {label}
                    {value === 'high' ? <ArrowUpward fontSize="small" /> : value === 'medium' ? <HorizontalRule fontSize="small" /> : <ArrowDownward fontSize="small" />}
                </Stack>
            }
            color={colorOverride ?? (value === 'high' ? 'error' : value === 'medium' ? 'warning' : 'default')}
            {...chipOverrides}
        />
    );
};