import { useEffect, useState, useRef } from 'react';
import { Grid, Stack, Typography, Card, Box, Button } from '@mui/material';
import { UserActivityResult } from '@reasonote/lib-sdk-apollo-client';   
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { useSupabase } from '@/components/supabase/SupabaseProvider';
import { useRsnUserId } from '@/clientOnly/hooks/useRsnUser';
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { animate, useMotionValue, useTransform } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useInView } from 'framer-motion';


interface SkillProgressProps {
    activityResults: UserActivityResult[];
}

interface SkillScoreChange {
    skillId: string;
    skillName: string;
    oldScore: number;
    newScore: number;
    change: number;
}

function CountingNumber({ from, to }: { from: number; to: number }) {
    const count = useMotionValue(from);
    const rounded = useTransform(count, latest => Math.round(latest));
    
    useEffect(() => {
        const controls = animate(count, to, {
            duration: 1,
            delay: 0.2,
            ease: "easeOut"
        });
        return controls.stop;
    }, [count, to]);

    return <motion.span>{rounded}</motion.span>;
}

export function SkillProgress({
    activityResults,
}: SkillProgressProps) {
    const [skillChanges, setSkillChanges] = useState<SkillScoreChange[]>([]);
    const [showAll, setShowAll] = useState(false);
    const {sb} = useSupabase();
    const rsnUserId = useRsnUserId();
    const theme = useTheme();
    const activityIds = activityResults.map(result => result.activity?.id ?? '');
    const skillsStudied = activityResults.map((e) => e.activity?.activitySkillCollection?.edges?.map((e) => e.node.skill)).filter(notEmpty).flat();
    const skillIds = [...new Set(skillsStudied?.map(skill => skill?.id ?? ''))];
    const ref = useRef(null);
    const inView = useInView(ref);

    // If no user id, don't render
    if (!rsnUserId) return null;

    // Fetch skill scores
    useEffect(() => {
        const fetchSkillScores = async () => {
            if (!skillsStudied || !rsnUserId || !skillIds) return;

            const oldScores = await sb.rpc('get_user_skill_scores', {
                user_id: rsnUserId,
                skill_ids: skillIds,
                ignore_activity_ids: activityIds,
            });

            const newScores = await sb.rpc('get_user_skill_scores', {
                user_id: rsnUserId,
                skill_ids: skillIds,
            });

            // Create a map of skill IDs to skill names for easy lookup
            const skillNameMap = new Map(
                skillsStudied?.map(skill => [skill?.id, skill?.name]) ?? []
            );

            // Create a map of old scores keyed by skill ID
            const oldScoresMap = new Map(
                oldScores.data?.map(score => [
                    score.skill_id,
                    score.average_normalized_score
                ]) ?? []
            );

            // Create a map of new scores keyed by skill ID 
            const newScoresMap = new Map(
                newScores.data?.map(score => [
                    score.skill_id,
                    score.average_normalized_score
                ]) ?? []
            );

            // Combine the data for each skill ID
            const scores = skillIds?.map(skillId => ({
                skillId: skillId,
                skillName: skillNameMap.get(skillId) ?? '',
                oldScore: 100 * (oldScoresMap.get(skillId) ?? 0),
                newScore: 100 * (newScoresMap.get(skillId) ?? 0),
                change: 100 * ((newScoresMap.get(skillId) ?? 0) - (oldScoresMap.get(skillId) ?? 0))
            }));


            const topChanges = scores
                ?.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            
            setSkillChanges(topChanges);
        };

        fetchSkillScores();
    }, [JSON.stringify(skillIds), JSON.stringify(activityIds), rsnUserId]);

    const successColor = theme.palette.success.main; // Resolves 'success.main' to the actual color
    const warningColor = theme.palette.warning.main; // Resolves 'warning.main' to the actual color
    const errorColor = theme.palette.error.main; // Resolves 'error.main' to the actual color

    const getColorForScore = (score: number) => {
        if (score >= 70) return successColor;
        if (score >= 40) return warningColor;
        return errorColor;
    };

    const getColorForChange = (change: number) => {
        if (change >= 20) return successColor;
        if (change >= -20) return warningColor;
        return errorColor;
    };

    const displayedSkills = showAll ? skillChanges : skillChanges.slice(0, 2);
    const hasMoreSkills = skillChanges.length > 2;

    return (
        <Card 
            sx={{ 
                backgroundColor: theme.palette.background.default,
                p: 2,
                borderRadius: 2,
                width: '100%',
                my: 0.5
            }}
        >
            <Stack spacing={2} alignItems="center" ref={ref}>
                <Typography 
                    variant="h6" 
                    sx={{ mb: 1 }}
                >
                    Skill Progress
                </Typography>
                
                <Box width="100%" maxWidth="800px">
                    <Grid container spacing={2} justifyContent="center">
                        {displayedSkills.map((skill, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                                <Card 
                                    sx={{ 
                                        p: 2,
                                        backgroundColor: theme.palette.background.paper,
                                        position: 'relative',
                                        overflow: 'visible',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Stack spacing={1.5} height="100%">

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography 
                                                variant="subtitle1" 
                                                noWrap 
                                                title={skill.skillName}
                                                sx={{
                                                    minHeight: '24px',
                                                }}
                                            >
                                                {skill.skillName}
                                            </Typography>

                                            <Box>
                                                <Typography variant="subtitle1" color={getColorForScore(skill.newScore)}>
                                                    {inView ? (
                                                        <CountingNumber from={skill.oldScore} to={skill.newScore} />
                                                    ) : (
                                                        Math.round(skill.oldScore)
                                                    )}%
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        {/* Progress Bar */}
                                        <Box
                                            sx={{ 
                                                width: '100%',
                                                height: '8px',
                                                backgroundColor: theme.palette.background.default,
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}
                                        >
                                            <motion.div
                                                initial={{ width: `${skill.oldScore}%`, backgroundColor: getColorForScore(skill.oldScore) }}
                                                animate={inView ? {
                                                    width: `${skill.newScore}%`,
                                                    backgroundColor: getColorForScore(skill.newScore)
                                                } : {
                                                    width: `${skill.oldScore}%`,
                                                    backgroundColor: getColorForScore(skill.oldScore)
                                                }}
                                                transition={{ 
                                                    duration: 1,
                                                    delay: 0.2,
                                                }}
                                                style={{
                                                    height: '100%',
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </Box>

                                        <Stack direction="row" justifyContent="center">

                                            {/* Change Indicator */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                                                    transition={{ delay: 0.5 }}
                                                >
                                                    {skill.change > 20 ? (
                                                        <TrendingUp sx={{ color: getColorForChange(skill.change), fontSize: 16 }} />
                                                    ) : skill.change > -20 ? (
                                                        <TrendingFlat sx={{ color: getColorForChange(skill.change), fontSize: 16 }} />
                                                    ) : (
                                                        <TrendingDown sx={{ color: getColorForChange(skill.change), fontSize: 16 }} />
                                                    )}
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                                                    transition={{ delay: 0.5 }}
                                                >
                                                    <Typography 
                                                        variant="subtitle2"
                                                        color={getColorForChange(skill.change)}
                                                    >
                                                        {skill.change > 0 ? '+' : ''}{Math.round(skill.change)}%
                                                    </Typography>
                                                </motion.div>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Show More/Less Button */}
                {hasMoreSkills && (
                    <Button
                        onClick={() => setShowAll(!showAll)}
                        startIcon={showAll ? <ExpandLess /> : <ExpandMore />}
                        sx={{ 
                            mt: 1,
                            color: 'text.secondary',
                            '&:hover': {
                                color: 'text.primary'
                            }
                        }}
                    >
                        {showAll ? 'Show Less' : `Show ${skillChanges.length - 2} More`}
                    </Button>
                )}
            </Stack>
        </Card>
    );
}