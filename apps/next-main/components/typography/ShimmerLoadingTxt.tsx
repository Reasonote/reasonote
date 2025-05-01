import {
  SxProps,
  Theme,
  Typography,
  useTheme,
} from "@mui/material";

import {TxtProps} from "./Txt";

export interface ShimmerLoadingTxtProps extends Omit<TxtProps, 'sx'> {
  /**
   * Optional override for the shimmer animation duration in seconds
   * @default 2
   */
  animationDuration?: number;
  sx?: SxProps<Theme>;
}

export function ShimmerLoadingTxt({
  children,
  animationDuration = 2,
  sx = {},
  ...props
}: ShimmerLoadingTxtProps) {
  const theme = useTheme();

  return (
    <Typography
      {...props}
      sx={{
        background: `linear-gradient(
            90deg, 
            ${theme.palette.grey[500]} 0%, 
            ${theme.palette.grey[500]} 45%, 
            ${theme.palette.common.white} 50%, 
            ${theme.palette.grey[500]} 55%, 
            ${theme.palette.grey[500]} 100%
        )`,
        backgroundSize: '200% auto',
        animation: 'flow 2s linear infinite',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        '@keyframes flow': {
          '0%': {
            backgroundPosition: '100% center',
          },
          '100%': {
            backgroundPosition: '-100% center',
          },
        },
        ...sx
      }}
    >
      {children}
    </Typography>
  );
} 