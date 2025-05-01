"use client";
import React, {useState} from "react";

import _ from "lodash";

import {useMutation} from "@apollo/client";
import {tryUntilAsync} from "@lukebechtel/lab-ts-utils";
import {
  Add,
  AutoAwesome,
  Delete,
  DownhillSkiing,
  Lightbulb,
} from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  createGoalFlatMutDoc,
  deleteGoalFlatMutDoc,
  getGoalFlatQueryDoc,
  updateGoalFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";
import {
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client/src/codegen/codegen-generic-client/graphql";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {
  useUpdateGoalFieldId,
} from "../../../clientOnly/hooks/objects/goals/useUpdateGoalFieldById";
import {useRsnUser} from "../../../clientOnly/hooks/useRsnUser";
import GoalChat, {ChatEvent} from "./goalChat/GoalChat";

// Create an instance of DateTimeFormat
let dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long", // long-form for day
  month: "long", // long-form for month
  day: "2-digit", // two digits for day
});

function tryFocusOnGoalTextField(goalId: string) {
  // Poll for maximum of 5 seconds waiting for new goal to show up.
  try {
    const newGoalTextField = tryUntilAsync({
      func: async () => {
        const newGoalId = goalId;
        const goalTextfieldId = `goal-textfield-${newGoalId}`;
        const newGoalTextField = document.getElementById(goalTextfieldId);

        if (!newGoalTextField) {
          throw new Error("New goal textfield not found.");
        }

        newGoalTextField.focus();

        return newGoalTextField;
      },
      tryLimits: {
        maxTimeMS: 5000,
      },
      delay: {
        ms: 50,
      },
    });
  } catch (err) {
    console.error("Error waiting for new goal textfield to show up.", err);
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// PAGE
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
export default function GoalsPage() {
  const theme = useTheme();
  const { rsnUserId } = useRsnUser();
  const [chatOpen, setChatOpen] = useState<boolean>(true);
  const [createGoal] = useMutation(createGoalFlatMutDoc);
  const [deleteGoal] = useMutation(deleteGoalFlatMutDoc);
  const [updateGoal] = useMutation(updateGoalFlatMutDoc);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [goalSessionId, setGoalSessionId] = useState<string | null>(
    "TEST-GOAL-SESSION-ID"
  );
  const [chatHistory, setChatHistory] = useState<ChatEvent[]>([]);
  const GoalTypes = [
    {
      id: "today-only",
      name: "Today Only",
      description: "A goal that you want to complete today, and only today.",
    },
    {
      id: "habit",
      name: "Habit",
      description: "A goal that you want to complete every day.",
    },
  ];

  const updateGoalFieldId = useUpdateGoalFieldId();

  return (
    <Stack gap={2} maxWidth={"88vw"}>
      <Typography variant="h5" color={theme.palette.text.primary}>
        Goals: {dateFormatter.format(new Date())}
      </Typography>
      <Paper
        elevation={8}
        sx={{ padding: "10px", borderRadius: "5px", maxHeight: "40vh" }}
      >
        <Stack maxHeight={"100%"}>
          <ApolloClientInfiniteScroll
            wrapperElId={"doc-list-container"}
            inverse={false}
            overrideWrapperElProps={{
              style: {
                display: "flex",
                flexDirection: "column",
                overflowY: "scroll",
                flexGrow: 1,
                height: "100%",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              },
            }}
            overrideInfiniteScrollProps={{
              loader: <div>Loading</div>,
              style: {
                overflow: "visible",
                display: "flex",
                flexDirection: "column",
              },
              className: "gap-y-4",
            }}
            // TODO not sure why this is happening.
            //@ts-ignore
            queryOpts={{
              query: getGoalFlatQueryDoc,
              variables: {
                filter: {
                  createdBy: { eq: rsnUserId },
                },
                orderBy: {
                  createdDate: OrderByDirection.AscNullsLast,
                },
                first: 10,
              },
            }}
            updateCount={updateCount}
            //@ts-ignore
            fetchMoreOptions={(qResult) => {
              const after = qResult.data?.goalCollection?.pageInfo.endCursor;

              const ret = {
                variables: {
                  after,
                },
              };

              return ret;
            }}
            getPostScrollComponent={(latestQueryResult) => {
              return (
                <>
                  <Grid
                    container
                    gap={1}
                    alignContent={"center"}
                    justifyContent={"center"}
                  >
                    <Grid item xs={7}>
                      <Button
                        size={"small"}
                        color="info"
                        fullWidth
                        startIcon={<Add />}
                        onClick={async () => {
                          const newGoal = await createGoal({
                            variables: {
                              objects: [
                                {
                                  name: ``,
                                },
                              ],
                            },
                          });

                          latestQueryResult.refetch();

                          const newGoalId =
                            newGoal.data?.insertIntoGoalCollection?.records[0]
                              ?.id;

                          if (!newGoalId) {
                            return;
                          }

                          tryFocusOnGoalTextField(newGoalId);
                        }}
                      >
                        Add Goal
                      </Button>
                    </Grid>
                    <Grid item xs={2}>
                      <Button
                        fullWidth
                        size={"small"}
                        startIcon={<AutoAwesome />}
                        color="purple"
                        onClick={async () => {
                          // const result = await getSuggestedGoals(
                          //   latestQueryResult
                          // );

                          // if (!result) {
                          //   return;
                          // }

                          // const newGoals = result.newGoals.slice(0, 3);

                          // // Create goals that don't exist yet.
                          // for (const newGoal of newGoals) {
                          //   const existingGoal =
                          //     latestQueryResult.data?.goalCollection?.edges?.find(
                          //       (g) => g.node.name === newGoal.name
                          //     );

                          //   if (!existingGoal) {
                          //     await createGoal({
                          //       variables: {
                          //         objects: [
                          //           {
                          //             name: newGoal.name,
                          //           },
                          //         ],
                          //       },
                          //     });

                          //     latestQueryResult.refetch();
                          //   }
                          // }
                        }}
                      >
                        Suggest
                      </Button>
                    </Grid>
                    <Grid item xs={2}>
                      <Button
                        fullWidth
                        size={"small"}
                        startIcon={<AutoAwesome />}
                        color="purple"
                        onClick={async () => {
                          // const idsOnFetch =
                          //   latestQueryResult.data?.goalCollection?.edges?.map(
                          //     (g) => g.node.id
                          //   );

                          // const labelResult = await labelGoals(
                          //   [
                          //     {
                          //       name: "Start a Successful Company (Reasonote)",
                          //     },
                          //     { name: "Exercise Each Day" },
                          //     { name: "Maintain A Healthy Diet" },
                          //   ],
                          //   latestQueryResult
                          // );

                          // console.log("LABEL RESULT", labelResult);

                          // labelResult?.data?.goalLabels?.forEach(
                          //   async (gl, idx) => {
                          //     const goalId = idsOnFetch?.[idx];

                          //     if (!goalId) {
                          //       return;
                          //     }

                          //     await updateGoalFieldId(goalId, {
                          //       metadata: JSON.stringify({
                          //         relatedToLongTermGoal: gl.longTermGoal,
                          //         type: gl.type,
                          //       }),
                          //     });
                          //   }
                          // );
                        }}
                      >
                        Label
                      </Button>
                    </Grid>
                  </Grid>
                </>
              );
            }}
            getChildren={(latestQueryResult) => {
              const goals = latestQueryResult.data?.goalCollection?.edges;

              const ret = goals?.map((g) => {
                const gRelatedToLongTermGoal = JSONSafeParse(g.node.metadata)
                  .data?.relatedToLongTermGoal;
                const gType = JSONSafeParse(g.node.metadata).data?.type;

                console.log("metadata", JSONSafeParse(g.node.metadata).data);
                console.log("gType", gType);

                return (
                  <Stack
                    direction="row"
                    alignItems={"center"}
                    gap={1}
                    justifyContent="start"
                    width="100%"
                  >
                    <Checkbox
                      checked={g.node.isCompleted}
                      onClick={async () => {
                        await updateGoalFieldId(g.node.id, {
                          isCompleted: !g.node.isCompleted,
                        });
                      }}
                    />

                    <TextField
                      id={`goal-textfield-${g.node.id}`}
                      variant={"standard"}
                      sx={{ width: "60%" }}
                      value={g.node.name}
                      onKeyUp={async (e) => {
                        // If the key is enter, then we want to create a new goal.
                        if (e.key === "Enter") {
                          const newGoal = await createGoal({
                            variables: {
                              objects: [
                                {
                                  name: ``,
                                },
                              ],
                            },
                          });

                          await latestQueryResult.refetch();

                          const newGoalId =
                            newGoal.data?.insertIntoGoalCollection?.records[0]
                              ?.id;

                          if (!newGoalId) {
                            return;
                          }

                          tryFocusOnGoalTextField(
                            newGoal.data?.insertIntoGoalCollection?.records[0]
                              ?.id ?? ""
                          );
                        }
                      }}
                      onKeyDown={async (e) => {
                        // If key is backspace or delete, and the textfield is empty, then we want to delete the goal.
                        if (
                          (e.key === "Backspace" || e.key === "Delete") &&
                          g.node.name === ""
                        ) {
                          // Get the id of the goal before this one, if any:
                          const prevGoalId =
                            goals?.findIndex(
                              (g2) => g2.node.id === g.node.id
                            ) ?? -1;
                          tryFocusOnGoalTextField(
                            goals?.[prevGoalId - 1]?.node.id ?? ""
                          );

                          await deleteGoal({
                            variables: {
                              atMost: 1,
                              filter: {
                                id: { eq: g.node.id },
                              },
                            },
                          });

                          await latestQueryResult.refetch();
                        }
                      }}
                      onChange={async (e) => {
                        await updateGoalFieldId(g.node.id, {
                          name: e.target.value,
                        });
                      }}
                    />

                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={gType}
                      label="Type"
                      size="small"
                      onChange={async (ev) => {
                        console.log(gType);
                        await updateGoalFieldId(g.node.id, {
                          metadata: JSON.stringify({
                            ...JSONSafeParse(g.node.metadata).data,
                            type:
                              gType === "today-only" ? "habit" : "today-only",
                          }),
                        });
                      }}
                    >
                      {GoalTypes.map((gt) => {
                        return <MenuItem value={gt.id}>{gt.name}</MenuItem>;
                      })}
                    </Select>

                    <IconButton
                      size="large"
                      onClick={async () => {
                        await deleteGoal({
                          variables: {
                            atMost: 1,
                            filter: {
                              id: { eq: g.node.id },
                            },
                          },
                        });

                        latestQueryResult.refetch();
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>

                    <Stack>
                      {gRelatedToLongTermGoal ? (
                        <Tooltip title={gRelatedToLongTermGoal}>
                          <Chip
                            size="small"
                            icon={<Lightbulb />}
                            label={<div>1 Dream</div>}
                          />
                        </Tooltip>
                      ) : (
                        <div></div>
                      )}
                    </Stack>

                    <IconButton
                      size="large"
                      onClick={async () => {
                        // await getDimensions(g.node as any);

                        // latestQueryResult.refetch();
                      }}
                    >
                      <DownhillSkiing fontSize="small" />
                    </IconButton>

                    {/* ESTIMATE HOW LONG THIS WOULD TAKE */}
                  </Stack>
                );
              });

              return (
                <>
                  <Stack
                    direction="column"
                    alignItems={"center"}
                    width="100%"
                    spacing={2}
                  >
                    {ret ?? null}
                  </Stack>
                </>
              );
            }}
            hasMore={(latestQueryResult) => {
              const ret =
                latestQueryResult.loading ||
                latestQueryResult.data?.goalCollection?.pageInfo.hasNextPage;

              return !!ret;
            }}
          />
        </Stack>
      </Paper>
      <Paper
        elevation={8}
        style={{
          maxHeight: "45vh",
          borderRadius: "10px", // rounded borders
          padding: "1rem", // good padding
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)", // optional drop shadow for a "floating" effect
          zIndex: 999, // ensure the chat box appears below the button
          width: "66vw",
        }}
      >
        <GoalChat
          goalSessionId={goalSessionId ?? ""}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          onGoalAdded={async (suggestedGoal) => {
            const newGoal = await createGoal({
              variables: {
                objects: [
                  {
                    name: suggestedGoal.goalName,
                    metadata: JSON.stringify({
                      type: suggestedGoal.goalType,
                    }),
                  },
                ],
              },
            });

            setUpdateCount(updateCount + 1);
          }}
        />
      </Paper>

      {/* <React.Fragment key={"bottom"}>
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 1000,
          }}
        >
          <IconButton
            sx={{
              backgroundColor: chatOpen
                ? theme.palette.primary.dark
                : theme.palette.primary.main,
              ":hover": {
                backgroundColor: chatOpen
                  ? theme.palette.primary.main
                  : theme.palette.primary.dark,
              },
              color: chatOpen
                ? theme.palette.grey[200]
                : theme.palette.grey[200],
            }}
            onClick={() => setChatOpen(!chatOpen)}
          >
            <Chat />
          </IconButton>
        </div>
        {chatOpen && (
          <Paper
            elevation={8}
            style={{
              position: "fixed",
              bottom: "5rem", // positioned slightly above the IconButton
              right: "2rem",
              borderRadius: "10px", // rounded borders
              padding: "1rem", // good padding
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)", // optional drop shadow for a "floating" effect
              zIndex: 999, // ensure the chat box appears below the button
              width: "66vw",
            }}
          >
            <GoalChat />
          </Paper>
        )}
      </React.Fragment> */}
    </Stack>
  );
}
