"use client";

import {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";
import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Button,
  LinearProgress,
  Stack,
  TextField,
} from "@mui/material";

// Schema for survey responses
const SurveyResponseSchema = z.object({
    goals: z.object({
        short_term: z.string(),
        long_term: z.string(),
        interests: z.string()
    }),
    ideal_lifestyle: z.string(),
    learning_preferences: z.object({
        style: z.string(),
        collaboration: z.enum(["solo", "group", "mixed"])
    }),
    current_skills: z.array(z.object({
        skill: z.string(),
        proficiency_level: z.string()
    })),
    resources: z.object({
        time_commitment_weekly_hours: z.number(),
        available_resources: z.string()
    }),
    preferences: z.object({
        motivation_factors: z.string(),
        accountability_preferences: z.string(),
        feedback_preferences: z.enum(["detailed", "quick", "encouraging", "mixed"])
    })
});

const SKILL_LEVELS = [
    "I can teach this",
    "I understand this well",
    "I have some experience",
    "I've seen this before",
    "I'm completely unfamiliar"
] as const;

type SkillLevel = typeof SKILL_LEVELS[number];

interface SkillAssessment {
    topic: string;
    description: string;
    relevance: string;
}

type SurveyQuestion = {
    id: string;
    question: string;
    helpPrompt?: string;
    type: "number" | "text" | "select";
    options?: readonly string[];
    description?: string;
    relevance?: string;
};

type SurveyStep = {
    id: number;
    title: string;
    description: string;
    questions: SurveyQuestion[];
};

const SURVEY_STEPS: SurveyStep[] = [
    {
        id: 1,
        title: "Goals & Interests",
        description: "Let's start by understanding your learning goals and interests.",
        questions: [
            {
                id: "short_term_goals",
                question: "What are your short-term learning goals? (What would you like to achieve in the next few months?)",
                helpPrompt: "Think about specific skills or knowledge you want to acquire soon. What would make the biggest impact on your life right now?",
                type: "text"
            },
            {
                id: "long_term_goals",
                question: "What are your long-term learning goals? (What would you like to achieve in the next few years?)",
                helpPrompt: "Consider your broader aspirations. What kind of person do you want to become? What would you like to be known for?",
                type: "text"
            },
            {
                id: "interests",
                question: "What are your main interests and passions?",
                helpPrompt: "What topics or activities naturally draw your attention? What do you enjoy learning about in your free time?",
                type: "text"
            }
        ]
    },
    {
        id: 2,
        title: "Ideal Lifestyle",
        description: "Let's envision your ideal lifestyle and how learning fits into it.",
        questions: [
            {
                id: "ideal_lifestyle",
                question: "Describe your ideal lifestyle. How does continuous learning fit into this vision?",
                helpPrompt: "Imagine your perfect day-to-day life. What role does learning and personal growth play in this vision?",
                type: "text"
            }
        ]
    },
    {
        id: 3,
        title: "Learning Style & Preferences",
        description: "Understanding how you learn best helps us create a more effective learning pathway.",
        questions: [
            {
                id: "learning_style",
                question: "How do you prefer to learn new things?",
                type: "select",
                options: [
                    "reading and self-study",
                    "interactive tutorials",
                    "video content",
                    "practical exercises",
                    "group discussions",
                    "one-on-one mentoring"
                ],
                helpPrompt: "Think about the most successful learning experiences you've had. What made them effective?"
            },
            {
                id: "time_commitment",
                question: "How much time can you dedicate to learning each week?",
                type: "select",
                options: [
                    "less than 2 hours",
                    "2-5 hours",
                    "5-10 hours",
                    "10-20 hours",
                    "more than 20 hours"
                ],
                helpPrompt: "Consider your current schedule and responsibilities. Be realistic about the time you can commit."
            }
        ]
    },
    {
        id: 4,
        title: "Current Knowledge Assessment",
        description: "Let's understand your current level in key areas related to your goals.",
        questions: [] // This will be dynamically populated
    },
    {
        id: 5,
        title: "Resources",
        description: "Understanding your available resources helps us create a realistic pathway.",
        questions: [
            {
                id: "time_commitment",
                question: "How many hours per week can you dedicate to learning?",
                helpPrompt: "Be realistic about your schedule. Consider work, family, and other commitments.",
                type: "number"
            },
            {
                id: "available_resources",
                question: "What resources do you have available? (e.g., internet access, books, courses, mentors)",
                helpPrompt: "Think about both physical and digital resources, as well as people who could help you learn.",
                type: "text"
            }
        ]
    },
    {
        id: 6,
        title: "Preferences",
        description: "Let's understand your preferences for staying motivated and getting feedback.",
        questions: [
            {
                id: "motivation",
                question: "What motivates you to learn? What keeps you going when things get challenging?",
                helpPrompt: "Think about past successes. What drove you to achieve them? What helps you overcome obstacles?",
                type: "text"
            },
            {
                id: "accountability",
                question: "How do you prefer to stay accountable in your learning journey?",
                helpPrompt: "Consider what has worked for you in the past. Do you need external accountability or are you self-motivated?",
                type: "text"
            },
            {
                id: "feedback",
                question: "What kind of feedback helps you learn best?",
                helpPrompt: "Think about past feedback experiences. What type of feedback has been most helpful?",
                type: "select",
                options: ["detailed", "quick", "encouraging", "mixed"]
            }
        ]
    }
];

