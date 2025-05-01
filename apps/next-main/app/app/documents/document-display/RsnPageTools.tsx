import React from "react";

import {Txt} from "@/components/typography/Txt";
import {useApolloClient} from "@apollo/client";
import {AddCircle} from "@mui/icons-material";
import {
  Breadcrumbs,
  Button,
  Card,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {createAnalyzerFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {
  useAnalyzerFlatFragLoader,
  useRsnPageFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

import {CustomAnalysis} from "./document-tools/CustomAnalysis/CustomAnalysis";
import {
  CustomAnalysisList,
} from "./document-tools/CustomAnalysis/CustomAnalysisList";
import {SWOTAnalysis} from "./document-tools/SWOTAnalysis/SWOTAnalysis";
import {
  SWOTAnalysisButton,
} from "./document-tools/SWOTAnalysis/SWOTAnalysisButton";

export interface RsnPageToolsProps {
    selectedDocId: string | null;
}

const analyzersConst = [
    // {
    //     id: 'analyzer-1',
    //     type: 'schema-output',
    //     name: 'Goals',
    //     jsonSchema: {
    //         type: 'array',
    //         description: 'Goals that were mentioned in the journal',
    //         items: {
    //             type: 'object',
    //             description: 'A goal that was mentioned in the journal',
    //             properties: {
    //                 name: {
    //                     type: 'string',
    //                     description: 'The name of the goal'
    //                 },
    //                 goalType: {
    //                     type: 'string',
    //                     description: 'Root | Instrumental // (Root goals are big goals, instrumental goals are smaller goals that help you achieve the big goals)'
    //                 },
    //                 explicitOrInferred: {
    //                     type: 'string',
    //                     description: 'Explicit | Inferred // (Explicit goals are goals that the person explicitly stated, inferred goals are goals that you inferred from their writing)'
    //                 },
    //             }
    //         }
    //     },
    // },
    {
      id: "analyzer-person",
      type: "schema-output" as const,
      name: "Important People",
      jsonSchema: {
        type: "array",
        description: "People who were mentioned.",
        items: {
          type: "object",
          description: "A person who was mentioned.",
          properties: {
            name: {
              type: "string",
              description: "The name of the person.",
            },
            relationshipToAuthor: {
              type: "string",
              description: "This person's relationship to the author",
            },
            authorFeelings: {
              type: "string",
              description:
                "A list of feelings the author feels about this person",
              items: {
                type: "string",
              },
            },
            otherPersonFeelings: {
              type: "string",
              description:
                "A list of feelings the author thinks the other person feels about them.",
              items: {
                type: "string",
              },
            },
            observations: {
              type: "array",
              description:
                "A list of observations the author made about this person",
              items: {
                type: "object",
                properties: {
                  observation: {
                    type: "string",
                    description:
                      "The observation the author made about this person",
                  },
                  confidence: {
                    type: "number",
                    description:
                      "A number between 0 and 10 representing how confident the author is in this observation",
                  },
                },
              },
            },
            ideasForDeepeningConnection: {
              type: "array",
              description:
                "A list of different creative Ideas you have for how the author can deepen their connection with this person.",
              items: {
                type: "string",
              },
            },
          },
        },
      },
    },
];


const ToolToComponentStatic: {[key:string]: {name: string, button: React.FC<any>, component: React.FC<RsnPageToolsProps>}} = {
    'SWOT Analysis': {
        name: 'SWOT Analysis',
        button: SWOTAnalysisButton,
        component: SWOTAnalysis,
    },

}



const ToolComponent = (props: RsnPageToolsProps & {
    toolId: string,
    analyzerStartingTab?: 'run' | 'edit'
}) => {
    const {selectedDocId} = props;
    const {data: analyzer} = useAnalyzerFlatFragLoader(props.toolId);

    if (analyzer) {
        return <div>
            <CustomAnalysis 
                key={analyzer.id}
                selectedDocId={selectedDocId}
                initialTab={props.analyzerStartingTab}
                analyzerId={analyzer.id}
            />
        </div>
    }
    else {
        const Component = ToolToComponentStatic[props.toolId]?.component;

        if (Component) {
            return <Component key={props.toolId} selectedDocId={selectedDocId}/>
        }
        else {
            return null;
        }
    }
}


// const ToolComponent = ({toolName, selectedDocId}: {toolName: string, selectedDocId: string | null}) => {
//     const Tool = ToolToComponent[toolName];
//     return <Tool.component selectedDocId={selectedDocId}/>
// }

export function RsnPageTools({selectedDocId}: RsnPageToolsProps) {
    const docResult = useRsnPageFlatFragLoader(selectedDocId);

    const ac = useApolloClient();
    
    const [toolId, setToolId] = React.useState<string | null>(null);
    // const [customTools, setCustomTools] = React.useState<Analyzer[]>(analyzersConst);

    const {data: analyzer} = useAnalyzerFlatFragLoader(toolId);



    const toolName = toolId ? (toolId in ToolToComponentStatic ? ToolToComponentStatic[toolId]?.name : (analyzer?.name ?? null)) : null;
    // const ToolComponent = toolId ? 
    //     (toolId in ToolToComponentStatic ? ToolToComponentStatic[toolId]?.component : null) : 
    //     (customTools.find(t => t.id === toolId) ? 
    //         (toolProps: RsnPageToolsProps) => {
    //             return <CustomAnalysis key={toolId} {...toolProps}
    //                 analyzer={customTools.find(t => t.id === toolId) as Analyzer}
    //                 updateAnalyzer={(newAnalyzer) => {
    //                 setCustomTools(customTools.map(t => t.id === newAnalyzer.id ? newAnalyzer : t));
    //             }}/>
    //         } : null);
    //     null;


    return <Card sx={{padding: '10px'}}>
        <Stack gap={1}>

            {/* Show breadcrumb like Tools > SWOT when available */}
            <Breadcrumbs>
                <Link component="button" variant="h5" 
                    sx={{
                        textDecoration: 'underline',
                        fontWeight: 'bold',
                        color: 'inherit'
                    }}
                    onClick={() => {
                        setToolId(null);
                    }}
                >
                    Tools
                    </Link>
                {toolId && <Typography variant="h5">{toolName}</Typography>}
            </Breadcrumbs>
            {
                !toolId && 
                <Stack>
                    <Typography variant="body1">Select a Tool</Typography>
                    <Stack>
                        {Object.keys(ToolToComponentStatic).map(toolName => {
                            const ToolButton = ToolToComponentStatic[toolName].button;

                            return <ToolButton
                                buttonOverrides={{
                                    onClick: () => {
                                        setToolId(toolName);
                                    }
                                }}
                            />
                        })}
                    </Stack>
                    <Txt variant="h6">Custom Tools</Txt>
                    <Stack>
                        <Button
                            startIcon={<AddCircle />}
                            onClick={async () => {
                                const createResult = await ac.mutate({
                                    mutation: createAnalyzerFlatMutDoc,
                                    variables: {
                                        objects: [{
                                            name: 'New Tool',
                                            aiJsonschema: JSON.stringify({
                                                type: 'string',
                                                description: 'All important names mentioned in the text.',
                                            })
                                        }]
                                    },
                                    refetchQueries: ['getAnalyzerFlat']
                                })

                                const newAnalyzer = createResult.data?.insertIntoAnalyzerCollection?.records?.[0];

                                if (newAnalyzer) {
                                    setToolId(newAnalyzer.id);
                                }
                                else {
                                    console.error('Failed to create new tool');
                                }
                            }}
                        >
                            Create Custom Tool
                        </Button>
                        <CustomAnalysisList 
                            onAnalyzerSelect={(analyzerId) => {
                                setToolId(analyzerId);
                            }}
                        /> 
                    </Stack>
                </Stack>
            }
            
            <Stack>
                {
                    toolId && <ToolComponent 
                        key={`${toolId}-${selectedDocId}`}
                        selectedDocId={selectedDocId}
                        toolId={toolId}
                        // analyzer={customTools.find(t => t.id === toolId)}
                        // updateAnalyzer={(newAnalyzer) => {
                        //     setCustomTools(customTools.map(t => t.id === newAnalyzer.id ? newAnalyzer : t));
                        // }}
                        // analyzerStartingTab={
                        //     // If it's a new tool, start in edit mode, otherwise start in run mode
                        //     customTools.find(t => t.id === toolId)?.name === 'New Tool' ? 'edit' : 'run'
                        // }
                    />
                }
               
            </Stack>
        </Stack>
    </Card>
}