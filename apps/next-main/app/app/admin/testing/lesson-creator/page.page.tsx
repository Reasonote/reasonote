'use client'
import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";
import {z} from "zod";

import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {
  Add,
  AddTask,
  CheckBoxOutlineBlank,
  CheckBoxOutlined,
  Delete,
  KeyboardArrowDown,
  KeyboardArrowUp,
  School,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  notEmpty,
  uuidv4,
} from "@reasonote/lib-utils";

import {
  genBloomLessons,
  GenBloomLessonsResult,
} from "./genBloomLessons";
import {
  genBloomTaxonomy,
  LearningObjective,
  TimeSchema,
} from "./genBloomTaxonomy";
import {genSubjectBreakdown} from "./genSubjectBreakdown";
import {genLearningObjChildren} from "./genSubLearningObjectives";
import {LessonDisplay} from "./LessonDisplay";

const MultipleChoiceType = z.object({
    type: z.literal("multiple-choice").optional().default("multiple-choice"),
    prompt: z.string(),
    choices: z.array(z.string()),
    answer: z.string(),
});

const ShortAnswerType = z.object({
    type: z.literal("short-answer").optional().default("short-answer"),
    prompt: z.string(),
})

const BloomActivityType = z.union([
    MultipleChoiceType,
    ShortAnswerType,
]);


/**
 * 
 * Sketch:
 * 
 * 1. Generate List of sub-subjects.
 * 2. For the first subject listed, do the following:
 *    1. Determine if this subject is specific enough to be a leaf node LEAF.
 *    2. If TRUE, break
 *    3. Else, generate a list of sub-subjects for this subject, recurse
 * 3. Generate Learning Objectives using Bloom's Taxonomy for LEAF.
 * 4. Walking through bloom's taxonomy in order, grab the first learning objective.
 * 5. Generate a list of complementary activities for this learning objective.
 * 
 */

type LearningObjectiveWithStatus = LearningObjective & {
    id: string; 
    complete: boolean; 
    subObjectives?: LearningObjectiveWithStatus[];
};

interface BloomTaxonomyLearningObjectives {
    remembering: LearningObjectiveWithStatus[];
    understanding: LearningObjectiveWithStatus[];
    applying: LearningObjectiveWithStatus[];
    analyzing: LearningObjectiveWithStatus[];
    evaluating: LearningObjectiveWithStatus[];
    creating: LearningObjectiveWithStatus[];
}

interface Subject {
    id: string;
    name: string;
    children: Subject[];
    timeToLearn?: z.infer<typeof TimeSchema>;
    taxonomy?: BloomTaxonomyLearningObjectives;
}

