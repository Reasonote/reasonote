import {
  FragmentDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  OperationDefinitionNode,
} from 'graphql';

import type { Types } from '@graphql-codegen/plugin-helpers';
import { PluginFunction } from '@graphql-codegen/plugin-helpers';
import { Source } from '@graphql-tools/utils';

import { ExpectedTotalConfig } from '../pluginTypes';
import {
  camelize,
  notEmpty,
} from '../utils';

export type OperationOrFragment = {
    initialName: string;
    definition: OperationDefinitionNode | FragmentDefinitionNode;
};

export type SourceWithOperations = {
    source: Source;
    operations: Array<OperationOrFragment>;
};

interface HandleFragmentProps {
    config: ExpectedTotalConfig;
}

interface GetValidFragmentsInput {
    schema: GraphQLSchema;
    documents: Types.DocumentFile[];
    config: ExpectedTotalConfig;
    requireId?: boolean;
    requireTotalCount?: boolean;
    // info: Types.PluginInfo;
}

const basicScalarTypes = [
    "String",
    "Int",
    "Float",
    "Boolean",
    "Bool",
    "ID",
    "UUID",
    "DateTime",
    "Date",
    "Datetime",
    "JSON",
];

export const getValidFragments = ({
    documents,
    config,
    requireId,
    requireTotalCount,
}: GetValidFragmentsInput): ObjectTypeDefinitionNode[] => {
    const { ignoreFields } = config.rsnCodegenPluginConfig;
    const { pureSchema, operationType } = config.rsnCodegenPresetConfig;

    const schemaScalarTypes = pureSchema.definitions
        .map((d) => (d.kind === "ScalarTypeDefinition" ? d.name.value : null))
        .filter(notEmpty);
    const totalScalarTypes = [...basicScalarTypes, ...schemaScalarTypes];

    return pureSchema.definitions
        .map((d) => {
            if (d.kind === "ObjectTypeDefinition") {
                const collectionName = `${camelize(d.name.value)}Collection`;
                const filterName = `${d.name.value}Filter`;
                const connectionName = `${d.name.value}Connection`;
                const orderByName = `${d.name.value}OrderBy`;

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
                const hasQuery = !!pureSchema.definitions.find((d) => {
                    if (d.kind === "ObjectTypeDefinition" && d.name.value === "Query") {
                        const v = d?.fields?.filter((f) => {
                            if (f.name.value !== collectionName) return false;

                            

                            if (f.arguments?.length && f.arguments.length < 6) return false;

                            const argNames = f.arguments?.map((a) => a.name.value) || [];
                            
                            if (!argNames.includes("filter")) return false;
                            
                            if (!argNames.includes("orderBy")) return false;
                            if (!argNames.includes("first")) return false;
                            if (!argNames.includes("after")) return false;
                            if (!argNames.includes("last")) return false;
                            if (!argNames.includes("before")) return false;

                            // TODO check more
                            //if (f.type.kind != "NamedType" || f.type.name.value != connectionName) return false;

                            return true;
                        });

                        const queryHasAllNeededFields = !!v?.length;

                        return !!v?.length;
                    }
                });

                const hasFilterOnQuery = !!pureSchema.definitions.find((thisd) => {
                    if (thisd.kind === "InputObjectTypeDefinition" && thisd.name.value === filterName) {
                        if (requireId) {
                            return !!thisd.fields?.find((f) => f.name.value == "id");
                        }

                        return true;
                    }
                    return false;
                });

                /** check to validate if the schema has totalCount fields  */
                const hasTotalCount = !!pureSchema.definitions.find((d) => {
                    if (d.kind === "ObjectTypeDefinition" && d.name.value === connectionName) {
                        if (requireTotalCount) {
                            return !!d.fields?.find((f) => f.name.value === "totalCount");
                        }
                        return true;
                    }
                    return false;
                });

                if (!filteredFields?.length || !hasFilterOnQuery || !hasQuery || !hasTotalCount) return null;

                return d;
            }

            return null;
        })
        .filter(notEmpty)
        .filter((d) => !config.rsnCodegenPluginConfig.ignoreObjectTypes?.includes(d.name.value));
};

