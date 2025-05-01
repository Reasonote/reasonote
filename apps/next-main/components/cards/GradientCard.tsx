'use client';

import {
  useEffect,
  useState,
} from "react";

import {ColorInfo} from "@reasonote/core";
import { useTheme } from "@mui/material";

interface Params {
    saturationRange: [number, number];
    lightnessRange: [number, number];
    contrastFactor: number;
    saturationShift: number;
    hueShift: number;
    staticColors?: ColorInfo[];
}

const defaultParams: Params = {
    saturationRange: [76, 90],
    lightnessRange: [48, 55],
    contrastFactor: 25,
    saturationShift: 17,
    hueShift: 27,
    staticColors: [
        {
            primaryColor: {
                hsl: "180,100%,30%",
                rgb: "0,191,255"
            },
            secondaryColor: {
                hsl: "195,100%,50%",
                rgb: "0,191,255"
            }
        },
        {
            primaryColor: {
                hsl: "210,100%,40%",
                rgb: "0,0,255"
            },
            secondaryColor: {
                hsl: "225,100%,60%",
                rgb: "0,0,255"
            }
        },
        {
            primaryColor: {
                hsl: "240,100%,50%",
                rgb: "0,0,255"
            },
            secondaryColor: {
                hsl: "255,100%,70%",
                rgb: "191,191,255"
            }
        },
        {
            primaryColor: {
                hsl: "270,100%,60%",
                rgb: "191,191,255"
            },
            secondaryColor: {
                hsl: "285,100%,80%",
                rgb: "255,191,255"
            }
        },
        {
            primaryColor: {
                hsl: "300,100%,70%",
                rgb: "255,191,255"
            },
            secondaryColor: {
                hsl: "315,100%,90%",
                rgb: "255,0,255"
            }
        }
    ],
};

function stringToColor(str, params) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    const s = params.saturationRange[0] + (hash % (params.saturationRange[1] - params.saturationRange[0]));
    const l = params.lightnessRange[0] + (hash % (params.lightnessRange[1] - params.lightnessRange[0]));
    return [h, s, l];
}

