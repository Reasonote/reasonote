import {
  useCallback,
  useState,
} from "react";

import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {TxtField} from "@/components/textFields/TxtField";
import {TxtFieldWithAction} from "@/components/textFields/TxtFieldWithAction";
import {AutoAwesome} from "@mui/icons-material";
import {Stack} from "@mui/material";

export interface EditLessonDocumentAccordionDetailsProps {
    name: string;
    onNameChange: (name: string) => any;
    summary: string;
    onSummaryChange: (summary: string) => any;
    supplementaryDocuments?: string[];
    onSupplementaryDocumentsChange?: (supplementaryDocuments: string[]) => any;
}

export function EditLessonDocumentAccordionDetails({name, onNameChange, summary, onSummaryChange}: EditLessonDocumentAccordionDetailsProps){ 
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);   
    const autoGenerateOutline = useCallback(async () => {
        setIsGeneratingSummary(true);
        try {
            const result = await oneShotAIClient({
                systemMessage: `
                You are responsible for generating an outline for the subject: "${name}".
    
                You should include the following in the outline:
                - A list of subjects in a tree structure, with each subject containing a list of learning objectives.
                `,
                functionName: "outputLessonPlan",
                functionDescription: "Submit your lesson plan for the given subject.",
                functionParameters: z.object({
                    lessonPlan: z.string().describe('The lesson plan for the given subject, including a list of subjects in a tree structure, with each subject containing a list of learning objectives.'),
                })
            })
    
            const lessonPlan = result.data?.lessonPlan;
    
            if (lessonPlan) {
                onSummaryChange(lessonPlan);
            }
        }
        finally {
            setIsGeneratingSummary(false);
        }
    }, [name]);

    // const autoGenerateBloomTaxonomy = useCallback(async () => {

    // })
    
    return <Stack direction={'column'} gap={2}>
        <TxtField
            size="small"
            label="Lesson Name"
            value={name}
            onChange={(e) => {
                onNameChange(e.target.value);
            }}
        />
        <TxtFieldWithAction
            label="Lesson Summary"
            placeholder="This lesson will cover..."
            value={summary}
            multiline
            maxRows={10}
            minRows={5}
            onChange={(e) => {
                onSummaryChange(e.target.value);
            }}
            actionIcon={<AutoAwesome/>}
            onAction={() => {
                autoGenerateOutline();
            }}
            actionInProgress={isGeneratingSummary}
            disableTextDuringAction
        />

        {/* <Stack direction={'column'} gap={1}>
            <Typography variant={'caption'}>Supplementary Documents</Typography>
            <Stack direction={'row'} gap={1}>
                {supplementaryDocuments.map((doc) => {
                    return <Chip label={doc} onDelete={() => {
                        onSupplementaryDocumentsChange(supplementaryDocuments.filter((d) => d !== doc));
                    }}/>
                })}
            </Stack>
            <Button
                variant={'contained'}
                color={'primary'}
                onClick={() => {
                    onSupplementaryDocumentsChange([...supplementaryDocuments, '']);
                }}
            >
                Add Document
            </Button>
        </Stack> */}
    </Stack>
}