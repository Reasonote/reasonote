"use client";
import "reactflow/dist/style.css";

import React, {
  ReactElement,
  useState,
} from "react";

import _ from "lodash";
import {z} from "zod";

import {useApolloClient} from "@apollo/client";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {oneShotAIClient} from "../../clientOnly/ai/oneShotAIClient";
import {ChatBubble} from "../chat/ChatBubble";
import {ConceptTree} from "../conceptTree/ConceptTree";
import FullCenter from "../positioning/FullCenter";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

export interface ConceptWithPrerequisites {
  conceptName: string;
  prerequisites?: string[];
}

export function CreateStack() {
  const [concepts, setConcepts] = useState<ConceptWithPrerequisites[]>([
    {
      conceptName: "Linear Regression",
      prerequisites: ["Linear Equation"],
    },
    {
      conceptName: "Logistic Regression",
      prerequisites: ["Linear Regression"],
    },
    {
      conceptName: "Linear Equation",
      prerequisites: ["Multiplication"],
    },
    {
      conceptName: "Multiplication",
      prerequisites: ["Addition", "Subtraction"],
    },
    {
      conceptName: "Addition",
      prerequisites: [],
    },
    {
      conceptName: "Subtraction",
      prerequisites: [],
    },
  ]);
  const [centralConceptName, setCentralConceptName] =
    useState("Machine Learning");
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [exercises, setExercises] = useState<ReactElement[]>([]);
  const ac = useApolloClient();
  const [exerciseGeneratingState, setExerciseGeneratingState] = useState<
    "not-started" | "generating" | "done"
  >("not-started");

  const generateExercises = async () => {
    setExerciseGeneratingState("generating");

    // await Promise.all(
    //   concepts.map(async (concept) => {
    //     const subtype = _.sample(ActivityTypes);
    //     // const subtype = 'fill-in-the-blank' as const;
    //     const exerciseComponent = await getExerciseComponent({
    //       ac,
    //       concept: {
    //         ...concept,
    //         type: "ai-generated",
    //         subtype,
    //         parentConceptName: centralConceptName,
    //       },
    //       callbacks: {
    //         onComplete: (result) => {
    //           setCurrentConceptIndex((idx) => idx + 1);
    //         },
    //       },
    //     });

    //     if (!exerciseComponent) {
    //       return;
    //     }

    //     setExercises((ex) => [...ex, exerciseComponent]);
    //   })
    // );
    setExerciseGeneratingState("done");
  };

  async function generateConcepts() {
    // Use oneShot to generate the concepts
    return oneShotAIClient({
      systemMessage: trimLines(`
            # Your Task
            You are responsible for helping the user learn the concept of ${centralConceptName}.
            You will do this by creating a list of concept names that will be used to generate exercises.

            These concept names should be explicitly related to ${centralConceptName}.

            (i.e. for multiplication, you would probably want to cover "addition" and "subtraction" first.)
            `),
      functionName: "generateConcepts",
      functionDescription: "Generate a series of concepts",
      functionParameters: z.object({
        concepts: z
          .array(
            z.object({
              name: z.string().describe("A concept name."),
              prerequisites: z
                .array(z.string())
                .optional()
                .describe(
                  "A list of concepts that this concept requires to be understood before this one can be understood."
                ),
            })
          )
          .describe("A list of concepts to generate exercises for"),
      }),
    });
  }

  const currItem = exercises[currentConceptIndex];

  return (
    <>
      <FullCenter>
        <Stack width={"800px"}>
          <TextField
            value={centralConceptName}
            onChange={(ev) => setCentralConceptName(ev.target.value)}
          ></TextField>
          <Button
            onClick={async () => {
              const res = await generateConcepts();

              const resData = res.data;

              if (resData) {
                setConcepts(() =>
                  resData.concepts.map(({ name, prerequisites }) => {
                    return {
                      conceptName: name,
                      prerequisites,
                    };
                  })
                );
              }
            }}
          >
            Generate Concepts
          </Button>

          <Accordion>
            <AccordionSummary>
              <Typography>
                Concepts {concepts.length > 0 ? `(${concepts.length})` : ""}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {concepts.length > 0 ? (
                <Grid direction={"row"} gap={1}>
                  {concepts.map((c) => {
                    return <Chip label={c.conceptName} />;
                  })}
                </Grid>
              ) : (
                <Typography>No concepts generated yet.</Typography>
              )}

              {concepts && concepts.length > 0 ? (
                <ConceptTree concepts={concepts} />
              ) : (
                <div>No concepts</div>
              )}
            </AccordionDetails>
          </Accordion>

          <Stack alignItems={"center"} justifyItems={"center"}>
            {exerciseGeneratingState === "not-started" ? (
              <Button onClick={() => generateExercises()}>
                Generate Exercises
              </Button>
            ) : exerciseGeneratingState === "generating" ? (
              <Stack>
                <Typography>Generating exercises...</Typography>
                <CircularProgress />
              </Stack>
            ) : null}
          </Stack>

          {/* {
                    exerciseGeneratingState === 'done' ?
                        <Button onClick={() => setCurrentConceptIndex(0)}>Ok Go!</Button>
                        :
                        null
                } */}

          <PracticeSession
            exercises={exercises}
            concepts={concepts}
            currentConceptIndex={currentConceptIndex}
            setCurrentConceptIndex={setCurrentConceptIndex}
            currItem={currItem}
          />
        </Stack>
      </FullCenter>

      <ChatBubble />
    </>
  );
}

export function PracticeSession({
  exercises,
  concepts,
  currentConceptIndex,
  setCurrentConceptIndex,
  currItem,
}: {
  exercises: ReactElement[];
  concepts: ConceptWithPrerequisites[];
  currentConceptIndex: number;
  setCurrentConceptIndex: (idx: number) => void;
  currItem: ReactElement | null;
}) {
  return exercises.length > 0 ? (
    <div>
      <div>{currItem ?? null}</div>
      <div>
        <Button onClick={() => setCurrentConceptIndex(currentConceptIndex + 1)}>
          Skip
        </Button>
      </div>
    </div>
  ) : null;
}