function LearningObjectiveNode({
    subject,
    objective,
    updateObjective, 
    indentation,
    parentObjectives,
    isNextObjective,
}: {
    subject: string,
    objective: LearningObjectiveWithStatus, 
    updateObjective: (objective: LearningObjectiveWithStatus) => void, 
    indentation: number
    parentObjectives: LearningObjectiveWithStatus[],
    isNextObjective?: boolean,
}){
    const generateSubObjectives = useCallback(async () => {
        const res = await genLearningObjChildren({
            learningObjective: objective,
            reasons: 'I want to learn this',
            siblings: [],
            subject
        });

        updateObjective({
            ...objective,
            subObjectives: res.data?.childLearningObjectives.map((obj) => ({
                ...obj,
                id: uuidv4(),
                complete: false,
            })) || [],
        });
    }, [objective]);

    const firstNonCompleteSubObjective = objective.subObjectives?.find((subObjective) => !subObjective.complete);
    const themeColor = objective.complete ? 'gray' : (isNextObjective ? 'default' : 'gray');
    const color = objective.complete ? 'grey' : (isNextObjective ? 'white' : 'grey');

    return <Stack>
            <Stack direction={'row'} gap={1} alignItems={'start'}>
                {/* Placeholder */}
                <div style={{width: `${indentation * 2}em`, minWidth: `${indentation * 2}em`}}/>

                {/* Checkbox */}
                <IconButton
                    onClick={() => updateObjective({
                        ...objective,
                        complete: !objective.complete,
                    })}
                    color={themeColor}
                >
                    {objective.complete ? <CheckBoxOutlined/> : <CheckBoxOutlineBlank/>}
                </IconButton>
                {/* Name */}
                <Typography sx={{
                        textDecoration: objective.complete ? 'line-through' : undefined, 
                        paddingTop: '7px',
                        color: color,
                    }}
                    fontWeight={isNextObjective ? 'bold' : undefined}
                >
                    {objective.timeToStudy ? `(${[
                        objective.timeToStudy.hours ? `${objective.timeToStudy.hours} h` : null,
                        objective.timeToStudy.minutes ? `${objective.timeToStudy.minutes} m` : null,
                    ].filter(notEmpty).join(',')}) ` : ''}
                    
                    {objective.name}
                </Typography>
                {/* Generate Sub-Objectives */}
                <IconButton 
                    onClick={generateSubObjectives}
                >
                    <Add/>
                </IconButton>
            </Stack>
            {objective.subObjectives?.map((subObjective) => 
                <LearningObjectiveNode 
                    subject={subject}
                    indentation={indentation + 1}
                    objective={subObjective} 
                    updateObjective={(newSubObjective) => {
                        updateObjective({
                            ...objective,
                            subObjectives: objective.subObjectives?.map((subObjective) => subObjective.id === newSubObjective.id ? newSubObjective : subObjective)
                        });
                    }}
                    parentObjectives={[...parentObjectives, objective]}
                    isNextObjective={firstNonCompleteSubObjective === subObjective}
                />
            )}
    </Stack>
}




