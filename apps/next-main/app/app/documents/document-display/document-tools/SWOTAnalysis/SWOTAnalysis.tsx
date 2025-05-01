import React, {
  useCallback,
  useState,
} from "react";

import {BaseCallout} from "@/components/cards/BaseCallout";
import {
  LinearProgressWithLabel,
} from "@/components/progress/LinearProgressWithLabel";
import {Txt} from "@/components/typography/Txt";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Person,
  QuestionMark,
  Settings,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {useRsnPageFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {EditablePersona} from "./EditablePersona";
import {
  runSWOTAnalysis,
} from "./runSWOTAnalysis"; // Assuming runSWOTAnalysis is moved to an appropriate utility location
import {SwotGroupComponent} from "./SwotGroupComponent";
import {defaultPersonas} from "./utils/defaultPersonas";

export function SWOTAnalysis({ selectedDocId }) {
    const theme = useTheme();
    const docResult = useRsnPageFlatFragLoader(selectedDocId);

    const [isRunning, setIsRunning] = useState(false);
    const [swotAnalysisResult, setSwotAnalysisResult] = useState<Awaited<ReturnType<typeof runSWOTAnalysis>> | null>(null);
    const [personaOptions, setPersonaOptions] = useState(defaultPersonas);
    const [selectedPersonas, setSelectedPersonas] = useState(defaultPersonas.map((persona) => persona.id));
    const [isEditingPersona, setIsEditingPersona] = useState<string|null>(null);

    const reRunSwotAnalysis = useCallback(async () => {
        setIsRunning(true);
        setSwotAnalysisResult(null);
        try {
            const result = await runSWOTAnalysis({
                pageContent: docResult.data?.body ?? '',
                pageTitle: docResult.data?.name ?? '',
                pageDescription: docResult.data?.description ?? '',
                personas: selectedPersonas.map((personaId) => personaOptions.find((persona) => persona.id === personaId)).filter(notEmpty)
            });
            setSwotAnalysisResult(result);
        } catch (e) {
            console.error(e);
        }
        setIsRunning(false);
    }, [docResult.data, selectedPersonas, personaOptions]);

    return (
        <Stack alignItems={'center'} gap={2}>
            {!swotAnalysisResult && !isRunning && (
                <BaseCallout
                    icon={<QuestionMark />}
                    header={<Typography variant="h6">SWOT Analysis</Typography>}
                    backgroundColor={theme.palette.gray.main}
                    sx={{ paper: { padding: '10px' } }}
                >
                    A SWOT analysis is a strategic planning technique used to help a person or organization identify strengths, weaknesses, opportunities, and threats related to business competition or project planning.
                </BaseCallout>
            )}

            <Accordion elevation={5}>
                <AccordionSummary>
                    <Txt startIcon={<Settings />} variant="h6">Configure</Txt>
                </AccordionSummary>
                <AccordionDetails>
                    <Txt startIcon={<Person />} variant="h5">Personas ({selectedPersonas.length} selected)</Txt>
                    <Stack gap={1}>
                        {personaOptions.map((persona) => (
                            <EditablePersona
                                key={persona.id}
                                persona={persona}
                                onSelect={(selected) => {
                                    setSelectedPersonas((ps) => selected ? [...ps, persona.id] : ps.filter((p) => p !== persona.id));
                                }}
                                isSelected={selectedPersonas.includes(persona.id)}
                                isEditing={isEditingPersona === persona.id}
                                setIsEditing={(isEditing) => setIsEditingPersona(isEditing ? persona.id : null)}
                                onChange={(newPersona) => {
                                    setPersonaOptions((prev) => prev.map((p) => p.id === persona.id ? newPersona : p));
                                }}
                            />
                        ))}
                    </Stack>
                </AccordionDetails>
            </Accordion>

            {
                isRunning ? 
                    <Stack sx={{height: '80px', width: '100%'}}>
                        <div>
                            <LinearProgressWithLabel label={<Typography>Running SWOT Analysis...</Typography>} labelPos="above" />
                        </div>
                    </Stack>
                    :
                    <Button variant={swotAnalysisResult ? 'outlined' : 'contained'} onClick={() => reRunSwotAnalysis()}>{swotAnalysisResult ? 'Re-' : ''}Run SWOT Analysis</Button>
            }

            {swotAnalysisResult && (
                <Stack gap={2}>
                    {['strength', 'weakness', 'opportunity', 'threat'].map((typeName) => (
                        <SwotGroupComponent key={typeName} typeName={typeName} swotAnalysisResultData={swotAnalysisResult.data} />
                    ))}
                </Stack>
            )}
        </Stack>
    );
}