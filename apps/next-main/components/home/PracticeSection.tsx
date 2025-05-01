import {useRef} from "react";

import {motion} from "framer-motion";
import {useRouter} from "next/navigation";

import {
  useIsPracticeV2Enabled,
} from "@/clientOnly/hooks/useIsPracticeV2Enabled";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {PracticeCard} from "@/components/home/PracticeCard";
import MissedActivityIcon from "@/components/icons/MissedActivityIcon";
import SavedActivityIcon from "@/components/icons/SavedActivityIcon";
import {Air} from "@mui/icons-material";
import {
  Stack,
  useTheme,
} from "@mui/material";

type PracticeSectionProps = {
    skillId: string | undefined | null;
    courseId?: string | undefined | null;
}

export function PracticeSection({ skillId, courseId }: PracticeSectionProps) {
    const router = useRouter();
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rsnUserId = useRsnUserId();
    const isPracticeV2Enabled = useIsPracticeV2Enabled();

    if (!rsnUserId) {
        return null;
    }

    const routeToUse = courseId ? `/app/courses/${courseId}/view/practice/practice` : `/app/skills/${skillId}/practice/practice`;
    const practiceCards = [
        {
            icon: MissedActivityIcon,
            title: "Missed Activities",
            description: "Practice activities you missed",
            onClick: () => router.push(routeToUse + `?type=missed`),
            backgroundColor: theme.palette.background.paper,
            textColor: theme.palette.error.main,
            border: `2px solid ${theme.palette.error.main}`,
        },
        {
            icon: Air,
            title: "Practice Mode",
            description: "Activities customized to you",
            onClick: () => router.push(isPracticeV2Enabled && skillId ? `/app/skills/${skillId}/practice_v2` : routeToUse + `?type=review-pinned`),
            backgroundColor: theme.palette.background.paper,
            textColor: theme.palette.purple.main,
            border: `2px solid ${theme.palette.purple.main}`,
        },
        {
            icon: SavedActivityIcon,
            title: "Saved Activities",
            description: "Practice activities you saved",
            onClick: () => router.push(routeToUse + `?type=saved`),
            backgroundColor: theme.palette.background.paper,
            textColor: theme.palette.info.main,
            border: `2px solid ${theme.palette.info.main}`,
        },
    ];

    return (
        <Stack spacing={2}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <Stack
                    spacing={2}
                    direction={isSmallDevice ? 'column' : 'row'}
                    alignItems={"space-between"}
                    justifyContent={"space-between"}
                    sx={{
                        width: '100%',
                        ...(isSmallDevice && {
                            maxWidth: '250px',
                            mx: 'auto',
                        })
                    }}
                >
                    {practiceCards.map((card, index) => (
                        <Stack
                            key={index}
                            ref={el => cardRefs.current[index] = el}
                            sx={{
                                display: 'flex',
                                width: '100%',
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.2 + (index * 0.1), ease: "easeInOut" }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex'
                                }}
                            >
                                <PracticeCard {...card} />
                            </motion.div>
                        </Stack>
                    ))}
                </Stack>
            </motion.div>
        </Stack>
    );
}