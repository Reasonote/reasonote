import React from "react";

import {useTheme} from "@mui/material/styles";

export function ThemeVariablesProvider({ children }: React.PropsWithChildren<{}>) {
  const theme = useTheme();

  const typographyVariants = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'subtitle1', 'subtitle2',
    'body1', 'body2',
    'button', 'caption', 'overline'
  ];

  const variables = typographyVariants.reduce((acc, variant) => {
    acc[`--mui-font-family-${variant}`] = theme.typography[variant].fontFamily;
    acc[`--mui-font-size-${variant}`] = theme.typography[variant].fontSize;
    acc[`--mui-font-weight-${variant}`] = theme.typography[variant].fontWeight;
    acc[`--mui-line-height-${variant}`] = theme.typography[variant].lineHeight;
    acc[`--mui-letter-spacing-${variant}`] = theme.typography[variant].letterSpacing;
    return acc;
  }, {} as Record<string, string | number>);

  return (
    <>
      <style>
        {`:root {
          ${Object.entries(variables)
            .map(([key, value]) => `${key}: ${value};`)
            .join('\n')}
        }`}
      </style>
      {children}
    </>
  );
}