"use client"
import {
  useCallback,
  useState,
} from "react";

import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {SimpleHeader} from "@/components/headers/SimpleHeader";
import {TxtField} from "@/components/textFields/TxtField";
import {trimAllLines} from "@lukebechtel/lab-ts-utils";
import {Delete} from "@mui/icons-material";
import {
  Button,
  Card,
  IconButton,
  Stack,
} from "@mui/material";
import {
  LearningObjectiveAISchema,
  LessonConfig,
  LessonLearningObjective,
} from "@reasonote/core";
import {
  AI_EXPLAINERS,
  aiExplainerFormat,
} from "@reasonote/core-static-prompts";

export interface LessonEditConfigLearningObjectiveSectionProps {
    setLearningObjectives: (setter: (prev: LessonLearningObjective[]) => LessonLearningObjective[]) => any;
    lessonConfig: LessonConfig;
}

// Can View or edit learning objectives
export function LearningObjective({objective, onStartEdit, onDelete, onSave}: {objective: LessonLearningObjective, isEditing: boolean, onStartEdit: () => any, onSave: (newObjective: LessonLearningObjective) => any, onDelete: () => any}) {
    // const [wipObjective, setWipObjective] = useState<LessonLearningObjective>(objective);

    return <Card>
        <Stack direction={'column'} gap={2}>
            <SimpleHeader
                rightContent={
                    <Stack direction={'row'} gap={1}>
                        <IconButton
                            size="small"
                            onClick={onDelete}
                        >
                            <Delete/>
                        </IconButton>
                    </Stack>
                }
            />

        
            <Stack gap={1.5}>
                <TxtField
                    size="small"
                    label={'Objective'}
                    placeholder="The student should be able to... "
                    value={objective.name}
                    onChange={(e) => {
                        onSave({...objective, name: e.target.value});
                    }}
                    // startIcon={<Label color={"gray" as any}/>}
                    multiline
                    maxRows={5}
                />
                {/* <TxtField
                    size="small"
                    label={'Objective Description'}
                    placeholder=""
                    value={objective.description}
                    onChange={(e) => {
                        onSave({...objective, description: e.target.value});
                    }}
                    startIcon={<Description color="gray"/>}
                /> */}
            </Stack>
        </Stack>
    </Card>
}

export function LessonEditConfigLearningObjectiveSection({setLearningObjectives, lessonConfig}: LessonEditConfigLearningObjectiveSectionProps) {
    const [wipLearningObjective, setWipLearningObjective] = useState<string | null>(null);

    const suggestLearningObjectives = useCallback(async() => {
        const res = await oneShotAIClient({
            systemMessage: trimAllLines(`
            # YOUR ROLE
            You are responsible for generating learning objectives for the given lesson.

            -------------

            # CONTEXT
            ## LESSON
            ${aiExplainerFormat(AI_EXPLAINERS.LESSON({lessonConfig}))}

            

            `),
            functionName: "outputLearningObjectives",
            functionDescription: "Output a list of learning objectives for the given lesson.",
            functionParameters: z.object({
                learningObjectives: z.array(LearningObjectiveAISchema).describe('A list of learning objectives for the given lesson.'),
            })
        })

        const newObjectives = res.data?.learningObjectives || [];

        if (newObjectives.length > 0) {
            setLearningObjectives((prev) => {
                return [...prev, ...newObjectives.map((o) => {
                    return {
                        id: Math.random().toString(),
                        ...o,
                        description: '',
                    };
                })];
            });
        }

    }, [lessonConfig, setLearningObjectives]);

    return (
        <Stack direction={'column'} gap={2}>
            {
                lessonConfig.learningObjectives?.map((objective) => {
                    return <LearningObjective 
                        isEditing={wipLearningObjective === objective.id}
                        objective={objective}
                        onStartEdit={() => {
                            setWipLearningObjective(objective.id);
                        }}
                        onDelete={() => {
                            setLearningObjectives((prev) => {
                                return prev.filter((o) => o.id !== objective.id);
                            });
                        }}
                        onSave={(newObj) => {
                            setLearningObjectives((prev) => {
                                return prev.map((o) => {
                                    if (o.id === objective.id){
                                        return newObj;
                                    }
                                    return o;
                                });
                            });
                            setWipLearningObjective(null);
                        }}
                    />
                })
            }
            <Button
                onClick={() => {
                    setLearningObjectives((prev) => {
                        return [...prev, {
                            id: Math.random().toString(),
                            name: '',
                            description: ''
                        }];
                    });
                }}
            >
                Add Learning Objective
            </Button>
            <Button
                onClick={suggestLearningObjectives}
            >
                Suggest Learning Objectives
            </Button>
        </Stack>
    );
}