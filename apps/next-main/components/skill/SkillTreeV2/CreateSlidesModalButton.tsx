import {IconButton} from "@mui/material";
import {LessonSkillTreeActivityGenerateSkill} from "@reasonote/core";

interface CreateSlidesModalButtonProps {
    skill: LessonSkillTreeActivityGenerateSkill;
    onSlideCreate: (props: { skill: LessonSkillTreeActivityGenerateSkill }) => void;
    icon: React.ReactNode;
}

export function CreateSlidesModalButton({ skill, onSlideCreate, icon }: CreateSlidesModalButtonProps) {
    return (
        <IconButton 
            data-testid="create-slides-button"
            onClick={() => onSlideCreate({ skill })}>
            {icon}
        </IconButton>
    );
} 