export const handleFragmentLoader: PluginFunction<ExpectedTotalConfig> = (schema, documents, config, info) => {
    // We care about requiring the id here, because we're going to use it to create a batch query.
    const validObjectTypes = getValidFragments({ schema, documents, config, requireId: true });

    // import { OrganizationFlatFrag } from "../../gqlDocuments";
    // import { getOrganizationsQueryDoc } from "../../gqlDocuments/queries";
    // import { createFragmentDataLoaders } from "../generic-hooks/fragmentDataLoader/createFragmentDataLoaders";

    // export const { FragLoader: OrganizationFlatFragLoader, useFragLoader: useOrganizationFlatFragLoader } =
    //     createFragmentDataLoaders({
    //         entityCachePrefix: "Organization",
    //         fragmentDoc: OrganizationFlatFrag,
    //         fragmentName: "OrganizationFlatFrag",
    //         batchQuery: getOrganizationsQueryDoc,
    //         createBatchVarsForKeys: (ids: any) => {
    //             return {
    //                 filter: {
    //                     id: { in: ids },
    //                 },
    //             };
    //         },
    //         queryManyPagesOpts: {
    //             queryManyType: "relay",
    //             getRelayPageInfo: (data) => data?.organizationCollection?.pageInfo,
    //         },
    //     });

    return [
        `import { createFragmentDataLoaders } from "../../generic-hooks/fragmentDataLoader/createFragmentDataLoaders";`,
        ...validObjectTypes.map((d) => {
            return [
                `import { ${d.name.value}FlatFrag } from "@reasonote/lib-sdk-apollo-client";`,
                `import { get${d.name.value}FlatQueryDoc } from "@reasonote/lib-sdk-apollo-client";`,

                `export const { FragLoader: ${d.name.value}FlatFragLoader, useFragLoader: use${d.name.value}FlatFragLoader } =`,
                `    createFragmentDataLoaders({`,
                `        entityCachePrefix: "${d.name.value}",`,
                `        fragmentDoc: ${d.name.value}FlatFrag,`,
                `        fragmentName: "${d.name.value}FlatFrag",`,
                `        batchQuery: get${d.name.value}FlatQueryDoc,`,
                `        createBatchVarsForKeys: (ids: any) => {`,
                `            return {`,
                `                filter: {`,
                `                    id: { in: ids },`,
                `                },`,
                `            };`,
                `        },`,
                `        queryManyPagesOpts: {`,
                `            queryManyType: "relay",`,
                `            getRelayPageInfo: (data) => data?.${camelize(d.name.value)}Collection?.pageInfo,`,
                `        },`,
                `    });`,
            ]
                .filter(notEmpty)
                .join("\n");
        }),
    ]
        .filter(notEmpty)
        .join("\n\n");
};

// Create all flat fragments
const handleFragment: PluginFunction<ExpectedTotalConfig> = (schema, documents, config, info) => {
    const { ignoreFields } = config.rsnCodegenPluginConfig;
    const { pureSchema, operationType } = config.rsnCodegenPresetConfig;

    // Target format
    // import { graphql } from "../../codegen";

    // export const AnnotationPoint2dFlatFrag = graphql(/* GraphQL */ `
    //     fragment AnnotationPoint2dFlatFrag on AnnotationPoint2d {
    //         id
    //         point
    //         page
    //         createdBy
    //         createdDate
    //         modifiedBy
    //         modifiedDate
    //     }
    // `);
    const schemaScalarTypes = pureSchema.definitions
        .map((d) => (d.kind === "ScalarTypeDefinition" || d.kind === "EnumTypeDefinition" ? d.name.value : null))
        .filter(notEmpty);
    const totalScalarTypes = [...basicScalarTypes, ...schemaScalarTypes];

    return [
        `import { graphql } from "@reasonote/lib-sdk-apollo-client";`,
        ...pureSchema.definitions.map((d) => {
            if (d.kind === "ObjectTypeDefinition") {
                const filteredFields = d?.fields
                    ?.filter((f) => {
                        if (ignoreFields?.includes(f.name.value)) return false;

                        // Flat fragments should not have arguments
                        if (f.arguments?.length) return false;

                        // Flat fragments should be scalars, or non null scalars.
                        if (f.type.kind === "NamedType") {
                            return totalScalarTypes.includes(f.type.name.value);
                            // return false;
                        } else if (f.type.kind === "NonNullType" && f.type.type.kind === "NamedType") {
                            return totalScalarTypes.includes(f.type.type.name.value);
                            // return false;
                        }
                    })
                    .filter(notEmpty);

                if (!filteredFields?.length) return null;

                return [
                    `export const ${d.name.value}FlatFrag = graphql(/* GraphQL */ \``,
                    `    fragment ${d.name.value}FlatFrag on ${d.name.value} {`,
                    filteredFields.map((f) => `        ${f.name.value}`).join("\n"),
                    `    }`,
                    `\`);`,
                ]
                    .filter(notEmpty)
                    .join("\n");
            }
        }),
    ]
        .filter(notEmpty)
        .join("\n\n");
};

