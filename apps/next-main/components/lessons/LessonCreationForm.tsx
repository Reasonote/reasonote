import { TxtField } from "@/components/textFields/TxtField";
import { Button, CircularProgress, Stack } from "@mui/material";
import { AutoAwesome } from "@mui/icons-material";

interface LessonCreationFormProps {
    lessonName: string;
    skillName: string;
    lessonDetails: string;
    onLessonNameChange: (value: string) => void;
    onSkillNameChange: (value: string) => void;
    onLessonDetailsChange: (value: string) => void;
    onRefine: () => void;
    isRefining: boolean;
}

export function LessonCreationForm({
    lessonName,
    skillName,
    lessonDetails,
    onLessonNameChange,
    onSkillNameChange,
    onLessonDetailsChange,
    onRefine,
    isRefining,
}: LessonCreationFormProps) {
    return (
        <Stack spacing={2}>
            <TxtField 
                label={'Lesson Name'}
                value={lessonName}
                onChange={(e) => onLessonNameChange(e.target.value)}
            />
            <TxtField 
                label={'Skill Name (Optional)'}
                value={skillName}
                onChange={(e) => onSkillNameChange(e.target.value)}
                placeholder={lessonName}
                helperText="Leave blank to use lesson name as skill name"
                size="small"
            />
            <TxtField 
                label={'Lesson Details'}
                value={lessonDetails}
                multiline
                maxRows={20}
                minRows={10}
                onChange={(e) => onLessonDetailsChange(e.target.value)}
            />
            <Button
                onClick={onRefine}
                disabled={isRefining || !lessonDetails.trim()}
                startIcon={
                    isRefining ? 
                        <CircularProgress size={20} /> : 
                        <AutoAwesome />
                }
                variant="outlined"
                sx={{ alignSelf: 'flex-end' }}
            >
                Refine with AI
            </Button>
        </Stack>
    );
} 