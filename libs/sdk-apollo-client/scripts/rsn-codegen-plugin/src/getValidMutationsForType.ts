import {
  FragmentDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  OperationDefinitionNode,
} from 'graphql';

import type { Types } from '@graphql-codegen/plugin-helpers';
import { Source } from '@graphql-tools/utils';

import { ExpectedTotalConfig } from './pluginTypes';

export type OperationOrFragment = {
    initialName: string;
    definition: OperationDefinitionNode | FragmentDefinitionNode;
};

export type SourceWithOperations = {
    source: Source;
    operations: Array<OperationOrFragment>;
};

interface GetValidMutationsForTypeInput {
    schema: GraphQLSchema;
    documents: Types.DocumentFile[];
    config: ExpectedTotalConfig;
    mutationType: "update" | "insert" | "delete";
}

// Determines if an item has some value, and tells typescript such.
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

function camelize(str: string) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, "");
}

const ScalarTypes = ["String", "Int", "Float", "Boolean", "Bool", "ID", "UUID", "DateTime", "Date", "Datetime", "JSON"];

export const getValidMutationsForType = ({
    documents,
    config,
    mutationType,
}: GetValidMutationsForTypeInput): ObjectTypeDefinitionNode[] => {
    const { ignoreFields } = config.rsnCodegenPluginConfig;
    const { pureSchema, operationType } = config.rsnCodegenPresetConfig;

    const schemaScalarTypes = pureSchema.definitions
        .map((d) => (d.kind === "ScalarTypeDefinition" ? d.name.value : null))
        .filter(notEmpty);
    const totalScalarTypes = [...ScalarTypes, ...schemaScalarTypes];

    return pureSchema.definitions
        .map((d) => {
            if (d.kind === "ObjectTypeDefinition") {
                const mutationName =
                    mutationType === "insert"
                        ? `insertInto${d.name.value}Collection`
                        : mutationType === "update"
                            ? `update${d.name.value}Collection`
                            : `deleteFrom${d.name.value}Collection`;
                const inputName =
                    mutationType === "insert"
                        ? `${d.name.value}InsertInput`
                        : mutationType === "update"
                            ? `${d.name.value}UpdateInput`
                            : undefined;
                const responseName =
                    mutationType === "insert"
                        ? `${d.name.value}InsertResponse`
                        : mutationType === "update"
                            ? `${d.name.value}UpdateResponse`
                            : `${d.name.value}DeleteResponse`;
                const filterName = `${d.name.value}Filter`;

                const filteredFields = d?.fields
                    ?.filter((f) => {
                        if (ignoreFields?.includes(f.name.value)) return false;

                        if (f.type.kind === "NamedType") {
                            return totalScalarTypes.includes(f.type.name.value);
                            // return false;
                        } else if (f.type.kind === "NonNullType" && f.type.type.kind === "NamedType") {
                            return totalScalarTypes.includes(f.type.type.name.value);
                            // return false;
                        }
                    })
                    .filter(notEmpty);

                // Now figure out which of these has a query that looks the way we expect.
                const hasMutation = !!pureSchema.definitions.find((d) => {
                    if (d.kind === "ObjectTypeDefinition" && d.name.value === "Mutation") {
                        const mutationsMatching = d?.fields?.filter((f) => {
                            // Check mutation name.
                            if (f.name.value !== mutationName) return false;

                            // Check mutation arguments.
                            if (mutationType === "insert") {
                                const objArg = f.arguments?.find((a) => a.name.value === "objects");

                                if (!objArg) return false;

                                if (
                                    objArg.type.kind !== "NonNullType" ||
                                    objArg.type.type.kind !== "ListType" ||
                                    objArg.type.type.type.kind !== "NonNullType" ||
                                    objArg.type.type.type.type.kind !== "NamedType" ||
                                    objArg.type.type.type.type.name.value !== inputName
                                )
                                    return false;

                                // Check mutation response name.
                                if (f.type.kind !== "NamedType" || f.type.name.value !== responseName) return false;
                            } else if (mutationType === "update") {
                                const filterArg = f.arguments?.find((a) => a.name.value === "filter");
                                const setArg = f.arguments?.find((a) => a.name.value === "set");
                                const atMostArg = f.arguments?.find((a) => a.name.value === "atMost");

                                if (!filterArg || !setArg || !atMostArg) return false;

                                if (
                                    atMostArg.type.kind !== "NonNullType" ||
                                    atMostArg.type.type.kind !== "NamedType" ||
                                    atMostArg.type.type.name.value !== "Int"
                                )
                                    return false;

                                if (filterArg.type.kind !== "NamedType" || filterArg.type.name.value !== filterName)
                                    return false;

                                if (
                                    setArg.type.kind !== "NonNullType" ||
                                    setArg.type.type.kind !== "NamedType" ||
                                    setArg.type.type.name.value !== inputName
                                )
                                    return false;

                                // Check mutation response name.
                                if (
                                    f.type.kind !== "NonNullType" ||
                                    f.type.type.kind !== "NamedType" ||
                                    f.type.type.name.value !== responseName
                                )
                                    return false;
                            } else if (mutationType === "delete") {
                                const atMostArg = f.arguments?.find((a) => a.name.value === "atMost");
                                const filterArg = f.arguments?.find((a) => a.name.value === "filter");

                                if (!atMostArg || !filterArg) return false;

                                if (
                                    atMostArg.type.kind !== "NonNullType" ||
                                    atMostArg.type.type.kind !== "NamedType" ||
                                    atMostArg.type.type.name.value !== "Int"
                                )
                                    return false;
                                if (filterArg.type.kind !== "NamedType" || filterArg.type.name.value !== filterName)
                                    return false;

                                // The object must be able to be deleted by id.
                                const hasFilterWithId = !!pureSchema.definitions.find((thisd) => {
                                    if (thisd.kind === "InputObjectTypeDefinition" && thisd.name.value === filterName) {
                                        return !!thisd.fields?.find((f) => f.name.value == "id");
                                    }
                                    return false;
                                });

                                if (!hasFilterWithId) return false;
                            }

                            return true;
                        });

                        return !!mutationsMatching?.length;
                    }
                });

                if (!filteredFields?.length || !hasMutation) return null;

                return d;
            }

            return null;
        })
        .filter(notEmpty)
        .filter((d) => !config.rsnCodegenPluginConfig.ignoreObjectTypes?.includes(d.name.value));
};
