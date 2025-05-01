'use client';

import {
  useEffect,
  useState,
} from "react";

import {
  ActivityGenerateUniqueRoute,
} from "@/app/api/activity/generate_unique/routeSchema";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  Button,
  Card,
  Input,
  Typography,
} from "@mui/material";
import {MultipleChoiceActivityConfig} from "@reasonote/activity-definitions";

const NUM_QUESTIONS = 2;

export default function DomainTestPage() {
    const { sb } = useSupabase();
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [timing, setTiming] = useState<{
        withDomain: number;
        withoutDomain: number;
    }>({ withDomain: 0, withoutDomain: 0 });
    const [results, setResults] = useState<{
        withDomain: MultipleChoiceActivityConfig[];
        withoutDomain: MultipleChoiceActivityConfig[];
    }>({ withDomain: [], withoutDomain: [] });

    const generateQuestions = async () => {
        setLoading(true);
        try {
            // Generate without domain context
            const withoutDomainStart = performance.now();
            const withoutDomainIds: string[] = [];
            
            for (let i = 0; i < NUM_QUESTIONS; i++) {
                const result = await ActivityGenerateUniqueRoute.call({
                    allowedActivityTypes: ['multiple-choice'],
                    skillName: topic,
                    domainCtxInjectors: false,
                    activityIdsToAvoidSimilarity: withoutDomainIds
                });
                if (result.data?.activities?.[0]?.id) {
                    withoutDomainIds.push(result.data.activities[0].id);
                }
            }
            const withoutDomainTime = performance.now() - withoutDomainStart;

            // Generate with domain context
            const withDomainStart = performance.now();
            const withDomainIds: string[] = [];

            for (let i = 0; i < NUM_QUESTIONS; i++) {
                const result = await ActivityGenerateUniqueRoute.call({
                    allowedActivityTypes: ['multiple-choice'],
                    skillName: topic,
                    domainCtxInjectors: true,
                    activityIdsToAvoidSimilarity: withDomainIds
                });
                if (result.data?.activities?.[0]?.id) {
                    withDomainIds.push(result.data.activities[0].id);
                }
            }
            const withDomainTime = performance.now() - withDomainStart;

            setTiming({
                withDomain: withDomainTime,
                withoutDomain: withoutDomainTime
            });

            const { data: withActivities } = await sb.from('activity').select('*').in('id', withDomainIds);
            const { data: withoutActivities } = await sb.from('activity').select('*').in('id', withoutDomainIds);

            setResults({
                withDomain: withActivities?.map(a => a.type_config) as MultipleChoiceActivityConfig[],
                withoutDomain: withoutActivities?.map(a => a.type_config) as MultipleChoiceActivityConfig[]
            });
        } catch (error) {
            console.error('Error generating questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const QuestionDisplay = ({ question, index, type }: { 
        question: MultipleChoiceActivityConfig, 
        index: number, 
        type: string 
    }) => (
        <Card className="p-4 my-2">
            <Typography variant="body2" color="text.secondary">
                {type} - Question {index + 1}
            </Typography>
            <Typography variant="h6" className="mt-2">
                {question.question}
            </Typography>
            <div className="ml-4 mt-2">
                {question.answerChoices?.map((choice, i) => (
                    <Typography 
                        key={i} 
                        color={choice.isCorrect ? "success" : "inherit"}
                        style={{ fontWeight: choice.isCorrect ? 'bold' : 'normal' }}
                    >
                        {choice.text}
                    </Typography>
                ))}
            </div>
        </Card>
    );

    const TimingDisplay = () => (
        <Card className="p-4 mb-4">
            <Typography variant="h6">Generation Times</Typography>
            <Typography>Without Domain: {(timing.withoutDomain / 1000).toFixed(2)}s</Typography>
            <Typography>With Domain: {(timing.withDomain / 1000).toFixed(2)}s</Typography>
            <Typography>Difference: {((timing.withDomain - timing.withoutDomain) / 1000).toFixed(2)}s</Typography>
        </Card>
    );

    useEffect(() => {
        console.log('results', results);
    }, [results]);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Typography variant="h4" className="mb-4">Domain Context Testing</Typography>
            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="Enter a topic..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    fullWidth
                />
                <Button
                    variant="contained"
                    onClick={generateQuestions}
                    disabled={!topic || loading}
                >
                    {loading ? 'Generating...' : 'Generate Questions'}
                </Button>
            </div>

            {(results.withDomain.length > 0 || results.withoutDomain.length > 0) && (
                <>
                    <TimingDisplay />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Typography variant="h5" className="mb-2">Without Domain Context</Typography>
                            {results.withoutDomain.map((q, i) => (
                                <QuestionDisplay key={i} question={q} index={i} type="Without Domain" />
                            ))}
                        </div>
                        <div>
                            <Typography variant="h5" className="mb-2">With Domain Context</Typography>
                            {results.withDomain.map((q, i) => (
                                <QuestionDisplay key={i} question={q} index={i} type="With Domain" />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
} 