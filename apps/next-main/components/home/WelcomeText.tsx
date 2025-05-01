import {memo} from "react";

import {motion} from "framer-motion";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  SkillChipSkillSelector,
} from "@/components/chips/SkillChip/SkillChipSkillSelector";
import {Txt} from "@/components/typography/Txt";
import {Stack} from "@mui/material";

import {SkillChip} from "../chips/SkillChip/SkillChip";

const fadeInUpVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeInOut" }
};

const delayedFadeInUpVariants = {
    ...fadeInUpVariants,
    transition: { ...fadeInUpVariants.transition, delay: 0.1 }
};

interface WelcomeTextProps {
    skillId: string | null | undefined;
    isCourse?: boolean;
}

const WelcomeText = memo(function WelcomeText({ skillId, isCourse = false }: WelcomeTextProps) {
    const rsnUser = useRsnUser();
    const isSmallDevice = useIsSmallDevice();
    const router = useRouter();
    const firstName = rsnUser?.rsnUser?.data?.givenName;

    if (!skillId) {
        return null;
    }

    return (
        <Stack alignItems={'center'}>
            <Txt
                variant={isSmallDevice ? "h5" : "h4"}
                justifyContent={'center'}
                textAlign={'center'}
                stackOverrides={{ 
                    alignContent: 'center', 
                    justifyContent: 'center', 
                    sx: { mt: 10 } 
                }}
                motion={fadeInUpVariants}
            >
                👋 <i>Welcome Back{firstName ? `, ${firstName}` : ''}</i>
            </Txt>
            <motion.div {...delayedFadeInUpVariants}>
                <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <Txt 
                        variant={isSmallDevice ? "body1" : "h6"} 
                        justifyContent={'center'} 
                        textAlign={'center'} 
                        motion={fadeInUpVariants}
                    >
                        Continue learning
                    </Txt>
                    {isCourse ? (
                        <SkillChip
                            disableModal
                            disableLevelIndicator
                            disableAddDelete
                            topicOrId={skillId}
                        />
                    ) : (
                        <SkillChipSkillSelector
                            disableModal
                            disableLevelIndicator
                            disableAddDelete
                            topicOrId={skillId}
                            onSelectSkill={(skillId: string) => {
                                router.push(`/app/skills/${skillId}`);
                            }}
                        />
                    )}
                    <Txt 
                        variant={isSmallDevice ? "body1" : "h6"} 
                        justifyContent={'center'} 
                        textAlign={'center'}
                    >
                        today
                    </Txt>
                </Stack>
            </motion.div>
        </Stack>
    );
});

export {WelcomeText};
