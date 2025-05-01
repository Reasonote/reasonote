import {
  useCallback,
  useMemo,
} from "react";

import _ from "lodash";

import {PracticeHeaderDumb} from "@/components/practice/PracticeHeaderDumb";
import {LevelInfo} from "@/utils/xpCalculations";
import {FitnessCenter} from "@mui/icons-material";
import {ActivityTypes} from "@reasonote/core";

import {vFYPIntent} from "../FYPState";
import {
  ActivityWithSkillStack,
  FYPIntent,
} from "../FYPTypes";

export default function FYPHeaderContainer({ currentActivity, settingsDisabled, intent, setIntent, onBack, levelInfo, dailyXp }: {
    currentActivity: ActivityWithSkillStack | null,
    settingsDisabled: boolean,
    intent: FYPIntent | null,
    setIntent: (newIntent: FYPIntent) => void,
    onBack: () => void,
    levelInfo?: LevelInfo,
    dailyXp?: number,
}) {
    const usingSkillIdStack = useMemo(() => {
        if (intent?.type === 'review-pinned') {
            return _.uniq(currentActivity?.skillIdStack ?? intent?.pinned?.skillIdPath ?? [])
        } else {
            return _.uniq(currentActivity?.skillIdStack ?? []);
        }
    }, [currentActivity, intent]);
    const allowedActivities = useMemo(() => {
        return intent?.activitiesAllowed?.type === 'allowAll' ?
            [...ActivityTypes] 
            :
            [...(intent?.activitiesAllowed?.allowedActivityTypes ?? [])];
    }, [intent]);

    const handleBack = useCallback(() => {
        onBack();
    }, [intent]);

    if (!intent){
        return null;
    }

    return (
        <PracticeHeaderDumb
            currentActivityId={currentActivity?.activity?.id}
            handleBack={handleBack}
            settingsDisabled={settingsDisabled}
            usingSkillIdStack={usingSkillIdStack as string[]}
            allowedActivities={allowedActivities}
            setAllowedActivityTypes={(newTypes: string[]) => {
                if (!intent) {
                    console.error('No current intent found');
                    return;
                }

                if (newTypes.length === ActivityTypes.length) {
                        vFYPIntent({
                            ...intent,
                            activitiesAllowed: {
                                type: 'allowAll'
                            }
                        });
                }
                else {
                    setIntent({
                        ...intent,
                        activitiesAllowed: {
                            type: 'allowOnly',
                            allowedActivityTypes: newTypes as any,
                        }
                    });
                }
            }}
            levelInfo={levelInfo}
            dailyXp={dailyXp}
            icon={<FitnessCenter />}
        />
    );
}