function SubjectNode({
    removeSelf,
    subject, indentation, updateSubject, parentNames, reasons, rootSubject}: {
        removeSelf?: () => void,
        reasons: string, parentNames: string[], subject: Subject, indentation: number, updateSubject: (subject: Subject) => void, rootSubject: Subject
    }
){
    const contextualizedName = [...parentNames, subject.name].join(' > ');
    
    const [expanded, setExpanded] = useState<boolean>(false);

    const [lessons, setLessons] = useState<GenBloomLessonsResult['lessons'] | null>(null);

    const generateSubjectBreakdown = useCallback(async () => {
        const res = await genSubjectBreakdown({
            skill: {
                name: contextualizedName,
                children: subject.children
            },
            treeRoot: rootSubject,
            reasons,
        });

        updateSubject({
            ...subject,
            children: [
                ...subject.children,
                ...(res.data?.subjects.map((childSubjectName) => ({
                    id: uuidv4(),
                    name: childSubjectName.name,
                    timeToLearn: ('timeToLearn' in childSubjectName ? childSubjectName.timeToLearn : undefined),
                    children: [],
                })) || [])
            ]
        });
    }, [subject]);

    const generateBloomLessons = useCallback(async () => {
        const res = await genBloomLessons({subject: contextualizedName, reasons});

        const newLessons = res.data?.lessons;

        if (!newLessons) return;
        

        setLessons((les) => {
            if (!les) return newLessons;
            return [...les, ...newLessons];
        });
    }, [subject]);

    const generateTaxonomyLearningObjectives = useCallback(async () => {
        const res = await genBloomTaxonomy({subject: contextualizedName, reasons});

        updateSubject({
            ...subject,
            taxonomy: {
                remembering: res.data?.stages.remembering.map((obj) => ({
                    ...obj,
                    id: uuidv4(),
                    complete: false,
                })) || [],
                understanding: res.data?.stages.understanding.map((obj) => ({
                    ...obj,
                    id: uuidv4(),
                    complete: false,
                })) || [],
                applying: res.data?.stages.applying.map((obj) => ({
                    ...obj,
                    id: uuidv4(),
                    complete: false,
                })) || [],
                analyzing: res.data?.stages.analyzing.map((obj) => ({
                    ...obj,
                    id: uuidv4(),
                    complete: false,
                })) || [],
                evaluating: res.data?.stages.evaluating.map((obj) => ({
                    ...obj,
                    id: uuidv4(),
                    complete: false,
                })) || [],
                creating: res.data?.stages.creating.map((obj) => ({
                    ...obj,
                    id: uuidv4(),
                    complete: false,
                })) || [],
            }
        });
    }, [subject]);

    const firstNonCompleteSubObjective = [
        ...subject.taxonomy?.remembering || [],
        ...subject.taxonomy?.understanding || [],
        ...subject.taxonomy?.applying || [],
        ...subject.taxonomy?.analyzing || [],
        ...subject.taxonomy?.evaluating || [],
        ...subject.taxonomy?.creating || [],
    ].find((subObjective) => !subObjective.complete);


    const subjectCanBeLearnedIn15MinOrLess = subject.timeToLearn?.hours === 0 && subject.timeToLearn?.minutes && subject.timeToLearn.minutes <= 15;

    return <>
        {/* This node */}
        <Card elevation={10} sx={{marginLeft: `${indentation * 2}em`, padding: '5px'}}>
            <Stack>
                <Stack direction={'row'} alignItems={'center'}>
                    {/* Placeholder */}
                    
                    {/* Name */}
                    <div>
                        {subject.name}
                    </div>
                    <IconButton
                        onClick={removeSelf}
                    >
                        <Delete/>
                    </IconButton>
                    <IconButton
                        onClick={generateSubjectBreakdown}
                    >
                        <Add />
                    </IconButton>
                    <IconButton
                        onClick={generateTaxonomyLearningObjectives}
                    >
                        <AddTask/>
                    </IconButton>
                    <IconButton
                        onClick={generateBloomLessons}
                    >
                        <School color={subjectCanBeLearnedIn15MinOrLess ? 'success' : 'action'}/>
                    </IconButton>
                </Stack>
                {subject.taxonomy ? <Accordion expanded={expanded} onChange={(ev, expanded) => setExpanded(expanded)}>
                    <AccordionSummary>
                        <Stack>
                            
                            {subject.taxonomy ? 
                                expanded ? 
                                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                                        <KeyboardArrowUp/>
                                        <Typography>
                                            Hide Learning Objectives
                                        </Typography>
                                    </Stack>
                                    :
                                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                                        <KeyboardArrowDown/>
                                        <Typography>
                                            <i>Show Learning Objectives</i>
                                        </Typography>
                                    </Stack>
                                :
                                null
                            }
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        {/* Taxonomy Children, if any */}
                        {subject.taxonomy && <Stack direction={'row'}>
                            {/* Placeholder */}
                            {/* <div style={{width: `${(indentation + 1) * 2}em`}}/>
                            <div style={{width: '5px', background: 'white'}}/> */}
                            {/* Taxonomy */}
                            <Stack>
                                {
                                    Object.entries(subject.taxonomy).map(([stage, objectives], idx) => 
                                        <Stack>
                                            <Typography sx={{fontStyle: 'italic'}}>
                                                {idx + 1}. {_.upperFirst(stage)}
                                            </Typography>
                                            <Stack gap={.5}>
                                                {objectives.map((objective: LearningObjectiveWithStatus) => <LearningObjectiveNode 
                                                    subject={contextualizedName}
                                                    indentation={0}
                                                    objective={objective}
                                                    updateObjective={(newObjective) => {
                                                        console.log('newObjective', newObjective);
                                                        updateSubject({
                                                            ...subject,
                                                            taxonomy: subject.taxonomy ? {
                                                                ...subject.taxonomy,
                                                                [stage]: objectives.map((objective: any) => objective.id === newObjective.id ? newObjective : objective)
                                                            } : undefined
                                                        });
                                                    }}
                                                    isNextObjective={firstNonCompleteSubObjective === objective}
                                                    parentObjectives={[]}
                                                />)}
                                            </Stack>
                                        </Stack>
                                    )
                                }
                            </Stack>
                        </Stack>}
                    </AccordionDetails>
                </Accordion>
                : null}
                {
                    lessons ? 
                    <Stack>
                        <Typography>
                            Lessons
                        </Typography>
                        {
                            lessons.map((lesson) => <LessonDisplay lesson={lesson}/>)
                        } 
                    </Stack>
                    : null
                }
            </Stack>
        </Card>
        {/* Children */}
        {subject.children.map((child) => <SubjectNode 
            removeSelf={() => {
                updateSubject({
                    ...subject,
                    children: subject.children.filter((sub) => sub.id !== child.id)
                });
            }}
            reasons={reasons}
            parentNames={[...parentNames, subject.name]}
            subject={{
                ...child,
            }} 
            updateSubject={(newChildSubject) => {
                updateSubject({
                    ...subject,
                    children: subject.children.map((child) => child.id === newChildSubject.id ? newChildSubject : child)
                });
            }}
            indentation={indentation + 1}
            rootSubject={rootSubject}
        />)}
    </>
}


