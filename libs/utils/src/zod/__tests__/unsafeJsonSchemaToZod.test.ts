import {
    describe,
    expect,
    it,
} from "vitest";

import { unsafeJsonSchemaToZod } from "../unsafeJsonSchemaToZod";

describe('unsafeJsonSchemaToZod', () => {
  it('should convert a JSON schema to a Zod schema', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };
    const zodSchema = unsafeJsonSchemaToZod(jsonSchema);
    expect(zodSchema).toBeDefined();
    expect(zodSchema.parse({ name: 'John' })).toEqual({ name: 'John' });
  });

  it('should convert a JSON schema to a Zod schema with an array', () => {
    const jsonSchema = {
      type: 'array',
      items: { type: 'string' },
    };
    const zodSchema = unsafeJsonSchemaToZod(jsonSchema);
    expect(zodSchema).toBeDefined();
    expect(zodSchema.parse(['John', 'Doe'])).toEqual(['John', 'Doe']);
  });

  it('should convert a complex JSON schema to a Zod schema', () => {
    const jsonSchema = {
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
    };
    const zodSchema = unsafeJsonSchemaToZod(jsonSchema);
    expect(zodSchema).toBeDefined();
    expect(zodSchema.parse({ message: 'Hello, world!', outputs: {} })).toEqual({ message: 'Hello, world!', outputs: {} });
    // Test failing case
    expect(() => zodSchema.parse({ message: 1, outputs: { alterStatus: 'invalid' } })).toThrow();
  });
});