// Create all flat fragments
const handleQuery: PluginFunction<ExpectedTotalConfig> = (schema, documents, config, info) => {
    // Target format
    // import { graphql } from "../../codegen";

    // export const getNotificationFlatQueryDoc = graphql(/* GraphQL */ `
    //     query getNotificationFlat(
    //         $filter: NotificationFilter
    //         $orderBy: [NotificationOrderBy!]
    //         $first: Int
    //         $after: Cursor
    //         $last: Int
    //         $before: Cursor
    //     ) {
    //         notificationCollection(
    //             filter: $filter
    //             orderBy: $orderBy
    //             first: $first
    //             after: $after
    //             last: $last
    //             before: $before
    //         ) {
    //             edges {
    //                 node {
    //                     ...NotificationFlatFrag
    //                 }
    //             }
    //             pageInfo {
    //                 ...PageInfoFlatFrag
    //             }
    //         }
    //     }
    // `);

    const validObjectTypes = getValidFragments({ schema, documents, config, requireId: false });
    const validObjectTypesWithTotalCount = getValidFragments({
        schema,
        documents,
        config,
        requireId: false,
        requireTotalCount: true,
    });

    return [
        `import { graphql } from "@reasonote/lib-sdk-apollo-client";`,
        ...validObjectTypes.map((d) => {
            // Target format
            // import { graphql } from "../../../codegen";

            // export const getNotificationFlatQueryDoc = graphql(/* GraphQL */ `
            //     query getNotificationFlat(
            //         $filter: NotificationFilter
            //         $orderBy: [NotificationOrderBy!]
            //         $first: Int
            //         $after: Cursor
            //         $last: Int
            //         $before: Cursor
            //     ) {
            //         notificationCollection(
            //             filter: $filter
            //             orderBy: $orderBy
            //             first: $first
            //             after: $after
            //             last: $last
            //             before: $before
            //         ) {
            //             edges {
            //                 node {
            //                     ...NotificationFlatFrag
            //                 }
            //             }
            //             pageInfo {
            //                 ...PageInfoFlatFrag
            //             }
            //         }
            //     }
            // `);

            return [
                `export const get${d.name.value}FlatQueryDoc = graphql(/* GraphQL */ \``,
                `    query get${d.name.value}Flat (`,
                `        $filter: ${d.name.value}Filter`,
                `        $orderBy: [${d.name.value}OrderBy!]`,
                `        $first: Int`,
                `        $after: Cursor`,
                `        $last: Int`,
                `        $before: Cursor`,
                `    ) {`,
                `        ${camelize(d.name.value)}Collection (`,
                `            filter: $filter`,
                `            orderBy: $orderBy`,
                `            first: $first`,
                `            after: $after`,
                `            last: $last`,
                `            before: $before`,
                `        ) {`,
                `            edges {`,
                `                node {`,
                `                    ...${d.name.value}FlatFrag`,
                `                }`,
                `            }`,
                `            pageInfo {`,
                `                ...PageInfoFlatFrag`,
                `            }`,
                `        }`,
                `    }`,
                `\`);`,
            ].join("\n");
        }),
        ...validObjectTypesWithTotalCount.map((d) => {
            // Target format
            // The queries using this doc are listed as slow since
            // we take a performance hit when including the totalCount prop
            // in our graphql query.
            // import { graphql } from "../../../codegen";

            // export const getNotificationFlatSlowQueryDoc = graphql(/* GraphQL */ `
            //     query getNotificationFlatSlow(
            //         $filter: NotificationFilter
            //         $orderBy: [NotificationOrderBy!]
            //         $first: Int
            //         $after: Cursor
            //         $last: Int
            //         $before: Cursor
            //     ) {
            //         notificationCollection(
            //             filter: $filter
            //             orderBy: $orderBy
            //             first: $first
            //             after: $after
            //             last: $last
            //             before: $before
            //         ) {
            //             totalCount
            //             edges {
            //                 node {
            //                     ...NotificationFlatFrag
            //                 }
            //             }
            //             pageInfo {
            //                 ...PageInfoFlatFrag
            //             }
            //         }
            //     }
            // `);

            return [
                `export const get${d.name.value}FlatSlowQueryDoc = graphql(/* GraphQL */ \``,
                `    query get${d.name.value}FlatSlow (`,
                `        $filter: ${d.name.value}Filter`,
                `        $orderBy: [${d.name.value}OrderBy!]`,
                `        $first: Int`,
                `        $after: Cursor`,
                `        $last: Int`,
                `        $before: Cursor`,
                `    ) {`,
                `        ${camelize(d.name.value)}Collection (`,
                `            filter: $filter`,
                `            orderBy: $orderBy`,
                `            first: $first`,
                `            after: $after`,
                `            last: $last`,
                `            before: $before`,
                `        ) {`,
                `            totalCount`,
                `            edges {`,
                `                node {`,
                `                    ...${d.name.value}FlatFrag`,
                `                }`,
                `            }`,
                `            pageInfo {`,
                `                ...PageInfoFlatFrag`,
                `            }`,
                `        }`,
                `    }`,
                `\`);`,
            ].join("\n");
        }),
        ...validObjectTypesWithTotalCount.map((d) => {
            // Target format
            // Used to return the total count based on a set filter
            // import { graphql } from "../../../codegen";

            // export const getNotificationFilteredTotalCountQueryDoc = graphql(/* GraphQL */ `
            //     query getNotificationFilteredTotalCount(
            //         $filter: NotificationFilter
            //     ) {
            //         notificationCollection(
            //             filter: $filter
            //         ) {
            //             totalCount
            //         }
            //     }
            // `);

            return [
                `export const get${d.name.value}FilteredTotalCountQueryDoc = graphql(/* GraphQL */ \``,
                `    query get${d.name.value}FilteredTotalCount (`,
                `        $filter: ${d.name.value}Filter`,
                `    ) {`,
                `        ${camelize(d.name.value)}Collection (`,
                `            filter: $filter`,
                `        ) {`,
                `            totalCount`,
                `        }`,
                `    }`,
                `\`);`,
            ].join("\n");
        }),
        ...validObjectTypesWithTotalCount.map((d) => {
            // Target format
            // Used to return the total count based on a set filter
            // import { graphql } from "../../../codegen";

            // export const getNotificationFilteredIdsOnlyQueryDoc = graphql(/* GraphQL */ `
            //     query getNotificationFilteredTotalCount(
            //         $filter: NotificationFilter
            //     ) {
            //         notificationCollection(
            //             filter: $filter
            //         ) {
            //             totalCount
            //             edges {
            //                 node {
            //                     id
            //                 }
            //             }
            //             pageInfo {
            //                 ...PageInfoFlatFrag
            //             }
            //         }
            //     }
            // `);

            if (d.fields?.filter((f) => f.name.value === "id").length) {
                return [
                    `export const get${d.name.value}IdsOnlyQueryDoc = graphql(/* GraphQL */ \``,
                    `    query get${d.name.value}IdsOnly (`,
                    `        $filter: ${d.name.value}Filter`,
                    `        $orderBy: [${d.name.value}OrderBy!]`,
                    `        $first: Int`,
                    `        $after: Cursor`,
                    `        $last: Int`,
                    `        $before: Cursor`,
                    `    ) {`,
                    `        ${camelize(d.name.value)}Collection (`,
                    `            filter: $filter`,
                    `            orderBy: $orderBy`,
                    `            first: $first`,
                    `            after: $after`,
                    `            last: $last`,
                    `            before: $before`,
                    `        ) {`,
                    `            totalCount`,
                    `            edges {`,
                    `                node {`,
                    `                    id`,
                    `                }`,
                    `            }`,
                    `            pageInfo {`,
                    `                ...PageInfoFlatFrag`,
                    `            }`,
                    `        }`,
                    `    }`,
                    `\`);`,
                ].join("\n");
            }
            return null;
        }),
    ].join("\n\n");
};