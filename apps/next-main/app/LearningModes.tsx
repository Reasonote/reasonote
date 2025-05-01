import { Waves } from "lucide-react";


import {
    Headphones,
    School,
} from "@mui/icons-material";
import { Theme } from "@mui/material";

export function getLearningModes(theme: Theme) {
    return [
        {
            icon: <School sx={{ fontSize: 24 }} />,
            title: "Join Classroom",
            description: "Interactive classroom",
            experience: 'classroom' as const,
            loadingText: 'Setting up your interactive classroom...',
            loadingSubText: 'This should only take a few seconds...',
            backgroundColor: theme.palette.primary.main
        },
        {
            icon: <Headphones sx={{ fontSize: 24 }} />,
            title: "Create Podcast",
            description: "Interactive podcast",
            experience: 'podcast' as const,
            loadingText: 'Preparing your AI podcast...',
            loadingSubText: 'This should only take a few seconds...',
            backgroundColor: theme.palette.matchingColorOrange.dark
        },
        {
            icon: <Waves size={24} />,
            title: "Start Practicing",
            description: "Infinite activities",
            experience: 'practice' as const,
            loadingText: 'Initializing Practice Mode...',
            loadingSubText: 'This should only take a few seconds...',
            backgroundColor: theme.palette.info.dark
        },
    ] as const;
}

export type LearningMode = ReturnType<typeof getLearningModes>[number];