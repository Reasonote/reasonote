"use client";
import React from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {BackToToolsButton} from "@/components/navigation/BackToToolsButton";
import {Hero} from "@/components/tools/Hero";
import {
  Box,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import UseCasesSection, {
  UseCase,
} from "../../../../components/tools/UseCasesSection";
import {WaitlistSignup} from "../../../../components/tools/WaitlistSignup";

// Define the use cases data
const useCases: UseCase[] = [
    {
        title: "Prepare for Exams Systematically",
        description: (
            <>
                <HighlightedText color="error.main">Instead of staring at your notes</HighlightedText>, get a personalized study plan tailored to your
                exam content. Upload your course materials, and
                we'll create a <HighlightedText color="success.main">comprehensive preparation guide</HighlightedText> with
                practice questions, concept reviews, and progress tracking. Identify and focus on areas where you need the most improvement.
            </>
        ),
    },
    {
        title: "Break Down Complex Research Papers",
        description: (
            <>
                Stop struggling with <HighlightedText color="error.main">dense academic papers</HighlightedText>.
                Our AI analyzes the content and creates a structured learning path,
                breaking down complex concepts into <HighlightedText color="success.main">digestible lessons</HighlightedText>.
                Each section comes with plain-language explanations and interactive elements to ensure deep understanding.
            </>
        ),
    },
    {
        title: "Master Textbook Content Efficiently",
        description: (
            <>
                Transform <HighlightedText color="error.main">overwhelming textbook chapters</HighlightedText> into
                a clear learning journey.
                Our system creates <HighlightedText color="success.main">bite-sized lessons</HighlightedText> that
                build upon each other, with built-in comprehension checks and practice exercises. Track your progress and identify
                areas that need more focus.
            </>
        ),
    },
    {
        title: "Learn Better from Video Content",
        description: (
            <>
                Turn <HighlightedText color="error.main">video lectures and presentations</HighlightedText> into
                interactive study materials.
                Our AI processes transcripts to create <HighlightedText color="success.main">structured notes,
                    key point summaries, and practice questions</HighlightedText>. Review important concepts at your own pace with our comprehensive learning modules.
            </>
        ),
    }
];

// Helper component for highlighted text
function HighlightedText({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <Box
            component="span"
            sx={{
                color: color,
                fontWeight: 600,
            }}
        >
            {children}
        </Box>
    );
}

export default function DocumentorPage() {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();

    const redirectUrl = `/app/tools/waitlist-confirmation?featureName=DocuMentor`;
    const featureName = "DocuMentor";

    return (
        <Box
            sx={{
                maxWidth: '100rem',
                margin: '0 auto',
                px: isSmallDevice ? 2 : 4,
                position: 'relative'
            }}
        >
            <BackToToolsButton />

            <Stack spacing={10} sx={{ py: isSmallDevice ? 6 : 10 }}>
                <Hero
                    title="A Personalized Study Plan for Every Document"
                    subtitle="Upload your document and get a personalized study plan with micro-lessons and assessments."
                    featureName={featureName}
                    redirectUrl={redirectUrl}
                    leftImageUrl="/images/illustrations/undraw_exams_re_4ios.svg"
                    rightImageUrl="/images/illustrations/undraw_reading_time_re_phf7.svg"
                    flipLeftImage={true}
                    flipRightImage={true}
                />

                {/* Use Cases Section */}
                <UseCasesSection useCases={useCases} />

                <Divider />

                {/* Call to Action */}
                <Stack
                    spacing={3}
                    alignItems="center"
                    textAlign="center"
                    sx={{
                        py: 4,
                        px: isSmallDevice ? 2 : 6,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Join our waitlist now
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: theme.palette.text.secondary,
                            lineHeight: 1.6
                        }}
                    >
                        Be the first to experience DocuMentor when it launches.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <WaitlistSignup featureName={featureName} redirectUrl={redirectUrl} />
                    </Box>
                </Stack>
            </Stack>
        </Box>
    );
}
