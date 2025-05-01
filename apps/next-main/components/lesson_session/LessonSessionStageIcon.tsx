import {
  Grading,
  Lightbulb,
} from "@mui/icons-material";
import {Badge} from "@mui/material";

import {ActivityIcon} from "../icons/ActivityIcon";

export interface LessonSessionStageIconProps {
    stageName: string;
    status: "not-started" | "in-progress" | "completed";
}

/*
label === 'Concepts' ?
                                        steps.indexOf(label) < steps.indexOf(stage) ?
                                            <Badge badgeContent={'✔'} color="primary" s>
                                                <Lightbulb color={'disabled'}/>
                                            </Badge>
                                        :
                                        <Lightbulb color={steps.indexOf(label) === steps.indexOf(stage) ? 'primary' : 'disabled'}/>
                                    :
                                    label === 'Practice' ?
                                        <ActivityIcon color={steps.indexOf(label) === steps.indexOf(stage) ? 'primary' : 'disabled'}/>
                                        :
                                        <Grading color={steps.indexOf(label) === steps.indexOf(stage) ? 'primary' : 'disabled'}/>
*/

export function LessonSessionStageIcon(props: LessonSessionStageIconProps) {
    const Icon = 
        props.stageName === 'Concepts' ? 
            Lightbulb
        :
        props.stageName === 'Practice' ? 
            ActivityIcon : 
            Grading


    // <Badge badgeContent={'✔'} color="primary" s>
    //     <Lightbulb color={'disabled'}/>
    // </Badge>

    return <Badge badgeContent={props.status === 'completed' ? '✔' : props.status === 'in-progress' ? undefined : undefined} color="primary">
        {
            <Icon 
                color={props.status === 'in-progress' ? 'primary' : 'disabled'}
            />
        }
    </Badge>;
}