export default function BloomPage(){
    const [subjectName, setSubjectName] = useState<string>('');
    const [subject, setSubject] = useState<Subject | null>();
    const [reasons, setReasons] = useState<string>('');
    const [extraInstructionsGenSubjects, setExtraInstructionsGenSubjects] = useState<string>('');
    const [extraInstructionsGenTaxonomy, setExtraInstructionsGenTaxonomy] = useState<string>('');
    
    const generateInitialSubject = useCallback(() => {
        setSubject({
            id: uuidv4(),
            name: subjectName,
            children: [],
        });
    }, [subjectName]);

    return <CenterPaperStack
        stackProps={{
            sx: {
                minWidth: '66vw',
                maxWidth: '100vw',
            }
        }}
    >
        {/* A text field */}
        <TextField 
            value={subjectName}
            onChange={(ev) => setSubjectName(ev.target.value)}
            label="Subject"
            variant="outlined"
            fullWidth
        />

        <TextField 
            value={reasons}
            onChange={(ev) => setReasons(ev.target.value)}
            label="Reasons For Studying This Subject"
            variant="outlined"
            fullWidth
        />

        <Accordion>
            <AccordionSummary>
                Advanced
            </AccordionSummary>
            <AccordionDetails>
                <TextField 
                    value={extraInstructionsGenSubjects}
                    onChange={(ev) => setExtraInstructionsGenSubjects(ev.target.value)}
                    label="Extra Instructions for Generating Subjects"
                    variant="outlined"
                    fullWidth
                />

                <TextField 
                    value={extraInstructionsGenTaxonomy}
                    onChange={(ev) => setExtraInstructionsGenTaxonomy(ev.target.value)}
                    label="Extra Instructions for Generating Taxonomy"
                    variant="outlined"
                    fullWidth
                />
            </AccordionDetails>
        </Accordion>

        <Button 
            onClick={generateInitialSubject}
            variant={'contained'}
        >
            Start
        </Button>


        <Stack gap={1}>        
        {subject ? 
            <SubjectNode 
                reasons={reasons}
                parentNames={[]}
                subject={subject}
                indentation={0} 
                updateSubject={(subject: Subject): void  => {
                    setSubject(subject);
                }}
                removeSelf={() => {}}
                rootSubject={subject}
            /> 
            : 
            null
        }
        </Stack>

        {/* <Accordion>
            <AccordionSummary>
                Subject Breakdown
            </AccordionSummary>
            <AccordionDetails>
                
            </AccordionDetails>
        </Accordion>

        <Button
            onClick={generateTaxonomyLearningObjectives}
            variant={'contained'}
        >
            Generate Taxonomy Learning Objectives
        </Button>
        <Accordion>
            <AccordionSummary>
                Taxonomy Learning Objectives
            </AccordionSummary>
            <AccordionDetails>
                <pre>
                    {JSON.stringify(taxonomyLearningObjectives, null, 2)}
                </pre>
            </AccordionDetails>
        </Accordion> */}

        {/* <Button
            onClick={generateTaxonomyWithActivities}
            variant={'contained'}
        >
            Generate Taxonomy With Activities
        </Button>
        <Divider/>
        <Accordion>
            <AccordionSummary>
                Taxonomy With Activities
            </AccordionSummary>
            <AccordionDetails>
                <pre>
                    {JSON.stringify(taxonomyWithActivities, null, 2)}
                </pre>
            </AccordionDetails>
        </Accordion> */}
    </CenterPaperStack>
}