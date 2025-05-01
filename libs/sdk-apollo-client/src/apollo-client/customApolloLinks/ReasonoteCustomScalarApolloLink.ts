import {
    GraphQLSchema,
    OperationDefinitionNode,
    TypeNode,
} from 'graphql';
import { loader } from 'graphql.macro';
import _ from 'lodash';

import {
    ApolloLink,
    Operation,
} from '@apollo/client';

const localSchema = loader("../../gqlDocuments/local/codegen/clientFieldParsers.gql");

// Keep for reference.
// const exampleMutationOperation = {
//     "variables": {
//         "objects": {
//             "eventJsonData": {
//                 "type": "TEST_EVENT"
//             }
//         }
//     },
//     "extensions": {},
//     "operationName": "createClientEventFlat",
//     "query": {
//         "kind": "Document",
//         "definitions": [
//             {
//                 "kind": "OperationDefinition",
//                 "operation": "mutation",
//                 "name": {
//                     "kind": "Name",
//                     "value": "createClientEventFlat"
//                 },
//                 "variableDefinitions": [
//                     {
//                         "kind": "VariableDefinition",
//                         "variable": {
//                             "kind": "Variable",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "objects"
//                             }
//                         },
//                         "type": {
//                             "kind": "NonNullType",
//                             "type": {
//                                 "kind": "ListType",
//                                 "type": {
//                                     "kind": "NonNullType",
//                                     "type": {
//                                         "kind": "NamedType",
//                                         "name": {
//                                             "kind": "Name",
//                                             "value": "ClientEventInsertInput"
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 ],
//                 "selectionSet": {
//                     "kind": "SelectionSet",
//                     "selections": [
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "insertIntoClientEventCollection"
//                             },
//                             "arguments": [
//                                 {
//                                     "kind": "Argument",
//                                     "name": {
//                                         "kind": "Name",
//                                         "value": "objects"
//                                     },
//                                     "value": {
//                                         "kind": "Variable",
//                                         "name": {
//                                             "kind": "Name",
//                                             "value": "objects"
//                                         }
//                                     }
//                                 }
//                             ],
//                             "selectionSet": {
//                                 "kind": "SelectionSet",
//                                 "selections": [
//                                     {
//                                         "kind": "Field",
//                                         "name": {
//                                             "kind": "Name",
//                                             "value": "affectedCount"
//                                         }
//                                     },
//                                     {
//                                         "kind": "Field",
//                                         "name": {
//                                             "kind": "Name",
//                                             "value": "records"
//                                         },
//                                         "selectionSet": {
//                                             "kind": "SelectionSet",
//                                             "selections": [
//                                                 {
//                                                     "kind": "FragmentSpread",
//                                                     "name": {
//                                                         "kind": "Name",
//                                                         "value": "ClientEventFlatFrag"
//                                                     }
//                                                 },
//                                                 {
//                                                     "kind": "Field",
//                                                     "name": {
//                                                         "kind": "Name",
//                                                         "value": "__typename"
//                                                     }
//                                                 }
//                                             ]
//                                         }
//                                     },
//                                     {
//                                         "kind": "Field",
//                                         "name": {
//                                             "kind": "Name",
//                                             "value": "__typename"
//                                         }
//                                     }
//                                 ]
//                             }
//                         }
//                     ]
//                 }
//             },
//             {
//                 "kind": "FragmentDefinition",
//                 "name": {
//                     "kind": "Name",
//                     "value": "ClientEventFlatFrag"
//                 },
//                 "typeCondition": {
//                     "kind": "NamedType",
//                     "name": {
//                         "kind": "Name",
//                         "value": "ClientEvent"
//                     }
//                 },
//                 "selectionSet": {
//                     "kind": "SelectionSet",
//                     "selections": [
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "createdBy"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "createdDate"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "eventDate"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "eventJsonData"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "eventSubtype"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "eventText"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "id"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "modifiedBy"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "modifiedDate"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "sessionId"
//                             }
//                         },
//                         {
//                             "kind": "Field",
//                             "name": {
//                                 "kind": "Name",
//                                 "value": "__typename"
//                             }
//                         }
//                     ]
//                 }
//             }
//         ]
//     }
// }

