import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {ArrowBackIos} from "@mui/icons-material";
import {
  Breadcrumbs,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  useLessonFlatFragLoader,
  useSkillFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

export interface LessonSessionHeaderProps {
    lessonId: string;
    onPreviousPage: () => void;
}

export function LessonSessionHeader({lessonId, onPreviousPage}: LessonSessionHeaderProps) {
    const isSmallDevice = useIsSmallDevice();
    const theme = useTheme();
    const {data: lesson} = useLessonFlatFragLoader(lessonId);
    const {data: skill} = useSkillFlatFragLoader(lesson?.rootSkill);

    return isSmallDevice ?
        <Stack direction={'row'} alignItems={'center'} gap={1}>
            <IconButton onClick={() => {
                onPreviousPage();
            }}>
                <ArrowBackIos />
            </IconButton>
            <Typography variant="caption" sx={{maxLines: 1, textOverflow: 'ellipsis', maxWidth: '200px'}}>
                {lesson?.icon ?? ''} {lesson?.name}
            </Typography>
        </Stack>
        :
        <Breadcrumbs>
            {lessonId}
            <Link component="button" variant="caption" 
                sx={{
                    textDecoration: 'underline',
                    fontWeight: 'bold',
                    color: 'inherit'
                }}
                onClick={() => {
                    onPreviousPage();
                }}
            >
                <Stack direction="row" alignItems="center">
                    <ArrowBackIos/>
                    {skill?.name}
                </Stack>
            </Link>
            <Typography variant="body1" color={theme.palette.text.primary}>
                {lesson?.icon ?? ''} {lesson?.name}
            </Typography>
        </Breadcrumbs>
}