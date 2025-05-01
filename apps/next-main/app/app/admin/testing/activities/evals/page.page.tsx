'use client';

import {useState} from "react";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {ActivityDumb} from "@/components/activity/ActivityDumb";
import {Txt} from "@/components/typography/Txt";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {Activity} from "@reasonote/lib-sdk-apollo-client";

interface EvaluationResult {
    timestamp: string;
    domains: {
        domain: string;
        averageScore: number;
        subjects: {
            subject: string;
            averageScore: number;
            activities: {
                metrics: {
                    relevance: number;
                    appropriateness: number;
                    engagement: number;
                    effectiveness: number;
                    quality: number;
                };
                activity: Activity;
            }[];
        }[];
    }[];
}

// Helper function to format domain names
function formatDomainName(domain: string): string {
    // Convert camelCase to spaces and capitalize first letter
    return domain
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
}

// Helper function to calculate score difference
function calculateScoreDifference(score1: number, score2: number): number {
    return score2 - score1;
}

// Helper function to get color for score difference
function getScoreDifferenceColor(diff: number): string {
    if (diff > 0) return 'success.main';
    if (diff < 0) return 'error.main';
    return 'text.primary';
}

export default function ActivityEvalsPage() {
    const { userStatus } = useRsnUser();
    const [path1, setPath1] = useState('');
    const [path2, setPath2] = useState('');
    const [result1, setResult1] = useState<EvaluationResult | null>(null);
    const [result2, setResult2] = useState<EvaluationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedDomains1, setExpandedDomains1] = useState<string | false>(false);
    const [expandedDomains2, setExpandedDomains2] = useState<string | false>(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const handleDomainChange = (domain: string, resultNumber: 1 | 2) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        if (resultNumber === 1) {
            setExpandedDomains1(isExpanded ? domain : false);
        } else {
            setExpandedDomains2(isExpanded ? domain : false);
        }
    };

    const handleRowClick = (activity: any) => {
        setSelectedActivity({type: activity.type, typeConfig: activity, nodeId: '123', id: '123', name: '123', createdDate: new Date(), updatedDate: new Date()});
    };

    const handleCloseDialog = () => {
        setSelectedActivity(null);
    };

    const loadResults = async () => {
        setError(null);
        try {
            if (path1) {
                const response1 = await fetch(path1);
                if (!response1.ok) {
                    throw new Error(`Failed to load first result: ${response1.statusText}`, { 
                        cause: `Path: ${path1}, Status: ${response1.status}` 
                    });
                }
                const data1 = await response1.json();
                setResult1(data1);
            }

            if (path2) {
                const response2 = await fetch(path2);
                if (!response2.ok) {
                    throw new Error(`Failed to load second result: ${response2.statusText}`, { 
                        cause: `Path: ${path2}, Status: ${response2.status}` 
                    });
                }
                const data2 = await response2.json();
                setResult2(data2);
            }
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? `${err.message}\n${err.cause ? `Details: ${err.cause}` : ''}`
                : 'Failed to load results';
            setError(errorMessage);
        }
    };

    const renderDomainAccordion = (domain: EvaluationResult['domains'][0], title: string, comparisonDomain?: EvaluationResult['domains'][0], resultNumber: 1 | 2 = 1) => {
        const averageScore = domain.averageScore;
        const scoreColor = averageScore >= 7 ? 'success.main' : averageScore >= 5 ? 'warning.main' : 'error.main';
        const scoreDiff = comparisonDomain ? calculateScoreDifference(comparisonDomain.averageScore, averageScore) : null;
        const expandedDomain = resultNumber === 1 ? expandedDomains1 : expandedDomains2;

        return (
            <Accordion 
                expanded={expandedDomain === domain.domain}
                onChange={handleDomainChange(domain.domain, resultNumber)}
                sx={{ mb: 1 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{formatDomainName(domain.domain)}</Typography>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: scoreColor,
                                fontWeight: 'normal'
                            }}
                        >
                            ({averageScore.toFixed(2)})
                        </Typography>
                        {scoreDiff !== null && (
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: getScoreDifferenceColor(scoreDiff),
                                    fontWeight: 'normal'
                                }}
                            >
                                {scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(2)}
                            </Typography>
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Subject</TableCell>
                                    <TableCell align="right">Average Score</TableCell>
                                    <TableCell align="right">Relevance</TableCell>
                                    <TableCell align="right">Appropriateness</TableCell>
                                    <TableCell align="right">Engagement</TableCell>
                                    <TableCell align="right">Effectiveness</TableCell>
                                    <TableCell align="right">Quality</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {domain.subjects.map((subject) => {
                                    const comparisonSubject = comparisonDomain?.subjects.find(s => s.subject === subject.subject);
                                    const subjectScoreDiff = comparisonSubject ? calculateScoreDifference(comparisonSubject.averageScore, subject.averageScore) : null;
                                    const metrics = subject.activities[0]?.metrics;
                                    const comparisonMetrics = comparisonSubject?.activities[0]?.metrics;
                                    const activity = subject.activities[0]?.activity;
                                    
                                    return (
                                        <TableRow 
                                            key={subject.subject}
                                            onClick={() => activity && handleRowClick(activity)}
                                            sx={{ 
                                                cursor: activity ? 'pointer' : 'default',
                                                '&:hover': activity ? { backgroundColor: 'action.hover' } : {}
                                            }}
                                        >
                                            <TableCell>{subject.subject}</TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                    {subject.averageScore.toFixed(2)}
                                                    {subjectScoreDiff !== null && (
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                color: getScoreDifferenceColor(subjectScoreDiff),
                                                                fontWeight: 'normal'
                                                            }}
                                                        >
                                                            {subjectScoreDiff > 0 ? '+' : ''}{subjectScoreDiff.toFixed(2)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            {metrics && (
                                                <>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                            {metrics.relevance.toFixed(2)}
                                                            {comparisonMetrics && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        color: getScoreDifferenceColor(calculateScoreDifference(comparisonMetrics.relevance, metrics.relevance)),
                                                                        fontWeight: 'normal'
                                                                    }}
                                                                >
                                                                    {calculateScoreDifference(comparisonMetrics.relevance, metrics.relevance) > 0 ? '+' : ''}
                                                                    {calculateScoreDifference(comparisonMetrics.relevance, metrics.relevance).toFixed(2)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                            {metrics.appropriateness.toFixed(2)}
                                                            {comparisonMetrics && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        color: getScoreDifferenceColor(calculateScoreDifference(comparisonMetrics.appropriateness, metrics.appropriateness)),
                                                                        fontWeight: 'normal'
                                                                    }}
                                                                >
                                                                    {calculateScoreDifference(comparisonMetrics.appropriateness, metrics.appropriateness) > 0 ? '+' : ''}
                                                                    {calculateScoreDifference(comparisonMetrics.appropriateness, metrics.appropriateness).toFixed(2)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                            {metrics.engagement.toFixed(2)}
                                                            {comparisonMetrics && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        color: getScoreDifferenceColor(calculateScoreDifference(comparisonMetrics.engagement, metrics.engagement)),
                                                                        fontWeight: 'normal'
                                                                    }}
                                                                >
                                                                    {calculateScoreDifference(comparisonMetrics.engagement, metrics.engagement) > 0 ? '+' : ''}
                                                                    {calculateScoreDifference(comparisonMetrics.engagement, metrics.engagement).toFixed(2)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                            {metrics.effectiveness.toFixed(2)}
                                                            {comparisonMetrics && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        color: getScoreDifferenceColor(calculateScoreDifference(comparisonMetrics.effectiveness, metrics.effectiveness)),
                                                                        fontWeight: 'normal'
                                                                    }}
                                                                >
                                                                    {calculateScoreDifference(comparisonMetrics.effectiveness, metrics.effectiveness) > 0 ? '+' : ''}
                                                                    {calculateScoreDifference(comparisonMetrics.effectiveness, metrics.effectiveness).toFixed(2)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                            {metrics.quality.toFixed(2)}
                                                            {comparisonMetrics && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        color: getScoreDifferenceColor(calculateScoreDifference(comparisonMetrics.quality, metrics.quality)),
                                                                        fontWeight: 'normal'
                                                                    }}
                                                                >
                                                                    {calculateScoreDifference(comparisonMetrics.quality, metrics.quality) > 0 ? '+' : ''}
                                                                    {calculateScoreDifference(comparisonMetrics.quality, metrics.quality).toFixed(2)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </AccordionDetails>
            </Accordion>
        );
    };

    if (userStatus !== 'logged_in') {
        return (
            <Box sx={{ p: 4 }}>
                <Txt variant="h5" color="error">Access Denied</Txt>
                <Txt>Please log in to view this page.</Txt>
            </Box>
        );
    }

    return (
        <Stack spacing={3} sx={{ p: 4 }}>
            <Txt variant="h4">Activity Evaluation Results</Txt>
            
            <Stack direction="row" spacing={2}>
                <TextField
                    fullWidth
                    label="Path to first evaluation result"
                    value={path1}
                    onChange={(e) => setPath1(e.target.value)}
                    helperText="Example: /evaluation-results/flashcard/evaluation-2024-03-03T12-34-56-789Z.json"
                />
                <TextField
                    fullWidth
                    label="Path to second evaluation result (optional)"
                    value={path2}
                    onChange={(e) => setPath2(e.target.value)}
                    helperText="Example: /evaluation-results/flashcard/evaluation-2024-03-03T12-34-56-789Z.json"
                />
                <Button variant="contained" onClick={loadResults}>
                    Load Results
                </Button>
            </Stack>

            <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                <Txt variant="body2">
                    The path should be relative to the public directory. For example:
                    <br />
                    <code>/evaluation-results/flashcard/evaluation-2024-03-03T12-34-56-789Z.json</code>
                </Txt>
            </Paper>

            {error && (
                <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
                    <Txt color="error" sx={{ whiteSpace: 'pre-line' }}>{error}</Txt>
                </Paper>
            )}

            <Stack spacing={3}>
                {result1 && (
                    <Paper sx={{ p: 2 }}>
                        <Txt variant="h6" sx={{ mb: 2 }}>Result 1</Txt>
                        {result1.domains.map(domain => (
                            <div key={`result1-${domain.domain}`}>
                                {renderDomainAccordion(domain, 'Result 1', undefined, 1)}
                            </div>
                        ))}
                    </Paper>
                )}
                {result2 && (
                    <Paper sx={{ p: 2 }}>
                        <Txt variant="h6" sx={{ mb: 2 }}>Result 2</Txt>
                        {result2.domains.map(domain => {
                            const comparisonDomain = result1?.domains.find(d => d.domain === domain.domain);
                            return (
                                <div key={`result2-${domain.domain}`}>
                                    {renderDomainAccordion(domain, 'Result 2', comparisonDomain, 2)}
                                </div>
                            );
                        })}
                    </Paper>
                )}
            </Stack>

            <Dialog
                open={!!selectedActivity}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Activity Preview</Typography>
                        <IconButton onClick={handleCloseDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedActivity && (
                        <ActivityDumb
                            activity={selectedActivity}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Stack>
    );
}
