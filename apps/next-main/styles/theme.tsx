"use client";
import {forwardRef} from "react";

import {Atkinson_Hyperlegible} from "next/font/google";
import NextLink from "next/link";

import {
  PaletteMode,
  Zoom,
} from "@mui/material";
import {
  purple,
  teal,
} from "@mui/material/colors";
// const getDesignTokens = (mode: PaletteMode) => ({
//     palette: {
//         mode,
//         ...(mode === 'light'
//             ? {
//                 // palette values for light mode
//                 primary: amber,
//                 divider: amber[200],
//                 text: {
//                     primary: grey[900],
//                     secondary: grey[800],
//                 },
//             }
//             : {
//                 // palette values for dark mode
//                 primary: deepOrange,
//                 divider: deepOrange[700],
//                 background: {
//                     default: deepOrange[900],
//                     paper: deepOrange[900],
//                 },
//                 text: {
//                     primary: '#fff',
//                     secondary: grey[500],
//                 },
//             }),
//     },
// });
import {
  createTheme,
  PaletteColor,
} from "@mui/material/styles";

const LinkBehaviour = forwardRef(function LinkBehaviour(props: any, ref: any) {
  return <NextLink ref={ref} {...props} />;
});

export const atkinson_hyperlegible = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext']
});

const { palette } = createTheme();

// First define the interface for durations
interface AllDurations {
  shortest: number;
  shorter: number;
  short: number;
  standard: number;
  complex: number;
  enteringScreen: number;
  leavingScreen: number;
}

// Add the declaration
declare module "@mui/material/styles" {
  interface Theme {
    transitions: {
      duration: AllDurations;
    }
    stripeTheme: 'stripe' | 'night';
  }
}

