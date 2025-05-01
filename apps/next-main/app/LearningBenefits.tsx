import React from "react";

import {motion} from "framer-motion";
import {
  GraduationCap,
  Headphones,
  Image,
  School,
  Waves,
} from "lucide-react";
import Link from "next/link";
import {useInView} from "react-intersection-observer";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  AccountTree,
  AutoAwesome,
  Bolt,
  Chat,
  Launch,
  Psychology,
  QuestionAnswer,
  TheaterComedy,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

interface BenefitItemProps {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    benefits?: string[];
    href?: string;
    isPrimaryMode?: boolean;
    isFeature?: boolean;
    iconSize?: number;
    chipText?: string;
    chipColor?: string;
}

function BenefitItem({
    icon,
    title,
    description,
    benefits,
    href,
    isPrimaryMode,
    isFeature,
    iconSize,
    chipText,
    chipColor
}: BenefitItemProps) {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice()
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const defaultIconSize = isSmallDevice ? 32 : 48;
    const finalIconSize = iconSize || defaultIconSize;

    const cardContent = (
        <Stack alignItems="center" spacing={2} sx={{ position: 'relative' }}>
            {chipText && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: chipColor || theme.palette.info.main,
                        color: theme.palette.text.primary,
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: theme.shadows[2],
                        zIndex: 1,
                        transform: 'translate(0, 0)',
                        pointerEvents: 'none',
                    }}
                >
                    {chipText}
                </div>
            )}
            {React.createElement(icon, {
                style: {
                    marginTop: '8px',
                    fontSize: finalIconSize,
                    color: theme.palette.primary.main,
                    width: finalIconSize,
                    height: finalIconSize
                }
            })}
            <Typography variant="h6">
                {title}
            </Typography>
            <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                textAlign="center"
            >
                {description}
            </Typography>
            {benefits && benefits.length > 0 && (
                <Stack spacing={1} width="100%" sx={{ mt: 2 }}>
                    {benefits.map((benefit, index) => (
                        <Typography
                            key={index}
                            variant="body2"
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                color: 'text.secondary'
                            }}
                        >
                            <span style={{ color: theme.palette.primary.main }}>•</span>
                            {benefit}
                        </Typography>
                    ))}
                </Stack>
            )}
            {isPrimaryMode && href && (
                <Button
                    variant="outlined"
                    size="small"
                    sx={{
                        mt: 2,
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                    }}
                    endIcon={<Launch />}
                >
                    Learn More
                </Button>
            )}
        </Stack>
    );

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
            style={{ maxWidth: '500px', width: '100%' }}
        >
            {href ? (
                <Link href={href} style={{ textDecoration: 'none', width: '100%', display: 'block' }}>
                    <Card
                        sx={{
                            p: 3,
                            borderRadius: '16px',
                            position: 'relative',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[4],
                                borderColor: theme.palette.primary.main,
                            },
                            background: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            overflow: 'hidden',
                            cursor: 'pointer'
                        }}
                    >
                        {cardContent}
                    </Card>
                </Link>
            ) : (
                <Card
                    sx={{
                        p: 3,
                        borderRadius: '16px',
                        position: 'relative',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[4],
                            borderColor: theme.palette.primary.main,
                        },
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        overflow: 'hidden',
                    }}
                >
                    {cardContent}
                </Card>
            )}
        </motion.div>
    );
}

