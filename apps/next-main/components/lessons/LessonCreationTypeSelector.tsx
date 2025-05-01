import { Card, CardActionArea, CardContent, Chip, Stack } from "@mui/material";
import { MenuBook, LibraryBooks } from "@mui/icons-material";
import { Txt } from "@/components/typography/Txt";

interface LessonCreationTypeSelectorProps {
    onSelectType: (type: 'lesson' | 'course') => void;
}

export function LessonCreationTypeSelector({ onSelectType }: LessonCreationTypeSelectorProps) {
    return (
        <Stack direction="row" spacing={3} justifyContent="center">
            <Card sx={{ width: 300 }}>
                <CardActionArea onClick={() => onSelectType('lesson')}>
                    <CardContent>
                        <Stack spacing={2} alignItems="center">
                            <MenuBook sx={{ fontSize: 60, color: 'primary.main' }} />
                            <Txt variant="h5">Single Lesson</Txt>
                            <Txt color="text.secondary" align="center">
                                Create a standalone lesson for a specific topic.
                                Perfect for bite-sized learning.
                            </Txt>
                            <Chip label="Basic" color="success" size="small" />
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Card>

            <Card sx={{ width: 300 }}>
                <CardActionArea onClick={() => onSelectType('course')}>
                    <CardContent>
                        <Stack spacing={2} alignItems="center">
                            <LibraryBooks sx={{ fontSize: 60, color: 'primary.main' }} />
                            <Txt variant="h5">Course</Txt>
                            <Txt color="text.secondary" align="center">
                                Create a structured series of lessons.
                                Ideal for comprehensive learning paths.
                            </Txt>
                            <Chip label="Pro" color="primary" size="small" />
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Stack>
    );
} 