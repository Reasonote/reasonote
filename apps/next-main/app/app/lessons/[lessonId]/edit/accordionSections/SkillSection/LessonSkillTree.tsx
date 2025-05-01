import {SkillTreeV2} from "@/components/skill/SkillTreeV2/SkillTreeV2";
import {
  ActivityType,
  LessonConfig,
  LessonSkillTreeActivityGenerateSkill,
} from "@reasonote/core";

export interface LessonSkillTreeProps {
    lessonConfig: LessonConfig;
    refreshCount?: number;
    createActivitiesForSkill: (props: {
        skill: LessonSkillTreeActivityGenerateSkill,
        activityType: ActivityType
    }) => any;
    createSlidesForSkill: (props: {
        skill: LessonSkillTreeActivityGenerateSkill,
    }) => any;
}

export function LessonSkillTree({
    lessonConfig, 
    refreshCount, 
    createActivitiesForSkill,
    createSlidesForSkill,
}: LessonSkillTreeProps) {
    return <div>
        <SkillTreeV2
            skillId={lessonConfig.rootSkillId}
            createActivitiesForSkill={createActivitiesForSkill}
            createSlidesForSkill={createSlidesForSkill}
            maxDepth={1}
        />
    </div>
}