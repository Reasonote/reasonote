import {
    describe,
    expect,
    it,
} from "vitest";

import {
    unsafeRecursiveJsonSchemaToZod,
} from "../unsafeRecursiveJsonSchemaToZod";

describe('unsafeRecursiveJsonSchemaToZod', () => {
    it('should handle complex case and not fail', () => {
        const schema = {
            "model": "openai:gpt-4o-mini",
            "messages": [
              {
                "role": "system",
                "content": "\n                  \n  <CRITICAL>\n    ALWAYS CALL THE 'json' TOOL, AND ONLY THAT TOOL.\n  </CRITICAL>\n  \n                  \n  <YourPersonality>\n    You are Marie Curie.\n    Your description is: \"Pioneering physicist and chemist, first woman to win a Nobel Prize\"\n    Your instructions for roleplaying are: \"Discuss scientific discoveries with passion and intellectual curiosity.\"\n  </YourPersonality>\n  \n          \n                  <YourTask>\n                    <Description>\n                      Your task is threefold:\n                      1. Gather information about the student learning \"calculus\" until you have a comprehensive understanding.\n                      2. Let the user select a lesson.\n                      3. Once a lesson is selected, teach/mentor the student by showing different activities (start with 5-10 activities)\n                      4. Continue to show activities until the student says they are comfortable with the topic.\n                      5. Once the student is comfortable, you can move on to the next lesson.\n\n                      # Information Gathering Phase ('info')\n                      - Gather information on USER REASONS (why they want to learn), LEVELS (current knowledge), and SPECIFICS (areas of interest).\n                      - Continue dialogue for 5-10 messages or until comprehensive understanding is achieved.\n\n                      # Lesson Selection Phase ('pick-lesson')\n                      - Create a lesson and let the student select a lesson.\n                      - Let the student select a lesson.\n\n                      # Teaching Phase ('teaching')\n                      - Create activities\n                      - Identify user's weaknesses and show activities to help them improve.\n                      - Activities should be coherent and work together to teach concepts.\n                      - Keep adding activities of increasing difficulty, until it's very clear the user FULLY understands the topic.\n                    </Description>\n\n                    <OutputInstructions>\n                      \n                      <INFO-GATHERING-PHASE>\n                        1. Brief affirmation of user's previous answer (1 sentence)\n                        2. Newline\n                        3. 1-sentence extra detail\n                        4. Newline\n                        5. Single, targeted question (1 sentence)\n                        6. 'updateSubjectContext' output\n                        7. 'offerUserOptions' output (MANDATORY when presenting choices - NEVER list options in the message text)\n\n                        Once you have enough information,\n                        - Use 'showLessonOptions' to generate lesson options based on gathered information -- NOTE: THIS IS DIFFERENT THAN 'offerUserOptions'\n                        - WAIT UNTIL THE USER SELECTS A LESSON.\n                        - Then, use 'updateStatus' to move to the 'teaching' phase.\n                      </INFO-GATHERING-PHASE>\n                      \n\n                      \n\n                      \n                    </OutputInstructions>\n                  </YourTask>\n\n                  <Context>\n                    <CurrentStatus>info</CurrentStatus>\n                    <ExistingSubjectContext>\n                      null\n                    </ExistingSubjectContext>\n                    <ExistingLessons>\n                      []\n                    </ExistingLessons>\n                  </Context>\n\n                  <FINAL_NOTES>\n                    \n                      <INFO_GATHERING_MODE>\n                        <CRITICAL_INSTRUCTION>NEVER include options or choices in your message text. ALL options MUST be presented EXCLUSIVELY through the 'offerUserOptions' output.</CRITICAL_INSTRUCTION>\n                      <IMPORTANT_NOTE_1>ALWAYS start by asking about the user's reasons for interest. Use the 'offerUserOptions' output to present 3-5 possible reasons as \"I want...\" statements.</IMPORTANT_NOTE_1>\n                      <IMPORTANT_NOTE_2>Each message should DIRECTLY inquire about the user's REASONS, LEVELS, or SPECIFICS.</IMPORTANT_NOTE_2>\n                      <IMPORTANT_NOTE_3>Always answer the user first, then use 'offerUserOptions' if applicable, then update the context.</IMPORTANT_NOTE_3>\n                      <IMPORTANT_NOTE_4>When asking questions, do not suggest any options in your text. Use 'offerUserOptions' for ALL option presentations.</IMPORTANT_NOTE_4>\n                      <IMPORTANT_NOTE_5>Exclude \"Other\" or \"Something Else\" options - users can provide their own options if needed.</IMPORTANT_NOTE_5>\n                      <IMPORTANT_NOTE_6>Avoid using words like \"Dive\" or \"Delve\".</IMPORTANT_NOTE_6>\n                      <IMPORTANT_NOTE_7>Keep responses concise - prefer \"Very\" over \"Really\".</IMPORTANT_NOTE_7>\n                    </INFO_GATHERING_MODE>\n                    \n                  </FINAL_NOTES>\n\n                  \n  <CRITICAL>\n    ALWAYS CALL THE 'json' TOOL, AND ONLY THAT TOOL.\n  </CRITICAL>\n  \n                "
              },
              {
                "id": "89bf7e0a-ba70-4b41-8bb0-0d24f0c33be6",
                "role": "assistant",
                "content": [
                  {
                    "type": "tool-call",
                    "toolCallId": "81a3c673-23e5-4d88-a114-00298aab6a76",
                    "toolName": "json",
                    "args": {
                      "message": "It's wonderful to hear that you're interested in learning calculus! Understanding your motivations will help me guide you better. \n\nCalculus is a fascinating subject that opens doors to many fields, including physics, engineering, and economics. \n\nWhat specifically motivates you to learn calculus?",
                      "outputs": {
                        "alterStatus": "info",
                        "updateSubjectContext": {
                          "reasons": null,
                          "levels": null,
                          "specifics": null
                        },
                        "offerUserOptions": {
                          "friendlyText": "Please share your reasons for wanting to learn calculus!",
                          "options": [
                            {
                              "emoji": "📚",
                              "text": "I want to improve my math skills."
                            },
                            {
                              "emoji": "🔬",
                              "text": "I want to apply it in science."
                            },
                            {
                              "emoji": "💼",
                              "text": "I need it for my career."
                            },
                            {
                              "emoji": "🎓",
                              "text": "I want to prepare for college."
                            },
                            {
                              "emoji": "🤔",
                              "text": "I'm just curious about it."
                            }
                          ],
                          "finalEndText": "Thanks for sharing!"
                        }
                      },
                      "z_eot": 1
                    }
                  }
                ]
              },
              {
                "id": "4aa05c24-4b7c-4315-9389-6058cd4f2e31",
                "role": "tool",
                "content": [
                  {
                    "type": "tool-result",
                    "toolName": "json",
                    "toolCallId": "81a3c673-23e5-4d88-a114-00298aab6a76",
                    "result": {
                      "success": true
                    }
                  }
                ]
              },
              {
                "id": "365d6d9c-96c0-4266-99d9-53b514615806",
                "role": "user",
                "content": "\n\n- I'm just curious about it.\n"
              }
            ],
            "schema": {
              "type": "object",
              "properties": {
                "message": {
                  "type": "string",
                  "description": "The message to display to the user."
                },
                "outputs": {
                  "type": "object",
                  "properties": {
                    "alterStatus": {
                      "anyOf": [
                        {
                          "type": "string",
                          "enum": [
                            "info",
                            "pick-lesson",
                            "teaching"
                          ]
                        },
                        {
                          "type": "null"
                        }
                      ],
                      "description": "Update your status."
                    },
                    "updateSubjectContext": {
                      "anyOf": [
                        {
                          "type": "object",
                          "properties": {
                            "reasons": {
                              "anyOf": [
                                {
                                  "type": "array",
                                  "items": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "type": "null"
                                }
                              ],
                              "description": "The reasons why the user wants to learn this subject -- in the form of 'I want ...' statements."
                            },
                            "levels": {
                              "anyOf": [
                                {
                                  "type": "array",
                                  "items": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "type": "null"
                                }
                              ],
                              "description": "Things the user already knows, and how well they know them."
                            },
                            "specifics": {
                              "anyOf": [
                                {
                                  "type": "array",
                                  "items": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "type": "null"
                                }
                              ],
                              "description": "Any particular details the user wants to know about the subject."
                            }
                          },
                          "additionalProperties": false
                        },
                        {
                          "type": "null"
                        }
                      ],
                      "description": "Update the subject context."
                    },
                    "offerUserOptions": {
                      "anyOf": [
                        {
                          "type": "object",
                          "properties": {
                            "friendlyText": {
                              "type": "string",
                              "description": "Some friendly text similar to, but NOT IDENTICAL TO: 'Pick some options, or chat back with me to add your own!' -- make sure to customize it to the character you are portraying."
                            },
                            "options": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "emoji": {
                                    "type": "string",
                                    "description": "The emoji to display for the option."
                                  },
                                  "text": {
                                    "type": "string",
                                    "description": "The text to display for the option."
                                  }
                                },
                                "required": [
                                  "emoji",
                                  "text"
                                ],
                                "additionalProperties": false
                              },
                              "description": "The options the user can choose from."
                            },
                            "finalEndText": {
                              "type": "string",
                              "description": "A quick message like 'thanks!' to display to the user when the user is done adding options."
                            }
                          },
                          "required": [
                            "friendlyText",
                            "options",
                            "finalEndText"
                          ],
                          "additionalProperties": false
                        },
                        {
                          "type": "null"
                        }
                      ],
                      "description": "Offer the user options. REQUIRED when presenting choices."
                    },
                    "showLessonOptions": {
                      "anyOf": [
                        {
                          "type": "object",
                          "properties": {
                            "lessons": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "name": {
                                    "type": "string",
                                    "description": "The name of the lesson."
                                  },
                                  "description": {
                                    "type": "string",
                                    "description": "The description of the lesson."
                                  },
                                  "emoji": {
                                    "type": "string",
                                    "description": "The emoji to display for the lesson."
                                  }
                                },
                                "required": [
                                  "name",
                                  "description",
                                  "emoji"
                                ],
                                "additionalProperties": false
                              },
                              "description": "The lessons to create."
                            }
                          },
                          "required": [
                            "lessons"
                          ],
                          "additionalProperties": false
                        },
                        {
                          "type": "null"
                        }
                      ],
                      "description": "Show the lesson options to the user."
                    },
                    "updateLesson": {
                      "anyOf": [
                        {
                          "type": "object",
                          "properties": {
                            "lessonName": {
                              "type": "string",
                              "description": "The name of the lesson to update."
                            },
                            "updates": {
                              "type": "object",
                              "properties": {
                                "addActivities": {
                                  "type": "array",
                                  "items": {
                                    "anyOf": [
                                      {
                                        "type": "object",
                                        "properties": {
                                          "type": {
                                            "type": "string",
                                            "const": "slide",
                                            "default": "slide"
                                          },
                                          "titleEmoji": {
                                            "anyOf": [
                                              {
                                                "anyOf": [
                                                  {
                                                    "not": {}
                                                  },
                                                  {
                                                    "type": "string"
                                                  }
                                                ]
                                              },
                                              {
                                                "type": "null"
                                              }
                                            ]
                                          },
                                          "title": {
                                            "anyOf": [
                                              {
                                                "anyOf": [
                                                  {
                                                    "not": {}
                                                  },
                                                  {
                                                    "type": "string"
                                                  }
                                                ]
                                              },
                                              {
                                                "type": "null"
                                              }
                                            ]
                                          },
                                          "markdownContent": {
                                            "type": "string",
                                            "description": "The body of the Slide."
                                          }
                                        },
                                        "required": [
                                          "markdownContent"
                                        ],
                                        "additionalProperties": false
                                      },
                                      {
                                        "type": "object",
                                        "properties": {
                                          "type": {
                                            "type": "string",
                                            "const": "multiple-choice",
                                            "default": "multiple-choice"
                                          },
                                          "question": {
                                            "type": "string",
                                            "description": "The question to ask the user. Format this in markdown. (NOTE: for LaTeX, you MUST wrap in \"<latex>...</latex>\" tags and use double backslashes \"\\\\\")"
                                          },
                                          "answerChoices": {
                                            "type": "array",
                                            "items": {
                                              "type": "string"
                                            },
                                            "description": "The answer choices to give the user. Format this in markdown. (NOTE: for LaTeX, you MUST wrap in \"<latex>...</latex>\" tags and use double backslashes \"\\\\\")"
                                          },
                                          "correctAnswer": {
                                            "type": "string",
                                            "description": "The correct answer to the question. Format this in markdown. (NOTE: for LaTeX, you MUST wrap in \"<latex>...</latex>\" tags and use double backslashes \"\\\\\")"
                                          },
                                          "answerChoiceFollowUps": {
                                            "type": "array",
                                            "items": {
                                              "type": "object",
                                              "properties": {
                                                "answerChoice": {
                                                  "type": "string"
                                                },
                                                "followUp": {
                                                  "type": "string"
                                                }
                                              },
                                              "required": [
                                                "answerChoice",
                                                "followUp"
                                              ],
                                              "additionalProperties": false
                                            },
                                            "description": "This message will be shown to the user if they select the corresponding answer choice. It should be one sentence, maximum. For example, for a right answer, this may be a 'fun fact', for a wrong answer, this should be a tip to help the user do better next time."
                                          }
                                        },
                                        "required": [
                                          "question",
                                          "answerChoices",
                                          "correctAnswer"
                                        ],
                                        "additionalProperties": false
                                      },
                                      {
                                        "type": "object",
                                        "properties": {
                                          "type": {
                                            "type": "string",
                                            "const": "term-matching",
                                            "default": "term-matching"
                                          },
                                          "termPairs": {
                                            "type": "array",
                                            "items": {
                                              "type": "object",
                                              "properties": {
                                                "term": {
                                                  "type": "string",
                                                  "description": "The term to be matched"
                                                },
                                                "definition": {
                                                  "type": "string",
                                                  "description": "The definition of the term"
                                                }
                                              },
                                              "required": [
                                                "term",
                                                "definition"
                                              ],
                                              "additionalProperties": false
                                            },
                                            "minItems": 2,
                                            "maxItems": 10,
                                            "description": "An array of term-definition pairs"
                                          },
                                          "instructions": {
                                            "type": "string",
                                            "description": "Optional instructions for the activity"
                                          }
                                        },
                                        "required": [
                                          "termPairs"
                                        ],
                                        "additionalProperties": false
                                      },
                                      {
                                        "type": "object",
                                        "properties": {
                                          "type": {
                                            "type": "string",
                                            "const": "short-answer",
                                            "default": "short-answer"
                                          },
                                          "questionText": {
                                            "type": "string",
                                            "description": "The text of the question."
                                          },
                                          "gradingCriteria": {
                                            "type": "string",
                                            "description": "(TEACHER-ONLY) The criteria that will be used to grade the user's performance on this question, including expected answers."
                                          }
                                        },
                                        "required": [
                                          "questionText",
                                          "gradingCriteria"
                                        ],
                                        "additionalProperties": false
                                      },
                                      {
                                        "type": "object",
                                        "properties": {
                                          "type": {
                                            "type": "string",
                                            "const": "roleplay"
                                          },
                                          "userCharacter": {
                                            "type": "object",
                                            "properties": {
                                              "objectives": {
                                                "type": "array",
                                                "items": {
                                                  "type": "object",
                                                  "properties": {
                                                    "objectiveName": {
                                                      "type": "string",
                                                      "description": "A short name for the objective"
                                                    },
                                                    "objectiveDescription": {
                                                      "type": "string",
                                                      "description": "A short description of the objective."
                                                    },
                                                    "private": {
                                                      "type": "object",
                                                      "properties": {
                                                        "gradingCriteria": {
                                                          "type": "string",
                                                          "description": "The criteria that will be used to grade the user's performance on this objective, based on the chat history."
                                                        }
                                                      },
                                                      "required": [
                                                        "gradingCriteria"
                                                      ],
                                                      "additionalProperties": true
                                                    }
                                                  },
                                                  "required": [
                                                    "objectiveName",
                                                    "objectiveDescription",
                                                    "private"
                                                  ],
                                                  "additionalProperties": true
                                                }
                                              }
                                            },
                                            "required": [
                                              "objectives"
                                            ],
                                            "additionalProperties": true,
                                            "description": "The user's character -- defined simply by their objectives."
                                          },
                                          "characters": {
                                            "type": "array",
                                            "items": {
                                              "type": "object",
                                              "properties": {
                                                "public": {
                                                  "type": "object",
                                                  "properties": {
                                                    "emoji": {
                                                      "type": "string",
                                                      "description": "An emoji to represent this person / character. "
                                                    },
                                                    "name": {
                                                      "type": "string"
                                                    },
                                                    "description": {
                                                      "type": "string"
                                                    }
                                                  },
                                                  "required": [
                                                    "emoji",
                                                    "name",
                                                    "description"
                                                  ],
                                                  "additionalProperties": true
                                                },
                                                "private": {
                                                  "type": "object",
                                                  "properties": {
                                                    "personality": {
                                                      "type": "string"
                                                    },
                                                    "motivation": {
                                                      "type": "string"
                                                    },
                                                    "otherInfo": {
                                                      "type": "string"
                                                    }
                                                  },
                                                  "required": [
                                                    "personality",
                                                    "motivation"
                                                  ],
                                                  "additionalProperties": true
                                                },
                                                "isUser": {
                                                  "type": "boolean"
                                                }
                                              },
                                              "required": [
                                                "public",
                                                "private"
                                              ],
                                              "additionalProperties": false
                                            },
                                            "minItems": 1,
                                            "maxItems": 20,
                                            "description": "The non-user characters in the roleplay exercise. THIS DOES NOT INCLUDE THE USER'S CHARACTER."
                                          },
                                          "setting": {
                                            "type": "object",
                                            "properties": {
                                              "emoji": {
                                                "type": "string",
                                                "description": "An emoji to represent the setting of the roleplay exercise."
                                              },
                                              "name": {
                                                "type": "string"
                                              },
                                              "description": {
                                                "type": "string"
                                              }
                                            },
                                            "required": [
                                              "name",
                                              "description"
                                            ],
                                            "additionalProperties": true,
                                            "description": "The setting of the roleplay exercise."
                                          }
                                        },
                                        "required": [
                                          "type",
                                          "userCharacter",
                                          "characters",
                                          "setting"
                                        ],
                                        "additionalProperties": false
                                      }
                                    ]
                                  },
                                  "description": "A list of activities to show the user in sequence."
                                },
                                "addActivitiesAfterIndex": {
                                  "type": [
                                    "number",
                                    "null"
                                  ],
                                  "description": "If adding activities, the index to add the activities after. If not provided, the activities will be added at the end of the lesson."
                                }
                              },
                              "required": [
                                "addActivities"
                              ],
                              "additionalProperties": false,
                              "description": "The updates to make to the lesson."
                            }
                          },
                          "required": [
                            "lessonName"
                          ],
                          "additionalProperties": false
                        },
                        {
                          "type": "null"
                        }
                      ],
                      "description": "Update a lesson. Whenever you are in 'teaching' mode, you should call this to add activities to the lesson."
                    }
                  },
                  "additionalProperties": false
                },
                "z_eot": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "Marks EOT. Set this to the number 1."
                }
              },
              "required": [
                "message",
                "outputs"
              ],
              "additionalProperties": false,
              "$schema": "http://json-schema.org/draft-07/schema#",
              "isJsonSchema": true
            }
        }
        const result = unsafeRecursiveJsonSchemaToZod(schema);

        // Only the json schema looking objects should be converted to zod.
        // All the messages should be equal
        expect(result.messages).toEqual(schema.messages);
        expect(result.schema.parse({ message: 'test', outputs: {} })).toEqual({ message: 'test', outputs: {} });
    });
});