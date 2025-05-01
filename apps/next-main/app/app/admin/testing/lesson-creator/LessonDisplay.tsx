import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";

import {CheckBoxOutlineBlank} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {GenBloomLessonsResult} from "./genBloomLessons";
import {
  getLessonSkills,
  GetLessonSkillsResult,
} from "./getLessonSkills";

export function LessonDisplay({lesson}: {lesson: GenBloomLessonsResult['lessons'][0]}){
    const [skillsCovered, setSkillsCovered] = useState<GetLessonSkillsResult | null>(null);

    const getSkillsCoveredInLesson = useCallback(async () => {
        const res = await getLessonSkills({lesson, existingSkills: []});

        if (!res.data) return;

        setSkillsCovered(res.data);
    }, [lesson]);


    return <Accordion>
        <AccordionSummary>
            <Typography variant={'h6'}>
                {lesson.name}
            </Typography>
        </AccordionSummary>
        
        <AccordionDetails>
            <Button
                onClick={getSkillsCoveredInLesson}
                variant={'contained'}
            >
                Get Skills Covered
            </Button>
            {
                skillsCovered?.skills.map((skill) => 
                    <Stack direction={'row'}>
                        <Typography>
                            {skill.name}
                        </Typography>
                        <Typography>
                            {skill.level}
                        </Typography>
                    </Stack>
                )
            }

        {
            Object.entries({...lesson.learningObjectives, type: undefined}).map(([stage, objectives]) => 
                <Stack>
                    <Typography variant="h6">
                        {_.upperFirst(stage)}
                    </Typography>
                    <Stack>
                        {_.isArray(objectives) && objectives?.map((objective) => 
                            <Stack>
                                <Stack direction={'row'}>
                                    <IconButton>
                                        <CheckBoxOutlineBlank/>
                                    </IconButton>
                                    <Typography style={{paddingTop: '8px'}}>
                                        {objective.name}
                                    </Typography>
                                </Stack>
                                <Typography>
                                    {objective.activities.map((activity) => JSON.stringify(activity)).join(',\n')}
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            )
        }
        </AccordionDetails>
    </Accordion>
}