import React from "react";

import {
  CircularProgress,
  CircularProgressProps,
  SxProps,
  Theme,
} from "@mui/material";

interface CircularProgressWrapperProps {
  children: React.ReactNode | React.ReactNode[];
  disabled: boolean;
  sx?: {
    containerSx?: React.CSSProperties;
    progressSx?: SxProps<Theme>;
    containerProps?: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >;
    progressProps?: CircularProgressProps;
  };
}

const CircularProgressWrapper = ({
  children,
  disabled,
  sx,
}: CircularProgressWrapperProps) => {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        ...(sx?.containerSx || {}),
      }}
      {...sx?.containerProps}
    >
      {children}
      <CircularProgress
        size={24}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginTop: -12,
          marginLeft: -12,
          opacity: disabled ? 0 : 1,
        }}
        sx={{
          ...(sx?.progressSx || {}),
        }}
        {...sx?.progressProps}
      />
    </div>
  );
};

export default CircularProgressWrapper;
