"use client";
import {
  useCallback,
  useState,
} from "react";

import _ from "lodash";

import {
  Edit,
  Start,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  Modal,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import {useRsnUser} from "../../../clientOnly/hooks/useRsnUser";
import {
  AnalysisDocument,
  AnalysisResult,
  AnalysisRoute,
  Analyzer,
} from "../../../pages/api/analysis/_route";
import {ComparisonSlider} from "./ComparisonSlider";
import {ComparisonSliderV2} from "./ComparisonSliderV2";
import JsonSchemaOutputAnalyzerComponent
  from "./JsonSchemaOutputAnalyzerComponent";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

const EXISTING_ENTITIES: any[] = [
  // {
  //     entityTypeId: 'PERSON',
  //     entityId: 'PERSON-TED-ID',
  //     data: {
  //         name: 'Ted Moseby',
  //         question: 'hi',
  //         importance: 'nice'
  //     }
  // },
  // {
  //     entityTypeId: 'PERSON',
  //     entityId: 'PERSON-FEYNMAN-ID',
  //     data: {
  //         name: 'Richard Feynman',
  //         question: 'wow',
  //         importance: 'nice'
  //     }
  // },
  // {
  //   entityTypeId: "PERSON",
  //   entityId: "PERSON-STANLEY-ID",
  //   data: {
  //     name: "Stanley",
  //     relationshipToAuthor: "friend",
  //     authorFeelings: "concerned",
  //     otherPersonFeelings: "unknown",
  //     observations: [
  //       {
  //         observation: "Stanley is cool. Hanging Out is easy.",
  //         confidence: 0.9,
  //       },
  //       {
  //         observation: "Stanley really likes Jazz.",
  //         confidence: 0.8,
  //       },
  //     ],
  //     ideasForDeepeningConnection: ["Go to a Jazz club with Stanley"],
  //   },
  // },
];

export default function AnalyzePage() {
  const theme = useTheme();
  const { rsnUserId } = useRsnUser();
  const isSmallDevice = useIsSmallDevice()

  const [editingAnalyzerId, setEditingAnalyzerId] = useState<string | null>(
    null
  );

  const [entities, setEntities] = useState<
    { entityTypeId: string; entityId: string; data: any }[]
  >([...EXISTING_ENTITIES]);

  const [documents, setDocuments] = useState<AnalysisDocument[]>([]);

  const [analyzers, setAnalyzers] = useState<Analyzer[]>([
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
      type: "schema-output",
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
    // {
    //     id: 'analyzer-3',
    //     type: 'schema-output',
    //     name: 'Questions for Self-Reflection & Improvement',
    //     jsonSchema: {
    //         type: 'array',
    //         description: 'Questions for Self-Reflection & Improvement',
    //         items: {
    //             type: 'object',
    //             description: 'A question that would help the author to reflect on themselves and improve',
    //             properties: {
    //                 question: {
    //                     type: 'string',
    //                     description: 'The question that would help the author to reflect on themselves and improve'
    //                 },
    //                 importance: {
    //                     type: 'number',
    //                     description: 'A number between 0 and 10 representing how important this question is, in your opinion'
    //                 },
    //                 helpfulResources: {
    //                     type: 'array',
    //                     description: 'A list of helpful resources that would help the author to answer this question',
    //                     items: {
    //                         type: 'string'
    //                     }
    //                 }
    //             },
    //             required: ['question', 'importance']
    //         }
    //     },
    // },
    // {
    //     id: 'analyzer-3',
    //     type: 'simple-prompt',
    //     name: 'Clear areas For Growth',
    //     prompt: trimLines(`
    //         Produce a detailed, exhaustive list of clear areas for growth in this person's life.

    //         Separate your response into several separate lists, with logical section headers.
    //     `)
    // },
    // {
    //     id: 'analyzer-4',
    //     type: 'simple-prompt',
    //     name: 'Helpful Concepts & Further Reading',
    //     prompt: trimLines(`
    //         Produce a detailed, exhaustive list for each of the following sections:
    //         - Helpful Psychological Concepts: What are some helpful psychological concepts that this person should be aware of?
    //         - Helpful Sociological Concepts: What are some helpful sociological concepts that this person should be aware of?
    //         - Helpful Concepts from other fields: What other kinds of ideas and concepts might help this person to better understand themselves and their situation?
    //         - Helpful Books / Articles / Videos / Websites: What books / articles / videos might be helpful for this person to read / consume?
    //     `)
    // },
    // {
    //     id: 'analyzer-5',
    //     type: 'simple-prompt',
    //     name: 'Important People',
    //     prompt: trimLines(`
    //         Produce a numbered, exhaustive list of the important people in this person's life.
    //         For each person, list:
    //         - Name
    //         - Relationship to this person
    //         - How the author feels about them
    //         - How the author thinks the other person feels about them
    //         - A numbered list of different creative Ideas you have for how the author can deepen their connection with this person.
    //     `)
    // },
    // {
    //     id: 'analyzer-6',
    //     type: 'simple-prompt',
    //     name: 'Important Events',
    //     prompt: trimLines(`
    //         Produce a numbered, exhaustive list of events that were mentioned.
    //         Include both explicitly stated events, and implicitly stated events, and suggested events.
    //         For each event, provide the following sections:
    //         - Event Name
    //         - Event Type (explicitly mentioned, implicitly mentioned, suggested)
    //         - Event Description
    //         - Event Date (as specific as possible)
    //         - Event Importance to Author (low, medium, high, severe)
    //         - Event Likelihood (low, medium high)
    //         - Event Importance to Others (low, medium, high, severe)
    //         - Author Preparation for Event (Prioritized list of steps the author can take to prepare for the event)
    //     `)
    // },
    // {
    //     id: 'analyzer-8',
    //     type: 'schema-output',
    //     name: 'Messages To Send',
    //     // prompt: trimLines(`
    //     //     Produce a detailed, exhaustive list of messages the author needs to send to people in their life.
    //     //     This MUST include messages the author mentions needing to send, and it CAN include suggested messages.
    //     //     For each message, provide the following sections:
    //     //     - Catchy Title for Message (For Author's Eyes Only)
    //     //     - Message Type (explicitly mentioned, implicitly mentioned, suggested)
    //     //     - Message Recipient
    //     //     - Reason for Sending Message
    //     //     - Message Content
    //     //     - Message Importance (low, medium, high, severe)
    //     //     - Message Urgency (low, medium, high, severe)
    //     // `)
    //     jsonSchema: {
    //         type: 'array',
    //         description: 'Messages that should be sent by the author.',
    //         items: {
    //             type: 'object',
    //             description: 'A message that should be sent by the author.',
    //             properties: {
    //                 title: {
    //                     type: 'string',
    //                     description: 'A catchy title for the message (for author eyes only)'
    //                 },
    //                 messageType: {
    //                     type: 'string',
    //                     description: 'Explicit | Implicit | Suggested // (Explicit messages are messages that the author explicitly stated, implicit messages are messages that you inferred from their writing, suggested messages are messages that you think would be helpful for the author to send)'
    //                 },
    //                 recipient: {
    //                     type: 'string',
    //                     description: 'The recipient of the message'
    //                 },
    //                 reasonForSending: {
    //                     type: 'string',
    //                     description: 'The reason for sending the message'
    //                 },
    //                 content: {
    //                     type: 'string',
    //                     description: 'The content of the message'
    //                 },
    //                 importance: {
    //                     type: 'string',
    //                     description: 'Low | Medium | High | Severe // (How important is it that this message be sent?)'
    //                 },
    //                 urgency: {
    //                     type: 'string',
    //                     description: 'Low | Medium | High | Severe // (How urgent is it that this message be sent?)'
    //                 }
    //             }
    //         }
    //     }
    // }
  ]);

  const setDocumentDescription = (docId: string, newDescription: string) => {
    setDocuments(
      documents.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            description: newDescription,
          };
        } else {
          return doc;
        }
      })
    );
  };

  const setAnalyzerName = useCallback((analyzerId: string, newName: string) => {
    setAnalyzers(
      analyzers.map((analyzer) => {
        if (analyzer.id === analyzerId) {
          return {
            ...analyzer,
            name: newName,
          };
        } else {
          return analyzer;
        }
      })
    );
  }, [analyzers]);

  const setAnalyzerPrompt = useCallback((analyzerId: string, newPrompt: string) => {
    setAnalyzers(
      analyzers.map((analyzer) => {
        if (analyzer.id === analyzerId) {
          return {
            ...analyzer,
            prompt: newPrompt,
          };
        } else {
          return analyzer;
        }
      })
    );
  }, [analyzers]);

  const createNewDocument = useCallback(() => {
    setDocuments([
      ...documents,
      {
        id: `document-${documents.length + 1}`,
        description:
          'This document is a "brain dump" -- a collection of unstructured, highly personal thoughts.',
        content: "",
      },
    ]);
  }, [documents]);

  const setDocumentContent = useCallback((docId: string, docContent: string) => {
    setDocuments(
      documents.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            content: docContent,
          };
        } else {
          return doc;
        }
      })
    );
  }, [documents]);

  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([
    // {
    //     analyzer: {
    //         id: 'analyzer-0',
    //         name: 'Placeholder',
    //         prompt: `fake`
    //     },
    //     analysis: 'This is a fake analysis.s'
    // },
    // {
    //     analyzer: {
    //         id: 'analyzer-01',
    //         name: 'Placeholder 2',
    //         prompt: `fake again`
    //     },
    //     analysis: 'This is a fake analysis again'
    // }
  ]);

  const performAnalysis = async () => {
    const { data, error } = await AnalysisRoute.call({
      analyzers,
      documents,
    });

    if (data) {
      const { analyses } = data;

      analyses.forEach((analysis: any) => {
        console.log(
          `Analysis for ${analysis.analyzer.name}:`,
          analysis.analysis
        );
      });

      setAnalysisResults(analyses);
    }
  };

  const onAnalyzerEditorOpen = () => {
  };

  const onAnalyzerEditorClose = () => {};

  const isLoggedIn = !!rsnUserId;

  return (
    <div style={{ height: "100dvh", width: "100vw", padding: "10px" }}>
      <Grid container gap={1}>
        <Grid item xs={5}>
          <Typography variant={"h4"} color={theme.palette.text.primary}>
            Documents
          </Typography>
          {documents.map((doc, idx) => (
            <div>
              <Card elevation={20} sx={{ padding: "10px" }}>
                <Typography variant={"h5"}>Document {idx}</Typography>
                <TextField
                  onChange={(ev) => setDocumentContent(doc.id, ev.target.value)}
                  value={doc.content}
                />
              </Card>
            </div>
          ))}
          <Button onClick={createNewDocument}>New Document</Button>

          <Typography variant={"h4"} color={theme.palette.text.primary}>
            Analyzers
          </Typography>
          <Stack gap={1}>
            {analyzers.map((analyzer, idx) => (
              <div>
                <Card elevation={20} sx={{ padding: "10px" }}>
                  {analyzer.type === "simple-prompt" ? (
                    editingAnalyzerId === analyzer.id ? (
                      <Stack gap={1}>
                        <Button onClick={() => setEditingAnalyzerId(null)}>
                          Done
                        </Button>
                        <TextField
                          size="small"
                          label={"Name"}
                          onChange={(ev) =>
                            setAnalyzerName(analyzer.id, ev.target.value)
                          }
                          value={analyzer.name}
                        />
                        <TextField
                          size="small"
                          label={"Prompt"}
                          multiline
                          key={'prompt'}
                          fullWidth
                          onChange={(ev) =>
                            setAnalyzerPrompt(analyzer.id, ev.target.value)
                          }
                          value={analyzer.prompt}
                        />
                      </Stack>
                    ) : (
                      <Stack gap={1}>
                        <Stack gap={1} direction={"row"} width="100%">
                          <IconButton
                            onClick={() => setEditingAnalyzerId(analyzer.id)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <Typography variant={"h6"}>
                            {analyzer.name}
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{
                            whiteSpace: "pre-line",
                          }}
                        >
                          {analyzer.prompt}
                        </Typography>
                      </Stack>
                    )
                  ) : (
                    <div>
                      <Button onClick={() => setEditingAnalyzerId(analyzer.id)}>
                        Edit
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </Stack>
          <Button onClick={createNewDocument}>New Document</Button>
        </Grid>
        <Grid item xs={6}>
          <Typography variant={"h4"} color={theme.palette.text.primary}>
            Analysis
          </Typography>
          {/* TODO REMOVE */}
          <ComparisonSliderV2
            newEntities={entities}
            existingEntities={EXISTING_ENTITIES}
          />

          <Button
            startIcon={<Start />}
            onClick={performAnalysis}
            variant="contained"
          >
            Perform Analysis
          </Button>
          <Grid container gap={1}>
            {analysisResults.map((ar) => (
              <Grid item>
                <Card elevation={20} sx={{ padding: "10px" }}>
                  <Typography variant={"h4"}>{ar.analyzer.name}</Typography>
                  {/* <Typography variant={'h5'}>Raw</Typography>
                                        <Typography sx={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto' }}>{ar.analysis.type === 'simple-prompt' ? ar.analysis.result : JSON.stringify(ar.analysis.resultObject.parsedResult, null, 2)}</Typography> */}
                  <Typography variant={"h5"}>Comparison</Typography>

                  {/* TODO: we need to parse out the result object(s) on the backend from the specific type of analyzer. */}
                  {/* TODO: we need to matchmake things that are the same.
                                            STARTER HERE:
                                            A search bar, that searches through entities -- but ONLY entities of this type.
                                        
                                        */}
                  {ar.analysis.type === "schema-output" ? (
                    <ComparisonSlider
                      newEntities={[
                        {
                          entityTypeId: "PERSON",
                          data: ar.analysis.resultObject.parsedResult[0],
                        },
                      ]}
                      existingEntities={EXISTING_ENTITIES}
                    />
                  ) : // <ComparisonCard newVersion={{ entityType: 'FIXME', data: ar.analysis.resultObject.parsedResult[0] }} oldVersion={{ entityType: 'FIXME', data: { question: 'wow', importance: 'nice' } }} />
                  null}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Modal
          open={editingAnalyzerId !== null}
          onClose={() => setEditingAnalyzerId(null)}
        >
          <Box
            sx={{
              position: "absolute" as "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "90vw",
              maxHeight: "80vh",
              width: "750px",
              bgcolor: "background.paper",
              border: "2px solid #000",
              boxShadow: 24,
              p: 4,
              overflow: "auto",
            }}
          >
            {/* @ts-ignore */}
            <JsonSchemaOutputAnalyzerComponent
              currentSchema={
                analyzers.find((an) => an.id === editingAnalyzerId)?.jsonSchema
              }
              updateSchema={(n: any) => {
                const analyzer = analyzers.find(
                  (an) => an.id === editingAnalyzerId
                );
                if (analyzer) {
                  const newAnalyzer = {
                    ...analyzer,
                    jsonSchema: n,
                  };
                  setAnalyzers(
                    analyzers.map((an) => {
                      if (an.id === editingAnalyzerId) {
                        return newAnalyzer;
                      } else {
                        return an;
                      }
                    })
                  );
                }
              }}
            />
          </Box>
        </Modal>
      </Grid>
    </div>
  );
}
