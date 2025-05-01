import React, {
  useEffect,
  useState,
} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

export interface UseCase {
    title: string;
    description: React.ReactNode;
    image?: string | React.ReactNode;
}

interface UseCasesSectionProps {
    useCases: UseCase[];
    onVisibleItemChange?: (index: number) => void;
    activeIndex?: number;
}

function intersectsWindowMedian(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const medianY = windowHeight / 2;
    
    return rect.top <= medianY && rect.bottom >= medianY;
}

function calculateVisibleArea(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.bottom <= 0 || rect.top >= windowHeight) {
        return 0;
    }

    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(windowHeight, rect.bottom);
    const visibleHeight = visibleBottom - visibleTop;

    return (visibleHeight / rect.height) * 100;
}

export default function UseCasesSection({ useCases, onVisibleItemChange, activeIndex: externalActiveIndex }: UseCasesSectionProps) {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();
    const [internalActiveIndex, setInternalActiveIndex] = useState(0);
    
    const activeIndex = externalActiveIndex !== undefined ? externalActiveIndex : internalActiveIndex;

    useEffect(() => {
        if (onVisibleItemChange && activeIndex !== undefined) {
            onVisibleItemChange(activeIndex);
        }
    }, [activeIndex, onVisibleItemChange]);

    useEffect(() => {
        if (externalActiveIndex !== undefined) {
            setInternalActiveIndex(externalActiveIndex);
        }
    }, [externalActiveIndex]);

    useEffect(() => {
        if (isSmallDevice || externalActiveIndex !== undefined) return;

        const handleScroll = () => {
            const screenshots = Array.from(document.querySelectorAll('[data-screenshot]'));
            
            const medianIntersectingIndex = screenshots.findIndex((el) => 
                intersectsWindowMedian(el as HTMLElement)
            );

            if (medianIntersectingIndex !== -1) {
                setInternalActiveIndex(medianIntersectingIndex);
                return;
            }

            const visibilities = screenshots.map((el, idx) => {
                const visibleArea = calculateVisibleArea(el as HTMLElement);
                return { index: idx, visibleArea };
            });

            const visibilityThreshold = 70;
            const highlyVisibleScreenshots = visibilities.filter(
                ({ visibleArea }) => visibleArea >= visibilityThreshold
            );

            if (highlyVisibleScreenshots.length > 0) {
                const currentIsHighlyVisible = highlyVisibleScreenshots.some(
                    ({ index }) => index === activeIndex
                );
                
                if (!currentIsHighlyVisible) {
                    const maxVisibleIndex = visibilities.reduce((maxIdx, curr) => 
                        curr.visibleArea > visibilities[maxIdx].visibleArea ? curr.index : maxIdx
                    , 0);
                    setInternalActiveIndex(maxVisibleIndex);
                }
            }
        };

        const scrollHandler = () => {
            requestAnimationFrame(handleScroll);
        };

        const intervalId = setInterval(handleScroll, 100);
        window.addEventListener('scroll', scrollHandler, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', scrollHandler);
            clearInterval(intervalId);
        };
    }, [isSmallDevice, internalActiveIndex, externalActiveIndex]);

    return (
        <Box maxWidth="80rem" margin="0 auto" padding={isSmallDevice ? 2 : 4} alignSelf="center">
            {isSmallDevice ? (
                <Stack spacing={12}>
                    {useCases.map((useCase, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <Stack key={index} spacing={2}>
                                <Stack spacing={2}>
                                    <Txt
                                        variant={isSmallDevice ? "h6" : "h5"}
                                        fontWeight="bold"
                                    >
                                        {useCase.title}
                                    </Txt>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            lineHeight: 1.8,
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {useCase.description}
                                    </Typography>
                                </Stack>
                                <Box
                                    data-screenshot={`screenshot-${index}`}
                                    sx={{
                                        width: "100%",
                                        aspectRatio: '16/10',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 1,
                                    }}
                                >
                                    {typeof useCase.image === 'string' ? (
                                        <img 
                                            src={useCase.image} 
                                            alt={useCase.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : useCase.image || (
                                        <Typography
                                            color="text.secondary"
                                            sx={{ fontSize: '0.875rem' }}
                                        >
                                            Screenshot coming soon
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>
                        );
                    })}
                </Stack>
            ) : (
                <Stack spacing={12} alignItems="center" width="100%">
                    {useCases.map((useCase, index) => (
                        <Grid 
                            container 
                            key={index} 
                            spacing={4}
                            sx={{
                                opacity: activeIndex === index ? 1 : 0.15,
                                transform: activeIndex === index ? 'scale(1)' : 'scale(0.98)',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                width: '100%',
                                margin: 0,
                                flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' },
                            }}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Grid 
                                item 
                                xs={12}
                                md={4}
                                sx={{
                                    display: 'flex',
                                    justifyContent: { xs: 'center', md: index % 2 === 0 ? 'flex-end' : 'flex-start' },
                                    px: 4,
                                    width: '100%',
                                }}
                            >
                                <Stack 
                                    spacing={3} 
                                    height="100%" 
                                    justifyContent="center"
                                    sx={{
                                        width: '100%',
                                    }}
                                >
                                    <Txt
                                        variant={isSmallDevice ? "h5" : "h4"}
                                        fontWeight="bold"
                                        sx={{ 
                                            textAlign: 'left',
                                        }}
                                    >
                                        {useCase.title}
                                    </Txt>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            lineHeight: 1.8,
                                            textAlign: 'left',
                                        }}
                                    >
                                        {useCase.description}
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid 
                                item 
                                xs={12}
                                md={8}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    px: 4,
                                    width: '100%',
                                }}
                            >
                                <Box
                                    data-screenshot={`screenshot-${index}`}
                                    sx={{
                                        width: "100%",
                                        aspectRatio: '16/10',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                    }}
                                >
                                    {typeof useCase.image === 'string' ? (
                                        <img 
                                            src={useCase.image} 
                                            alt={useCase.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : useCase.image || (
                                        <Typography color="text.secondary">
                                            Screenshot coming soon
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    ))}
                </Stack>
            )}
        </Box>
    );
} 