// Keep for reference.
// const exampleTypeFromSchema = {
//     "name": {
//         "kind": "Name",
//         "value": "ClientEventInsertInput"
//     },
//     "kind": "InputObjectTypeDefinition",
//     "fields": [
//         {
//             "kind": "FieldDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "eventJsonData"
//             },
//             "arguments": [],
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "JSON"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "createdBy"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "UUID"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "createdDate"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "Datetime"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "eventDate"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "Datetime"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "eventSubtype"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "String"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "eventText"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "String"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "eventType"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "ClientEventType"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "id"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "UUID"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "modifiedBy"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "UUID"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "modifiedDate"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "Datetime"
//                 }
//             },
//             "directives": []
//         },
//         {
//             "kind": "InputValueDefinition",
//             "name": {
//                 "kind": "Name",
//                 "value": "sessionId"
//             },
//             "type": {
//                 "kind": "NamedType",
//                 "name": {
//                     "kind": "Name",
//                     "value": "UUID"
//                 }
//             },
//             "directives": []
//         }
//     ],
//     "directives": []
// }

function processVariable({
    schema,
    variableType,
    variableProvided,
    typeDefs,
}: {
    schema: GraphQLSchema;
    variableType: TypeNode;
    variableProvided: any;
    typeDefs: any;
}): any {
    // With non-null, we don't have to do anything extra here. Just pass through.
    if (variableType.kind === "NonNullType") {
        return processVariable({ schema, variableType: variableType.type, variableProvided, typeDefs });
    }
    // With list, we have to map over the list and process each item.
    if (variableType.kind === "ListType") {
        if (_.isArray(variableProvided)) {
            return variableProvided.map((item: any) =>
                processVariable({ schema, variableType: variableType.type, variableProvided: item, typeDefs }),
            );
        } else {
            // TODO: becuase of some weirdness with type-system (?) Assume it's meant to be a one-element variable?
            // OR throw an error here.
        }
    }
    // With NamedType, we can just get the type from the schema and process *that*.
    else if (variableType.kind === "NamedType") {
        const variableTypeFromSchema = schema.getType(variableType.name.value);

        // If it's input object type,
        // We map over all the fields, and process each one.
        if (variableTypeFromSchema?.astNode?.kind === "InputObjectTypeDefinition") {
            const fields = variableTypeFromSchema?.astNode?.fields;
            if (fields) {
                return Object.fromEntries(
                    fields.map((field) => {
                        const variableProvidedForField = variableProvided[field.name.value];

                        return [
                            field.name.value,
                            processVariable({
                                schema,
                                variableType: field.type,
                                variableProvided: variableProvidedForField,
                                typeDefs,
                            }),
                        ];
                    }),
                );
            }
        }

        if (variableTypeFromSchema?.astNode?.kind === "ScalarTypeDefinition") {
            // Check if scalar is in our typedefs
            const thisSerializer = typeDefs[variableTypeFromSchema.name]?.serialize;
            if (thisSerializer) {
                const convertedVariable = thisSerializer(variableProvided);

                // console.log(typeDefs[variableTypeFromSchema.name].serialize(variableProvided))
                // If it is, then we can just return the value.
                return convertedVariable;
            }
        }
    }
}

function processOperationNode({
    operation,
    schema,
    typeDefs,
}: {
    operation: Operation;
    schema: GraphQLSchema;
    typeDefs: any;
}) {
    const operationDefsInQueryDefs: OperationDefinitionNode[] = operation.query.definitions.filter(
        (d) => d.kind === "OperationDefinition",
    ) as OperationDefinitionNode[];
    const variableDefs = _.flatten(
        operationDefsInQueryDefs.map((operationDef: OperationDefinitionNode) => operationDef.variableDefinitions),
    );
    // For every variable provided, Get the variable definition.
    _.entries(operation.variables).map(([varName, variable]) => {
        const matchingVariableDefinition = variableDefs.find((varDef) => {
            return varDef?.variable.name.value === varName;
        });

        // If we have a matching variable definition, we can now get the type of the variable.
        if (matchingVariableDefinition) {
            const variableType = matchingVariableDefinition.type;

            const processed = processVariable({ schema, variableType, variableProvided: variable, typeDefs });

            if (processed) {
                operation.variables[varName] = processed;
            }
            // operation.variables[varName] = processVariable({schema, variableType, variableProvided: variable, typeDefs});
        }
    });

    // TODO return the modified thing.
    return operation;
}

/**
 * For some reason, the apollo-link-scalars package doesn't work well right now.
 *
 * So I'll have to go my own way on this one.
 */
export function createReasonoteCustomScalarApolloLink({
    schema,
    typeDefs,
}: {
    schema: GraphQLSchema;
    typeDefs: any;
}): ApolloLink {
    return new ApolloLink((operation, forward) => {
        // First, we recursively parse the operation variables.
        const newOperation = processOperationNode({ operation, schema, typeDefs });

        return forward(newOperation);
    });
}
