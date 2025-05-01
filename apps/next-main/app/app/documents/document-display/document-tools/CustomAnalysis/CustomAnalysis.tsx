import React, {
  useCallback,
  useState,
} from "react";

import _ from "lodash";
import {
  AnalysisResult,
  AnalysisRoute,
  Analyzer,
} from "pages/api/analysis/_route";

import {
  JsonSchemaNode,
} from "@/app/app/analyze/JsonSchemaEditor/JsonSchemaNode";
import {IconBtn} from "@/components/buttons/IconBtn";
import {BaseCallout} from "@/components/cards/BaseCallout";
import {SimpleHeader} from "@/components/headers/SimpleHeader";
import {
  LinearProgressWithLabel,
} from "@/components/progress/LinearProgressWithLabel";
import {CustomTabPanel} from "@/components/tabs/CustomTab";
import {TxtField} from "@/components/textFields/TxtField";
import {Txt} from "@/components/typography/Txt";

import {useApolloClient} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  AccountTree,
  Edit,
  QuestionMark,
  QuestionMarkOutlined,
  QuestionMarkRounded,
  RunCircle,
  SmartToy,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import {updateAnalyzerFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {
  useAnalyzerFlatFragLoader,
  useRsnPageFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";
import {JSONSafeParse} from "@reasonote/lib-utils";

function isComplexType(data: any): data is (object | any[]) {
    return (typeof data === 'object' && data !== null) || Array.isArray(data);
}


export function JsonDisplay({ data, level = 0 }: {data: any, level: number}) {

    if (!isComplexType(data) || data === null) {
      // Base case: data is not an object (or is null), so just return the data
      return <Typography>{data}</Typography>;
    }
  
    return (
        _.isArray(data) ?
            <>
                {data.map((value, index) => (
                <Box key={index} sx={{ paddingLeft: `${level * 20}px` }}>
                    <Typography component="span" variant="body2">
                    {`[${index}] `}
                    </Typography>
                    
                    {isComplexType(value) ? (
                        <JsonDisplay data={value} level={level + 1} />
                        ) : (
                        <Typography component="span" variant="body2">
                            {` ${value}`}
                        </Typography>
                    )}
                </Box>
                ))}
            </>
            :
            <>
                {Object.entries(data).map(([key, value]) => (
                    <Box key={key} sx={{ paddingLeft: `${level * 20}px` }}>
                        <Typography component="span" variant="body2" fontWeight="fontWeightBold">
                        {key}: 
                        </Typography>
                        {isComplexType(value) ? (
                        <JsonDisplay data={value} level={level + 1} />
                        ) : (
                        <Typography component="span" variant="body2">
                            {` ${value}`}
                        </Typography>
                        )}
                    </Box>
                ))}
            </>
    );
};
  

export function CustomAnalysis({ selectedDocId, analyzerId, initialTab = 'run' }: {selectedDocId: string | null, initialTab?: 'run' | 'edit', analyzerId: string}) {
    const {data: analyzer} = useAnalyzerFlatFragLoader(analyzerId);
    const ac = useApolloClient();

    const jsonSchema = JSONSafeParse(analyzer?.aiJsonschema ?? '{}')?.data ?? {
        type: 'object',
        description: '',
    }

    return (
        <>
        <CustomAnalysisDumb
            key={analyzerId}
            selectedDocId={selectedDocId}
            analyzer={{
                ...analyzer,
                type: 'schema-output',
                id: analyzerId as string,
                name: analyzer?.name ?? '',
                description: analyzer?.description ?? '',
                jsonSchema: jsonSchema,
                prompt: analyzer?.aiPrompt ?? '',
            }}
            updateAnalyzer={async (newAnalyzer: Analyzer) => {
                await ac.mutate({
                    mutation: updateAnalyzerFlatMutDoc,
                    variables: {
                        filter: {
                            id: {
                                eq: newAnalyzer.id,
                            }
                        },
                        set: {
                            name: newAnalyzer.name,
                            description: newAnalyzer.description,
                            aiJsonschema: JSON.stringify(newAnalyzer.jsonSchema), 
                            aiPrompt: newAnalyzer.prompt,
                        },
                        atMost: 1
                    },
                });
            }}
            initialTab={initialTab}
        />
        </>
    );
}

export function CustomAnalysisDumb({ selectedDocId, analyzer, updateAnalyzer, initialTab = 'run' }: {selectedDocId: string | null, initialTab?: 'run' | 'edit', analyzer: Analyzer, updateAnalyzer: (newAnalyzer: Analyzer) => void}) {
    const docResult = useRsnPageFlatFragLoader(selectedDocId);
    const theme = useTheme();
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'run' | 'edit'>(initialTab);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [aiInputsInfoOpen, setAiInputsInfoOpen] = useState(false);

    const reRunAnalysis = useCallback(async () => {
        setIsRunning(true);
        setAnalysisResult(null);
        try {
            const { data, error } = await AnalysisRoute.call({
                analyzers: [analyzer],
                documents: [{
                    id: selectedDocId ?? '',
                    content: docResult.data?.body ?? '',
                    title: docResult.data?.name ?? '',
                    description: docResult.data?.description ?? '',
                }].filter(notEmpty),
            });
          
            if (data) {
                const { analyses } = data;
            
                analyses.forEach((analysis: any) => {
                    console.log(
                    `Analysis for ${analysis.analyzer.name}:`,
                    analysis.analysis
                    );
                });
            
                setAnalysisResult(analyses[0]);
            }
        } catch (e) {
            console.error(e);
        }
        setIsRunning(false);
    }, [docResult.data, analyzer, selectedDocId]);

    return (
        <Stack alignItems={'center'} gap={2}>
            <Tabs 
                value={activeTab}
                onChange={(e, newValue) => {
                    setActiveTab(newValue);
                }} 
                aria-label="basic tabs example"
                sx={{height: '50px', minHeight: '50px', overflow: 'visible'}}
                centered
            >
                <Tab icon={<RunCircle fontSize="small"/>} label="Run" value={'run'} sx={{height: '40px', minHeight: '40px'}}/>
                <Tab icon={<Edit fontSize="small"/>} label="Edit" value={'edit'} sx={{height: '40px', minHeight: '40px'}}/>
            </Tabs>
            <CustomTabPanel currentValue={activeTab} value={'run'} divProps={{style: {maxWidth: '100%', minWidth: '80%'}}}>
                <Stack gap={2} alignItems={'center'}>
                    {!analysisResult && !isRunning && (
                        <BaseCallout
                            icon={<QuestionMark />}
                            header={<Typography variant="h6">{analyzer.name}</Typography>}
                            backgroundColor={theme.palette.gray.main}
                            sx={{ paper: { padding: '10px', width: '100%' } }}
                        >
                            {analyzer.description}
                        </BaseCallout>
                    )}
                    
                    {
                        isRunning ? 
                            <Stack sx={{height: '80px', width: '100%'}}>
                                <div>
                                    <LinearProgressWithLabel label={<Typography>Running Custom Analysis...</Typography>} labelPos="above" />
                                </div>
                            </Stack>
                            :
                            <Button variant={analysisResult ? 'outlined' : 'contained'} onClick={() => reRunAnalysis()}>{analysisResult ? 'Re-' : ''}Run Analysis</Button>
                    }

                    {analysisResult && (
                        <Stack gap={2}>
                            <Typography variant="h5">Analysis Result</Typography>
                            {/* <Accordion>
                                <AccordionSummary>
                                    <Txt startIcon={<AccountTree/>} variant="h6">Raw</Txt>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Txt sx={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(analysisResult.analysis, null, 2)}</Txt>
                                </AccordionDetails>
                            </Accordion> */}
                            {
                                analysisResult.analysis.type === 'schema-output' ?
                                    <JsonDisplay data={analysisResult.analysis.resultObject.parsedResult} level={0} />
                                    :
                                    analysisResult.analysis.result
                            }
                        </Stack>
                    )}
                </Stack>
            </CustomTabPanel>
            <CustomTabPanel key={'edit'} currentValue={activeTab} value={'edit'} divProps={{style: {width: '100%'}}} boxProps={{sx: {width: '100%'}}}>
                <Stack gap={3} width="100%">
                    <Stack gap={1}>
                        <TxtField
                            variant='standard'
                            fullWidth
                            label="Name"
                            value={analyzer.name}
                            onChange={(e) => {
                                updateAnalyzer({
                                    ...analyzer,
                                    name: e.target.value,
                                });
                            }}
                        />
                        <TxtField
                            variant='standard'
                            fullWidth
                            multiline   
                            label="Description"
                            value={analyzer.description}
                            onChange={(e) => {
                                updateAnalyzer({
                                    ...analyzer,
                                    description: e.target.value,
                                });
                            }}
                        />
                    </Stack>

                    <Stack gap={1}>
                        <SimpleHeader
                            leftContent={
                                <Txt 
                                    startIcon={<SmartToy/>} 
                                    variant="h6"
                                >
                                        AI Inputs
                                </Txt>
                            }
                            rightContent={
                                <IconBtn size="small" onClick={() => setAiInputsInfoOpen(!aiInputsInfoOpen)}>
                                    <QuestionMarkOutlined fontSize="small"/>
                                </IconBtn>
                            }
                        />
                        
                        <Stack gap={2} paddingLeft={'15px'}>
                            {
                                aiInputsInfoOpen && <BaseCallout
                                    icon={<QuestionMarkRounded/>}
                                    header={<Typography variant="body1">About AI Inputs</Typography>}
                                    backgroundColor={theme.palette.info.dark}
                                >
                                    <Box padding={'10px'}>
                                        <Typography variant="body2">
                                            These are what the AI will use to analyze the document.
                                            <br/>
                                            It can only see:
                                            <br/>
                                            1. What you put here
                                            <br/>
                                            2. The documents you select to analyze
                                            <br/>
                                            3. Any other information you choose to provide via your user settings.
                                        </Typography>
                                    </Box>
                                </BaseCallout>
                            }
                           

                            <Stack gap={1}>
                                    <TxtField
                                        variant='standard'
                                        fullWidth
                                        multiline   
                                        key={'prompt'}
                                        label="Prompt"
                                        value={analyzer.prompt}
                                        onChange={(e) => {
                                            updateAnalyzer({
                                                ...analyzer,
                                                prompt: e.target.value,
                                            });
                                        }}
                                    />

                                    <Txt startIcon={<AccountTree/>} variant="h6">Schema Tree</Txt>
                                    <div style={{width: '100%'}}>
                                        <JsonSchemaNode
                                            currentSchema={analyzer.jsonSchema}
                                            updateSchema={(newSchema) => {
                                                updateAnalyzer({
                                                    ...analyzer,
                                                    jsonSchema: newSchema,
                                                });
                                            }}
                                            updateOwnName={(newName) => {}}
                                            deleteSelf={() => {}}
                                            
                                        />
                                    </div>
                                </Stack>
                            </Stack>    
                    </Stack>
                </Stack>
            </CustomTabPanel>
        </Stack>
    );
}