export default function LearningPathwaySurveyPage() {
    const { loading } = useRsnUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [helpText, setHelpText] = useState<string | null>(null);
    const [hasChecked, setHasChecked] = useState(false);
    const [skillAssessment, setSkillAssessment] = useState<SkillAssessment[]>([]);
    const router = useRouter();

    const handleResponseChange = (questionId: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleHelpClick = async (helpPrompt: string) => {
        try {
            const response = await aib.streamGenObject({
                prompt: `Help the user think about this question by breaking it down into smaller, more manageable questions.
                Original question context: "${helpPrompt}"
                
                Provide 3-4 specific, thought-provoking questions that will help them formulate their answer.`,
                schema: z.object({
                    questions: z.array(z.string())
                }),
                temperature: 0.7,
                maxTokens: 500
            });

            setHelpText(response.object.questions.join("\n\n"));
        } catch (error) {
            console.error("Error getting help:", error);
        }
    };

    const handleSectionSubmit = async (stepIndex: number) => {
        const currentStepData = SURVEY_STEPS[stepIndex];
        
        // Skip AI check for multiple choice questions
        if (currentStepData.questions.every(q => q.type === "select")) {
            setHasChecked(true);
            return true;
        }

        const sectionResponses = currentStepData.questions.reduce((acc, q) => ({
            ...acc,
            [q.id]: responses[q.id]
        }), {});

        try {
            const response = await aib.streamGenObject({
                prompt: `You are analyzing a user's responses for a learning pathway survey. The goal is to create a personalized learning journey that helps users achieve their goals effectively.

CURRENT SECTION: ${currentStepData.title}
SECTION DESCRIPTION: ${currentStepData.description}

QUESTIONS AND RESPONSES:
${currentStepData.questions.map(q => `${q.question}\nResponse: ${responses[q.id] || 'Not answered'}`).join('\n\n')}

ANALYZE:
1. Are the responses detailed enough for THIS SPECIFIC SECTION? Only consider what's relevant to this section.
2. If information is missing, what ONE key piece of information would be most helpful to add?
3. Is the response too vague or lacking in substance?

Be concise and specific. Only ask for more information if it's truly necessary for this section.`,
                schema: z.object({
                    isComplete: z.boolean(),
                    feedback: z.string(),
                    suggestedQuestion: z.string().optional(),
                    analysis: z.string()
                }),
                temperature: 0.7,
                maxTokens: 500
            });

            setHelpText(`We'd like to understand this section better before moving on.

${response.object.feedback}

${response.object.suggestedQuestion ? `Consider: ${response.object.suggestedQuestion}` : ''}

${response.object.analysis}`);

            return response.object.isComplete;
        } catch (error) {
            console.error("Error analyzing section:", error);
            return true; // Allow proceeding if there's an error
        }
    };

    const handleCheck = async () => {
        await handleSectionSubmit(currentStep);
        setHasChecked(true);
    };

    const handleNext = () => {
        setCurrentStep(prev => Math.min(SURVEY_STEPS.length - 1, prev + 1));
        setHelpText(null);
        setHasChecked(false);
    };

    const handleSubmit = async () => {
        try {
            const response = await aib.streamGenObject({
                prompt: `Create a personalized learning pathway based on the user's survey responses.

USER'S RESPONSES:
${JSON.stringify(responses, null, 2)}

Create a structured learning pathway that:
1. Aligns with their goals and interests
2. Matches their learning style and preferences
3. Is realistic given their time and resource constraints
4. Includes milestones and checkpoints
5. Provides clear next steps

Format the response as a clear, actionable plan.`,
                schema: z.object({
                    pathway: z.object({
                        overview: z.string(),
                        milestones: z.array(z.object({
                            title: z.string(),
                            description: z.string(),
                            estimatedTime: z.string(),
                            resources: z.array(z.string())
                        })),
                        nextSteps: z.array(z.string())
                    })
                }),
                temperature: 0.7,
                maxTokens: 2000
            });

            // Store the pathway in localStorage and navigate to the display page
            localStorage.setItem('learningPathway', JSON.stringify(response.object.pathway));
            router.push('/app/learning_pathway/pathway');
        } catch (error) {
            console.error("Error generating learning pathway:", error);
        }
    };

    // Generate skill assessment when reaching step 3
    useEffect(() => {
        if (currentStep === 3 && !skillAssessment.length) {
            generateSkillAssessment();
        }
    }, [currentStep, responses]);

    const generateSkillAssessment = async () => {
        try {
            const response = await aib.streamGenObject({
                prompt: `Based on the user's goals and interests, generate 5-8 specific topics or areas they should be assessed on.

USER'S GOALS AND INTERESTS:
${JSON.stringify({
    shortTermGoals: responses.short_term_goals,
    longTermGoals: responses.long_term_goals,
    interests: responses.interests,
    idealLifestyle: responses.ideal_lifestyle
}, null, 2)}

For each topic:
1. Make it specific and measurable
2. Explain why it's relevant to their goals
3. Include a brief description of what knowledge/skills it entails

Focus on topics that are:
- Directly relevant to their stated goals
- Foundational to their learning journey
- Practical and actionable`,
                schema: z.object({
                    topics: z.array(z.object({
                        topic: z.string(),
                        description: z.string(),
                        relevance: z.string()
                    }))
                }),
                temperature: 0.7,
                maxTokens: 1000
            });

            setSkillAssessment(response.object.topics);
            
            // Update the questions for step 3
            SURVEY_STEPS[3].questions = response.object.topics.map((topic, index) => ({
                id: `skill_${index}`,
                question: topic.topic,
                description: topic.description,
                relevance: topic.relevance,
                type: "select" as const,
                options: SKILL_LEVELS,
                helpPrompt: "Select the option that best describes your current level of knowledge or experience with this topic."
            }));
        } catch (error) {
            console.error("Error generating skill assessment:", error);
        }
    };

    if (loading) {
        return (
            <Stack spacing={2} p={2}>
                <Txt>Loading...</Txt>
            </Stack>
        );
    }

    const currentStepData = SURVEY_STEPS[currentStep];
    const progress = ((currentStep + 1) / SURVEY_STEPS.length) * 100;

    return (
        <Stack spacing={4} p={4} maxWidth="800px" margin="0 auto">
            <Stack spacing={2}>
                <Txt variant="h4">Learning Pathway Survey</Txt>
                <Txt variant="body1">
                    Let's create a personalized learning pathway tailored to your goals and preferences.
                </Txt>
                <LinearProgress variant="determinate" value={progress} />
                <Txt variant="subtitle1">
                    Step {currentStep + 1} of {SURVEY_STEPS.length}: {currentStepData.title}
                </Txt>
            </Stack>

            <Stack spacing={3}>
                {currentStepData.questions.map((question) => (
                    <Stack key={question.id} spacing={2}>
                        <Txt variant="h6">{question.question}</Txt>
                        {currentStep === 3 && question.description && (
                            <>
                                <Txt variant="body2" color="text.secondary">
                                    {question.description}
                                </Txt>
                                {question.relevance && (
                                    <Txt variant="body2" color="text.secondary" fontStyle="italic">
                                        Why this matters: {question.relevance}
                                    </Txt>
                                )}
                            </>
                        )}
                        {question.type === "text" && (
                            <TextField
                                multiline
                                rows={4}
                                value={responses[question.id] || ""}
                                onChange={(e) => {
                                    handleResponseChange(question.id, e.target.value);
                                    setHasChecked(false);
                                }}
                                fullWidth
                            />
                        )}
                        {question.type === "number" && (
                            <TextField
                                type="number"
                                value={responses[question.id] || ""}
                                onChange={(e) => {
                                    handleResponseChange(question.id, parseInt(e.target.value));
                                    setHasChecked(false);
                                }}
                                fullWidth
                            />
                        )}
                        {question.type === "select" && (
                            <TextField
                                select
                                value={responses[question.id] || ""}
                                onChange={(e) => {
                                    handleResponseChange(question.id, e.target.value);
                                    setHasChecked(false);
                                }}
                                fullWidth
                                SelectProps={{
                                    native: true
                                }}
                            >
                                <option value="">Select an option</option>
                                {question.options?.map((option) => (
                                    <option key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </option>
                                ))}
                            </TextField>
                        )}
                        {question.helpPrompt && (
                            <Button
                                variant="outlined"
                                onClick={() => handleHelpClick(question.helpPrompt || "")}
                            >
                                Help me think about this
                            </Button>
                        )}
                    </Stack>
                ))}
            </Stack>

            {helpText && (
                <Box p={3} bgcolor="grey.100" borderRadius={1}>
                    <Txt variant="body1">{helpText}</Txt>
                </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="space-between">
                <Button
                    variant="outlined"
                    onClick={() => {
                        setCurrentStep(prev => Math.max(0, prev - 1));
                        setHasChecked(false);
                    }}
                    disabled={currentStep === 0}
                >
                    Previous
                </Button>
                {currentStep < SURVEY_STEPS.length - 1 ? (
                    <>
                        <Button
                            variant="outlined"
                            onClick={handleCheck}
                        >
                            Check Again
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleNext}
                        >
                            Next
                        </Button>
                    </>
                ) : (
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={handleCheck}
                        >
                            Check Responses
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                        >
                            Generate Learning Pathway
                        </Button>
                    </Stack>
                )}
            </Stack>
        </Stack>
    );
} 