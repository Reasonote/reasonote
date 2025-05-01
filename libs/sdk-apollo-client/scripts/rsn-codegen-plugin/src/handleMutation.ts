import { PluginFunction } from '@graphql-codegen/plugin-helpers';

import { getValidMutationsForType } from './getValidMutationsForType';
import { ExpectedTotalConfig } from './pluginTypes';
import { notEmpty } from './utils';

export const handleMutation: PluginFunction<ExpectedTotalConfig> = (schema, documents, config, info) => {
    const validCreateMutationtypes = getValidMutationsForType({ schema, documents, config, mutationType: "insert" });
    const validUpdateMutationtypes = getValidMutationsForType({ schema, documents, config, mutationType: "update" });
    const validDeleteMutationtypes = getValidMutationsForType({ schema, documents, config, mutationType: "delete" });

    return [
        `import { graphql } from "../../../codegen";`,
        // Target
        // export const createAnnotationMutDoc = graphql(/* GraphQL */ `
        //     mutation createAnnotation($objects: [AnnotationInsertInput!]!) {
        //         insertIntoAnnotationCollection(objects: $objects) {
        //             affectedCount
        //             records {
        //                 ...AnnotationFlatFrag
        //             }
        //         }
        //     }
        // `);
        ...validCreateMutationtypes.map((d) => {
            return [
                `export const create${d.name.value}FlatMutDoc = graphql(/* GraphQL */ \``,
                `    mutation create${d.name.value}Flat($objects: [${d.name.value}InsertInput!]!) {`,
                `        insertInto${d.name.value}Collection(objects: $objects) {`,
                `            affectedCount`,
                `            records {`,
                `                ...${d.name.value}FlatFrag`,
                `            }`,
                `        }`,
                `    }`,
                `\`);`,
            ]
                .filter(notEmpty)
                .join("\n");
        }),
        // Target
        // export const updateMessageMutationDoc = graphql(/* GraphQL */ `
        //     mutation updateMessage($set: MessageUpdateInput!, $filter: MessageFilter, $atMost: Int!) {
        //         updateMessageCollection(set: $set, filter: $filter, atMost: $atMost) {
        //             affectedCount
        //             records {
        //                 ...MessageFlatFrag
        //             }
        //         }
        //     }
        // `);
        ...validUpdateMutationtypes.map((d) => {
            return [
                `export const update${d.name.value}FlatMutDoc = graphql(/* GraphQL */ \``,
                `    mutation update${d.name.value}Flat($set: ${d.name.value}UpdateInput!, $filter: ${d.name.value}Filter, $atMost: Int!) {`,
                `        update${d.name.value}Collection(set: $set, filter: $filter, atMost: $atMost) {`,
                `            affectedCount`,
                `            records {`,
                `                ...${d.name.value}FlatFrag`,
                `            }`,
                `        }`,
                `    }`,
                `\`);`,
            ]
                .filter(notEmpty)
                .join("\n");
        }),
        // Target
        // export const deleteMessageFlatMutationDoc = graphql(/* GraphQL */ `
        //     mutation deleteMessageFlat($atMost: Int!, $filter: MessageFilter) {
        //         deleteFromMessageCollection(atMost: $atMost, filter: $filter) {
        //             affectedCount
        //             records {
        //                 __typename
        //                 id
        //             }
        //         }
        //     }
        // `);
        ...validDeleteMutationtypes.map((d) => {
            return [
                `export const delete${d.name.value}FlatMutDoc = graphql(/* GraphQL */ \``,
                `    mutation delete${d.name.value}Flat($atMost: Int!, $filter: ${d.name.value}Filter) {`,
                `        deleteFrom${d.name.value}Collection(atMost: $atMost, filter: $filter) {`,
                `            affectedCount`,
                `            records {`,
                `                __typename`,
                `                id`,
                `            }`,
                `        }`,
                `    }`,
                `\`);`,
            ]
                .filter(notEmpty)
                .join("\n");
        }),
    ].join("\n\n");
};
