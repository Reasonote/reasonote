import { Grid, Stack } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

import { SuggestedLearningSection } from "@/components/home/SuggestedLearningSection";
import { GoalsSection } from "@/components/home/GoalsSection";
import { ProgressSection } from "@/components/home/ProgressSection";
import { SkillTreeSection } from "@/components/home/SkillTreeSection";
import { ResourcesSection } from "@/components/home/ResourcesSection";
import { WelcomeText } from "@/components/home/WelcomeText";

export default function SkillHomeTabV2({ skillId }: { skillId?: string | null | undefined }) {

    return (
        <Stack sx={{ width: '100%'}}>
            {/* Top Section */}
            <Stack 
                sx={{ 
                    width: '100%', 
                    pt: 2,
                    pb: 6,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                }}
            >
                <Stack 
                    spacing={2} 
                    sx={{ 
                        width: {
                            xs: '95%', // Below 600px
                            sm: '85%', // 600px and up
                            md: '70%'  // 900px and up
                        },
                        minWidth: {
                            xs: 'auto',
                            sm: 'auto',
                            md: '700px'
                        },
                        position: 'relative',
                        mx: 'auto',
                    }}
                >
                    <WelcomeText skillId={skillId} />
                    <SuggestedLearningSection skillId={skillId}/>
                </Stack>
            </Stack>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Stack 
                        sx={{ 
                            width: '100%',
                            pb: 8,
                            px: { xs: 2, sm: 3, md: 4 },
                        }}
                    >    
                        <Stack 
                            sx={{ 
                                width: '100%',
                                maxWidth: '1200px',
                                mx: 'auto',
                            }}
                        >
                            <Grid container spacing={4}>
                                {/* Left Column */}
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={2}>
                                        <GoalsSection skillId={skillId} />
                                        <ResourcesSection skillId={skillId} />
                                    </Stack>
                                </Grid>

                                {/* Right Column */}
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={3}>
                                        <Stack spacing={2}>
                                            <ProgressSection skillId={skillId} />
                                            <SkillTreeSection skillId={skillId} />
                                        </Stack>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Stack>
                    </Stack>
                </motion.div>
            </AnimatePresence>
        </Stack>
    );
}