function calculateGradient(params) {
    const staticColors = params.staticColors || [];
    if (staticColors.length > 0) {
        const colorInfo = staticColors[Math.floor(Math.random() * staticColors.length)];
        const primaryColor = colorInfo.primaryColor;
        const secondaryColor = colorInfo.secondaryColor;

        const usingPrimary = primaryColor?.hsl || primaryColor?.rgb;
        const usingSecondary = secondaryColor?.hsl || secondaryColor?.rgb;

        if (usingPrimary && usingSecondary) {
            const parseColorValue = (value: string): number => {
                const numericValue = parseFloat(value.replace('%', ''));
                return isNaN(numericValue) ? 0 : numericValue;
            };

            const primaryHsl: [number, number, number] = primaryColor.hsl?.split(',').map(parseColorValue) || [0, 0, 0];
            const secondaryHsl: [number, number, number] = secondaryColor.hsl?.split(',').map(parseColorValue) || [0, 0, 0];

            const primaryRgb: [number, number, number] = primaryColor.rgb?.split(',').map(Number) || [0, 0, 0];
            const secondaryRgb: [number, number, number] = secondaryColor.rgb?.split(',').map(Number) || [0, 0, 0];

            const angle = Math.floor(Math.random() * 360);

            if (primaryHsl.length === 3 && secondaryHsl.length === 3) {
                const baseColor = `hsl(${primaryHsl[0]}, ${primaryHsl[1]}%, ${primaryHsl[2]}%)`;
                const endColor = `hsl(${secondaryHsl[0]}, ${secondaryHsl[1]}%, ${secondaryHsl[2]}%)`;
                return `linear-gradient(${angle}deg, ${baseColor}, ${endColor})`;
            } else if (primaryRgb.length === 3 && secondaryRgb.length === 3) {
                const baseColor = `rgb(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]})`;
                const endColor = `rgb(${secondaryRgb[0]}, ${secondaryRgb[1]}, ${secondaryRgb[2]})`;
                return `linear-gradient(${angle}deg, ${baseColor}, ${endColor})`;
            }
        } else if (usingPrimary) {
            const parseColorValue = (value: string): number => {
                const numericValue = parseFloat(value.replace('%', ''));
                return isNaN(numericValue) ? 0 : numericValue;
            };

            const primaryHsl: [number, number, number] = primaryColor.hsl?.split(',').map(parseColorValue) || [0, 0, 0];
            const primaryRgb: [number, number, number] = primaryColor.rgb?.split(',').map(Number) || [0, 0, 0];

            const h = primaryHsl.length === 3 ? primaryHsl[0] : Math.floor(Math.random() * 360);
            const s = params.saturationRange[0] + (Math.random() * (params.saturationRange[1] - params.saturationRange[0]));
            const l = params.lightnessRange[0] + (Math.random() * (params.lightnessRange[1] - params.lightnessRange[0]));
            const angle = Math.floor(Math.random() * 360);
            const lighten = Math.random() < 0.5;

            const endL = lighten ? Math.min(l + params.contrastFactor, 100) : Math.max(l - params.contrastFactor, 0);
            const endS = lighten ? Math.max(s - params.saturationShift, 0) : Math.min(s + params.saturationShift, 100);
            const endH = (h + params.hueShift) % 360;

            if (primaryHsl.length === 3) {
                const baseColor = `hsl(${h}, ${primaryHsl[1]}%, ${primaryHsl[2]}%)`;
                const endColor = `hsl(${endH}, ${endS}%, ${endL}%)`;
                return `linear-gradient(${angle}deg, ${baseColor}, ${endColor})`;
            } else if (primaryRgb.length === 3) {
                const baseColor = `rgb(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]})`;
                const endColor = `hsl(${endH}, ${endS}%, ${endL}%)`;
                return `linear-gradient(${angle}deg, ${baseColor}, ${endColor})`;
            }
        }
    }

    const h = Math.floor(Math.random() * 360);
    const s = params.saturationRange[0] + (Math.random() * (params.saturationRange[1] - params.saturationRange[0]));
    const l = params.lightnessRange[0] + (Math.random() * (params.lightnessRange[1] - params.lightnessRange[0]));
    const angle = Math.floor(Math.random() * 360);
    const lighten = Math.random() < 0.5;

    const endL = lighten ? Math.min(l + params.contrastFactor, 100) : Math.max(l - params.contrastFactor, 0);
    const endS = lighten ? Math.max(s - params.saturationShift, 0) : Math.min(s + params.saturationShift, 100);
    const endH = (h + params.hueShift) % 360;

    const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
    const endColor = `hsl(${endH}, ${endS}%, ${endL}%)`;

    return `linear-gradient(${angle}deg, ${baseColor}, ${endColor})`;
}

export const GradientCard = ({ children, onClick, sx, ...rest }:
    {
        children: React.ReactNode,
        params?: Params,
        onClick?: () => void,
        sx?: any,
        colorInfo?: ColorInfo,
    }
) => {
    const theme = useTheme();
    const [gradient, setGradient] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [ripple, setRipple] = useState({ active: false, x: 0, y: 0 });

    const params = rest.params ? rest.params : defaultParams;

    useEffect(() => {
        setGradient(calculateGradient(params));
    }, []);

    console.log('gradient', gradient);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setRipple({ active: true, x, y });
        setTimeout(() => setRipple({ active: false, x: 0, y: 0 }), 600);
        if (onClick) onClick();
    };

    return (
        <div
            className={`relative  ${isHovered ? 'grayscale-0' : 'grayscale-20'} overflow-hidden rounded-lg p-6 shadow-md transition-all duration-300 ease-in-out cursor-pointer`}
            style={{
                background: gradient,
                transform: isHovered ? 'scale(1.05) translateY(-4px)' : 'scale(1) translateY(0)',
                boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.1)',
                ...sx,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {children}
            {ripple.active && (
                <span
                    className="absolute rounded-full opacity-30 animate-ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: theme.palette.text.primary,
                    }}
                />
            )}
        </div>
    );
};