export const LearningBenefits = () => {
    const theme = useTheme();
    return (
        <>
            <Typography variant="h3" textAlign="center" marginTop={8} sx={{ fontWeight: 'bold' }}>
                Study Faster; Learn More
            </Typography>
            <Typography variant="h4" textAlign="center" sx={{ fontWeight: 'bold' }}>
                Transform How You Learn, Not Just What You Learn
            </Typography>
            <Typography variant="body1" textAlign="center" sx={{ mt: 2, mb: 6, maxWidth: '800px', mx: 'auto' }}>
                Stop wasting time with ineffective study methods. Reasonote adapts to your learning style,
                helping you master any subject in less time with personalized, AI-powered learning experiences.
            </Typography>

            <Typography variant="h5" textAlign="center" sx={{
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
            }}>
                <Bolt /> Solutions That Work For You <Bolt />
            </Typography>
            <Typography variant="body1" textAlign="center" marginBottom={4}>
                Choose the learning approach that fits your needs and schedule. Get results, not just content.
            </Typography>
            <Grid
                container
                spacing={2}
                sx={{
                    maxWidth: '1200px',
                    mx: 'auto',
                    px: 2,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 2,
                    justifyItems: 'center',
                    '& > *': {
                        width: '100%',
                    }
                }}
            >
                <BenefitItem
                    icon={School}
                    title="AI Classroom"
                    description="Struggling with complex topics? Get personalized, on-demand tutoring that adapts to your pace and learning style."
                    benefits={[
                        "Get instant answers to your questions 24/7 - no more waiting for office hours",
                        "Save thousands on tutoring costs with personalized guidance at a fraction of the price",
                        "Receive immediate, actionable feedback that pinpoints exactly where you need to improve",
                        "Track your progress and see measurable improvements in your understanding"
                    ]}
                    href="/examples/classroom"
                    isPrimaryMode
                />
                <BenefitItem
                    icon={Headphones}
                    title="Podcasts 2.0"
                    description="Turn your commute or workout into productive learning time with customized audio content on any topic you need to master."
                    benefits={[
                        "Transform any subject into engaging audio you can listen to while multitasking",
                        "Reclaim 'dead time' in your day for productive learning without distractions",
                        "Instantly switch topics based on what you need to learn right now",
                        "Learn hands-free through interactive voice conversations (coming soon)"
                    ]}
                    href="/examples/podcast"
                    isPrimaryMode
                    chipText="Preview"
                    chipColor={theme.palette.warning.main}
                />
                <BenefitItem
                    icon={Waves}
                    title="Practice Mode"
                    description="Forget cramming that doesn't stick. Our scientifically-proven practice methods ensure you actually remember what you learn."
                    benefits={[
                        "Retain information 3x longer through active recall exercises tailored to your needs",
                        "Study smarter with our spaced repetition algorithm that knows exactly when you need to review",
                        "Ace your next exam or meeting with targeted practice sessions that build confidence",
                        "Explore new topics efficiently with guided practice that builds solid foundations"
                    ]}
                    href="/examples/practice"
                    isPrimaryMode
                    iconSize={48}
                />
            </Grid>

            <Typography variant="h5" textAlign="center" marginTop={4} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
            }}>
                <AutoAwesome /> Create Your Own Courses in Minutes <AutoAwesome />
            </Typography>
            <Typography variant="body1" textAlign="center" marginBottom={4}>
                Stop spending hours preparing lessons. Our AI does the heavy lifting so you can focus on teaching.
            </Typography>
            <Grid
                container
                spacing={2}
                sx={{
                    maxWidth: '1200px',
                    mx: 'auto',
                    px: 2,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 2,
                    justifyItems: 'center',
                    '& > *': {
                        width: '100%',
                    }
                }}
            >
                <BenefitItem
                    icon={GraduationCap}
                    title="AI Powered Course Creator"
                    description="Reduce lesson prep time by 80%. Create engaging, personalized content for your students or employees in just minutes."
                    benefits={[
                        "Turn hours of lesson planning into minutes with AI-generated content tailored to your needs",
                        "Customize materials for different learning levels without creating multiple versions from scratch",
                        "Get insights into student progress to identify who needs extra help and where"
                    ]}
                    href="/examples/teach"
                    isPrimaryMode
                    chipText="Beta"
                />
            </Grid>

            <Typography variant="h5" textAlign="center" marginTop={4} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
            }}>
                <AutoAwesome /> Breakthrough Learning Features <AutoAwesome />
            </Typography>
            <Typography variant="body1" textAlign="center" marginBottom={4}>
                Experience learning tools that solve real problems and deliver measurable results.
            </Typography>
            <Grid
                container
                spacing={2}
                sx={{
                    maxWidth: '1200px',
                    mx: 'auto',
                    px: 2,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 2,
                    justifyItems: 'center',
                    '& > *': {
                        width: '100%',
                    }
                }}
            >
                <BenefitItem
                    icon={Psychology}
                    title="Teach-The-AI"
                    description="Master concepts faster by explaining them. Our AI plays student while you solidify your understanding through teaching."
                    isFeature
                />
                <BenefitItem
                    icon={TheaterComedy}
                    title="AI Roleplay"
                    description="Build real-world skills through practice scenarios. Prepare for interviews, learn languages, or practice difficult conversations with zero risk."
                    isFeature
                    chipText="Beta"
                />
                <BenefitItem
                    icon={Chat}
                    title="Dynamic Dialogue"
                    description="Never get stuck in a rigid learning path again. Every conversation adapts to your questions and interests for truly personalized learning."
                    isFeature
                />
                <BenefitItem
                    icon={QuestionAnswer}
                    title="Smart Assessment"
                    description="Identify and fix knowledge gaps quickly. Our AI analyzes your thought process to target weak areas and strengthen your understanding."
                    isFeature
                />
                <BenefitItem
                    icon={AccountTree}
                    title="Skill Tree"
                    description="See your progress visually and stay motivated. Your personal skill tree shows exactly what you've mastered and what to learn next."
                    isFeature
                />
                <BenefitItem
                    icon={Image}
                    title="Visual Learning"
                    description="Understand complex concepts faster with custom visualizations that make abstract ideas concrete and memorable."
                    isFeature
                    chipText="Coming Soon"
                    chipColor={theme.palette.gray.light}
                />
            </Grid>
        </>
    );
};