export const createReasonoteTheme = (mode: PaletteMode) => {
  const { palette } = createTheme();
  
  return createTheme({
    typography: {
      fontFamily: atkinson_hyperlegible.style.fontFamily,
    },
    // @ts-ignore
    stripeTheme: mode === 'light' ? 'stripe' : 'night',
    palette: {
      mode,
      purple: palette.augmentColor({ color: {main: '#8155BA'} }),
      lightBlue: palette.augmentColor({ color: { main: "#596f89" } }),
      gray: palette.augmentColor({ color: { 
        main: mode === 'light' ? "#A0A0A0" : "#505050",
        light: mode === 'light' ? "#C0C0C0" : "#333333", 
        dark: mode === 'light' ? "#C0C0C0" : "#333333" // dark = light
      } }),
      darkGray: palette.augmentColor({ color: {
        main: mode === 'light' ? "#666666" : "#3A3A3A",
        light: mode === 'light' ? "#888888" : "#333333",
        dark: mode === 'light' ? "#444444" : "#202020",
      } }),
      white: {
        light: "#FFFFFF",
        main: "#FFFFFF",
        dark: "#FFFFFF",
        contrastText: "#000000",
      },
      info: palette.augmentColor({ color: {
        main: mode === 'light' ? "#6ea3e0" : "#3282E0",
        light: mode === 'light' ? "#99b8e0" : "#6ea3e0",
        dark: mode === 'light' ? "#3e88de" : "#6ea3e0",
      } }),
      primary: {
        main: teal[600],
      },
      secondary: {
        main: purple["300"],
      },
      success: palette.augmentColor({ color: {
        main: mode === 'light' ? "#81c784" : "#66bb6a",
        light: mode === 'light' ? "#a5d6a7" : "#81c784", 
        dark: mode === 'light' ? "#66bb6a" : "#4CAF50",
      } }),
      error: palette.augmentColor({ color: {
        main: mode === 'light' ? "#e57373" : "#ef5350",
        light: mode === 'light' ? "#ef9a9a" : "#e57373",
        dark: mode === 'light' ? "#ef5350" : "#f44336",
      } }),
      warning: palette.augmentColor({ color: {
        main: mode === 'light' ? "#ffb74d" : "#ffb74d", 
        light: mode === 'light' ? "#ffcc80" : "#ffc107",
        dark: mode === 'light' ? "#ffa726" : "#ff9800",
      } }),
      text: mode === 'light' ? {
        primary: "#000000",
        secondary: "#666666",
      } : {
        primary: "#FFFFFF",
        secondary: "#999999",
      },
      background: mode === 'light' ? {
        default: "#FFFFFF",
        paper: "#F5F5F5",
      } : {
        default: "#121212",
        paper: "#1E1E1E",
      },
      licenseTypeReasonoteAdmin: palette.augmentColor({ color: { main: '#E69900' } }),
      licenseTypeReasonoteQA: palette.augmentColor({ color: { main: '#E69900' } }),
      matchingColorRed: palette.augmentColor({ color: { main: '#E85555' } }),
      matchingColorTeal: palette.augmentColor({ color: { main: '#3FB891' } }),
      matchingColorBlue: palette.augmentColor({ color: { main: '#3AA3BB' } }),
      matchingColorOrange: palette.augmentColor({ color: { main: '#FF8C61' } }),
      matchingColorGreen: palette.augmentColor({ color: { main: '#00BFB0' } }),
      matchingColorYellow: palette.augmentColor({ color: { main: '#E6C84D' } }),
      matchingColorPurple: palette.augmentColor({ color: { main: '#A77BBB' } }),
      matchingColorPink: palette.augmentColor({ color: { main: '#E07F75' } }),
      matchingColorLime: palette.augmentColor({ color: { main: '#6EC993' } }),
      matchingColorLavender: palette.augmentColor({ color: { main: '#C3A5D1' } }),
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
    components: {
      MuiTooltip: {
        defaultProps: {
          enterDelay: 1000,
          TransitionComponent: Zoom,
          TransitionProps: {
            timeout: 100
          }
        }
      },
      // Name of the component
      MuiTextField: {
        styleOverrides: {
          // Name of the slot
          root: {
            // Some CSS
            //   fontSize: '1rem',
            color: mode === 'light' ? "#222222" : "#dddddd",
          },
        },
        defaultProps: {
          autoComplete: 'off',
        }
      },
      MuiLink: {
        defaultProps: {
          //@ts-ignore
          component: LinkBehaviour,
        },
      },
      MuiButtonBase: {
        defaultProps: {
          LinkComponent: LinkBehaviour,
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
          }
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: "40px",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            // padding: '10px'
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          alternativeLabel: {
            marginTop: '1px'
          },
          label: {
            marginTop: '1px'
          },
          labelContainer: {
            marginTop: '1px'
          }
        },
      },
      MuiCssBaseline: {
        styleOverrides: `
          *::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          *::-webkit-scrollbar-track {
            background: transparent;
          }
          *::-webkit-scrollbar-thumb {
            background-color: ${mode === 'light' ? 'rgba(100, 100, 100, 0.5)' : 'rgba(155, 155, 155, 0.5)'};
            border-radius: 3px;
          }
          *::-webkit-scrollbar-thumb:hover {
            background-color: ${mode === 'light' ? 'rgba(100, 100, 100, 0.7)' : 'rgba(155, 155, 155, 0.7)'};
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: ${mode === 'light' ? 'rgba(100, 100, 100, 0.5)' : 'rgba(155, 155, 155, 0.5)'} transparent;
          }
        `,
      },
    },
  });
};

// Remove the existing theme constant and export a default light theme
export const theme = createReasonoteTheme('light');

interface AllPaletteColors {
  purple: PaletteColor;
  lightBlue: PaletteColor;
  gray: PaletteColor;
  darkGray: PaletteColor;
  white: PaletteColor;
  licenseTypeReasonoteAdmin: PaletteColor;
  licenseTypeReasonoteQA: PaletteColor;
  matchingColorRed: PaletteColor;
  matchingColorTeal: PaletteColor;
  matchingColorBlue: PaletteColor;
  matchingColorOrange: PaletteColor;
  matchingColorGreen: PaletteColor;
  matchingColorYellow: PaletteColor;
  matchingColorPurple: PaletteColor;
  matchingColorPink: PaletteColor;
  matchingColorLime: PaletteColor;
  matchingColorLavender: PaletteColor;
}

declare module "@mui/material/styles" {
  interface Palette extends AllPaletteColors {}
  interface PaletteOptions extends AllPaletteColors {}
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides extends Record<keyof AllPaletteColors, true> {}
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides extends Record<keyof AllPaletteColors, true> {}
}

declare module "@mui/material/IconButton" {
  interface IconButtonPropsColorOverrides extends Record<keyof AllPaletteColors, true> {}
}

// SVG Icon
declare module "@mui/material/SvgIcon" {
  interface SvgIconPropsColorOverrides extends Record<keyof AllPaletteColors, true> {}
}
