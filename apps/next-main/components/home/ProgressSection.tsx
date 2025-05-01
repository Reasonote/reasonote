import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {TrendingUp} from "lucide-react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Card,
  Stack,
} from "@mui/material";

type ProgressSectionProps = {
    skillId: string | null | undefined;
}

type DailyScore = {
    date: string;
    score: number;
    activities_completed: number;
}

function getTimeIntervals(skillCreatedDate: Date, now: Date): {
    intervalHours: number;
    maxPoints: number;
} {
    const hoursSinceCreation = (now.getTime() - skillCreatedDate.getTime()) / (1000 * 60 * 60);

    // Less than 24 hours - show 3-hour intervals
    if (hoursSinceCreation <= 24) {
        return { intervalHours: 3, maxPoints: 8 };
    }
    // Less than 3 days - show 6-hour intervals
    else if (hoursSinceCreation <= 72) {
        return { intervalHours: 6, maxPoints: 12 };
    }
    // Less than 7 days - show 12-hour intervals
    else if (hoursSinceCreation <= 168) {
        return { intervalHours: 12, maxPoints: 14 };
    }
    // Less than 15 days - show daily intervals
    else if (hoursSinceCreation <= 360) {
        return { intervalHours: 24, maxPoints: 15 };
    }
    // More than 15 days - cap at 15 daily intervals
    else {
        return { intervalHours: 24, maxPoints: 15 };
    }
}

function formatDateByInterval(date: Date, intervalHours: number): string {
    if (intervalHours < 24) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            hour12: true
        });
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

export function ProgressSection({ skillId }: ProgressSectionProps) {
    const { rsnUser } = useRsnUser();
    const { sb } = useSupabase();
    const [scores, setScores] = useState<DailyScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeInterval, setTimeInterval] = useState<{
        intervalHours: number;
        maxPoints: number;
    }>({ intervalHours: 24, maxPoints: 5 });

    useEffect(() => {
        let isMounted = true;

        const fetchScores = async () => {
            if (!rsnUser?.data?.id || !skillId) return;

            const { data: skillData } = await sb.from('skill')
                .select('*')
                .eq('id', skillId)
                .single();

            if (!skillData) {
                console.error('Could not fetch skill data');
                return;
            }

            try {
                setLoading(true);
                const skillCreatedDate = new Date(skillData.created_date);
                const now = new Date();

                // Calculate optimal time interval
                const interval = getTimeIntervals(skillCreatedDate, now);
                setTimeInterval(interval);

                // Calculate start date based on interval
                const startDate = new Date(Math.max(
                    skillCreatedDate.getTime() - interval.intervalHours * 60 * 60 * 1000,
                    now.getTime() - ((interval.maxPoints + 1) * interval.intervalHours * 60 * 60 * 1000)
                ));

                if (!isMounted) return;

                const processedScores: DailyScore[] = [];
                let currentDate = new Date(now);

                // Fetch scores for each interval
                while (currentDate >= startDate) {
                    const { data, error } = await sb.rpc('get_linked_skills_with_scores', {
                        user_id: rsnUser.data.id,
                        end_date: currentDate.toISOString(),
                        input_skill_id: skillId
                    });

                    if (error) {
                        console.error('Error fetching scores:', error);
                        return;
                    }

                    const thisSkill = data.find(d => d.skill_id === skillId);

                    processedScores.push({
                        date: currentDate.toISOString(),
                        score: 100 * (thisSkill?.average_normalized_score_upstream ?? 0),
                        activities_completed: thisSkill?.activity_result_count_upstream ?? 0
                    });

                    // Move back by interval
                    currentDate = new Date(currentDate.getTime() - (interval.intervalHours * 60 * 60 * 1000));
                }

                setScores(processedScores.reverse());
            } catch (error) {
                console.error('Error in fetchScores:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchScores();

        return () => {
            isMounted = false;
        };
    }, [rsnUser?.data?.id, skillId]);

    const chartData = useMemo(() => {
        return scores.map(score => ({
            date: formatDateByInterval(new Date(score.date), timeInterval.intervalHours),
            score: score.score,
            activities_completed: score.activities_completed
        }));
    }, [scores, timeInterval.intervalHours]);

    if (loading) {
        return (
            <Card sx={{ p: 2 }} elevation={4}>
                <Txt>Loading progress...</Txt>
            </Card>
        );
    }

    return (
        <Card sx={{ p: 2, borderRadius: 5 }} elevation={4}>
            <Stack spacing={2}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Txt startIcon={<TrendingUp />} variant="h6">
                        Your Progress
                    </Txt>
                </Stack>

                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 5,
                                bottom: 5,
                            }}
                        >
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                stroke="#666"
                            />
                            <YAxis
                                yAxisId="left"
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                                stroke="#1976d2"
                                label={{
                                    value: 'Score',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fill: '#1976d2' }
                                }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 'auto']}
                                tick={{ fontSize: 12 }}
                                stroke="#2e7d32"
                                label={{
                                    value: 'Activities',
                                    angle: 90,
                                    position: 'insideRight',
                                    style: { fill: '#2e7d32' }
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                }}
                                labelStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'Score') return [`${value.toFixed(1)}%`, 'Score'];
                                    return [value, 'Activities Completed'];
                                }}
                            />
                            <Legend />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="score"
                                name="Score"
                                stroke="#1976d2"
                                strokeWidth={2}
                                dot={{ fill: '#1976d2', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="activities_completed"
                                name="Activities Completed"
                                stroke="#2e7d32"
                                strokeWidth={2}
                                dot={{ fill: '#2e7d32', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Stack>
        </Card>
    );
} 