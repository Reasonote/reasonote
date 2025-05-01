'use client'
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {TxtField} from "@/components/textFields/TxtField";

import {
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  AutoAwesome,
  Info,
} from "@mui/icons-material";
import {
  Button,
  Stack,
  StackProps,
  Typography,
  useTheme,
} from "@mui/material";
import {
  createLessonFlatMutDoc,
  createSkillFlatMutDoc,
  getSkillFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {BaseCallout} from "../cards/BaseCallout";
import {SkillChip} from "../chips/SkillChip/SkillChip";
import {TxtFieldWithAction} from "../textFields/TxtFieldWithAction";

export interface CreateLessonModalBodyProps {
    onCreate: (args: {lessonId: string, skillId: string}) => void;
    onCancel?: () => void;
    stackProps?: StackProps;
    skillId?: string;
    startLessonName?: string;
    startLessonDetails?: string;
    startLessonSourceText?: string;
}

export function CreateLessonModalBodyDumb({
    onCreate,
    stackProps,
    skillId,
    startLessonName,
    startLessonDetails,
    startLessonSourceText,
}: {
    onCreate: (args: {name: string, details: string, sourceText: string, skillId?: string}) => void,
    stackProps?: StackProps,
    skillId?: string,
    startLessonName?: string,
    startLessonDetails?: string,
    startLessonSourceText?: string,
}){
    const { data: skillData } = useQuery(getSkillFlatQueryDoc, {
        variables: { filter: { id: { eq: skillId } } },
        skip: !skillId
    });

    const skill = skillData?.skillCollection?.edges[0]?.node;

    const [lessonName, setLessonName] = useState<string>(startLessonName || '');
    const [lessonDetails, setLessonDetails] = useState<string>(startLessonDetails || '');
    const [lessonSourceText, setLessonSourceText] = useState<string>(startLessonSourceText || '');
    const [isSuggestingSummary, setIsSuggestingSummary] = useState<boolean>(false);
    const theme = useTheme();

    useEffect(() => {
        if (skill && !startLessonName && !startLessonDetails) {
            setLessonName(skill.name || 'New Lesson');
            setLessonDetails(`Learn about '${skill.name}'`);
        }
    }, [skill, startLessonName, startLessonDetails]);

    const hasBeenChanged = lessonName !== '' && lessonDetails !== '';

    return <Stack {...stackProps}>
        {skill && (
            <SkillChip
                topicOrId={skill.id}
                disableLevelIndicator
                disableAddDelete
            />
        )}
        <BaseCallout icon={<Info/>} header={<Typography variant="caption">Describe your lesson, and we'll generate it just for you.</Typography>} backgroundColor={theme.palette.info.dark} />
        <TxtField 
            label={'Lesson Name'}
            value={lessonName}
            onChange={(e) => {
                setLessonName(e.target.value);
            }}
        />
        <TxtFieldWithAction
            label={'Lesson Summary'}
            value={lessonDetails}
            multiline
            maxRows={5}
            minRows={2}
            onChange={(e) => {
                setLessonDetails(e.target.value);
            }}
            actionIcon={<AutoAwesome/>}
            onAction={async () => {
                // TODO: use ai to suggest a lesson summary, based on the lesson name, and the source text (if provided)
                setIsSuggestingSummary(true);
                try {
                    const res = await oneShotAIClient({
                        systemMessage: `
                        <YOUR_ROLE>
                            You are responsible for generating a lesson summary for the lesson the user will provide.

                            If an existing summary is provided, you are tasked with improving it, and cleaning it up.

                            The summary should be short, max 2 sentences, and should describe the lesson in a way that is easy to understand.

                            The summary should look similar to:

                            "Learn ..."
                            or
                            "Explore ..."
                            or
                            "Understand ..."

                        </YOUR_ROLE>
                        `,
                        functionName: 'output_lesson_summary',
                        functionDescription: 'Output your lesson summary based on the lesson name and source text.',
                        functionParameters: z.object({
                            newLessonSummary: z.string(),
                        }),
                        driverConfig: {
                            type: 'openai',
                            config: {
                                model: 'gpt-4o-mini' 
                            }
                        },
                        otherMessages: [
                            {
                                role: 'user',
                                content: `
                                <LESSON name="${lessonName}">
                                    <CURRENT_SUMMARY>${lessonDetails}</CURRENT_SUMMARY>
                                    <SOURCE_TEXT>${lessonSourceText}</SOURCE_TEXT>
                                </LESSON>
                                `
                            }
                        ]
                    })

                    if (res.data){
                        setLessonDetails(res.data.newLessonSummary);
                    }
                }
                catch(e){
                    console.error(e);
                }
                finally {
                    setIsSuggestingSummary(false);
                }
            }}
            actionInProgress={isSuggestingSummary}
        />
        <TxtField
            label={'Source Text (Optional)'}
            value={lessonSourceText}
            onChange={(e) => {
                setLessonSourceText(e.target.value);
            }}
            maxRows={10}
            minRows={5}
            multiline
        />
        <Button onClick={() => onCreate({
            name: lessonName,
            details: lessonDetails,
            sourceText: lessonSourceText,
            skillId: skillId
        })}
            startIcon={<AutoAwesome/>}
            variant={hasBeenChanged ? 'contained' : 'outlined'}
            disabled={!hasBeenChanged}
        >
            Generate
        </Button>
    </Stack>
}

export default function CreateLessonModalBody({onCreate, stackProps, skillId, startLessonName, startLessonDetails, startLessonSourceText}: CreateLessonModalBodyProps){
    const [createSkill] = useMutation(createSkillFlatMutDoc);
    const [createLesson] = useMutation(createLessonFlatMutDoc);

    const lessonCreate = useCallback(async ({name, details, sourceText, skillId: providedSkillId}: {name: string, details: string, sourceText: string, skillId?: string}) => {
        try {
            let skillId = providedSkillId;
            
            if (!skillId) {
                const skillCreateResult = await createSkill({
                    variables: {
                        objects: [{ name: name }]
                        // No root skill needed because we're creating a root skill.
                    }
                });
                skillId = skillCreateResult.data?.insertIntoSkillCollection?.records?.[0]?.id;
                
                if (!skillId) {
                    console.error('Failed to create skill -- no skill returned');
                    return;
                }
            }

            const lessonCreateResult = await createLesson({
                variables: {
                    objects: [{
                        name: name,
                        summary: details,
                        rootSkill: skillId,
                    }]
                }
            });

            const createdLesson = lessonCreateResult.data?.insertIntoLessonCollection?.records?.[0];

            if (createdLesson) {
                onCreate({lessonId: createdLesson.id, skillId: skillId}); 
            } else {
                console.error('Failed to create lesson -- no lesson returned');
            }
        } catch(e) {
            console.error(e);
        }
    }, [createSkill, createLesson, onCreate]);

    return <CreateLessonModalBodyDumb onCreate={lessonCreate} stackProps={stackProps} skillId={skillId} startLessonName={startLessonName} startLessonDetails={startLessonDetails} startLessonSourceText={startLessonSourceText} />
}