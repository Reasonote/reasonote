"use client";

import {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

interface Milestone {
    title: string;
    description: string;
    estimatedTime: string;
    resources: string[];
}

interface LearningPathway {
    overview: string;
    milestones: Milestone[];
    nextSteps: string[];
}

export default function LearningPathwayDisplay() {
    const router = useRouter();
    const [pathway, setPathway] = useState<LearningPathway | null>(null);

    useEffect(() => {
        const storedPathway = localStorage.getItem('learningPathway');
        if (storedPathway) {
            setPathway(JSON.parse(storedPathway));
        } else {
            // If no pathway is found, redirect back to survey
            router.push('/learning_pathway/survey');
        }
    }, [router]);

    if (!pathway) {
        return (
            <Stack spacing={2} p={4}>
                <Typography>Loading your learning pathway...</Typography>
            </Stack>
        );
    }

    return (
        <Stack spacing={4} p={4} maxWidth="800px" margin="0 auto">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4">Your Learning Pathway</Typography>
                <Button
                    variant="outlined"
                    onClick={() => router.push('/learning_pathway/survey')}
                >
                    Start Over
                </Button>
            </Stack>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Overview</Typography>
                    <Typography variant="body1">{pathway.overview}</Typography>
                </CardContent>
            </Card>

            <Stack spacing={3}>
                <Typography variant="h5">Milestones</Typography>
                {pathway.milestones.map((milestone, index) => (
                    <Card key={index}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">{milestone.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Estimated Time: {milestone.estimatedTime}
                                    </Typography>
                                </Stack>
                                <Typography variant="body1">{milestone.description}</Typography>
                                {milestone.resources.length > 0 && (
                                    <>
                                        <Divider />
                                        <Stack spacing={1}>
                                            <Typography variant="subtitle1">Resources:</Typography>
                                            {milestone.resources.map((resource, idx) => (
                                                <Typography key={idx} variant="body2">
                                                    • {resource}
                                                </Typography>
                                            ))}
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Next Steps</Typography>
                    <Stack spacing={1}>
                        {pathway.nextSteps.map((step, index) => (
                            <Typography key={index} variant="body1">
                                {index + 1}. {step}
                            </Typography>
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            <Box display="flex" justifyContent="center">
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                        // TODO: Implement save functionality
                        console.log("Save pathway");
                    }}
                >
                    Save Learning Pathway
                </Button>
            </Box>
        </Stack>
    );
} 