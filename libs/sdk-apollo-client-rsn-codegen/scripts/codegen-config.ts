import { CodegenConfig } from '@graphql-codegen/cli';
import { requireEnvVar } from '@reasonote/lib-utils-backend';

import { clientFieldParsers } from './clientFieldParsers/clientParsers';

const REASONOTE_GRAPHQL_ENDPOINT = requireEnvVar("REASONOTE_GRAPHQL_ENDPOINT");

// @ts-ignore
console.log("REASONOTE_GRAPHQL_ENDPOINT", REASONOTE_GRAPHQL_ENDPOINT);

const clientTypeOverrides = Object.entries(clientFieldParsers).reduce((acc, [typeAndFieldName, fieldParserConfig]) => {
    // @ts-ignore
    console.log(typeAndFieldName);
    const [typeName, fieldName] = typeAndFieldName.split(".");
    // When it's a scalar, we don't need to add the `ClientParsed_` prefix.
    const gqlScalarName = fieldName ? `ClientParsed_${typeName}_${fieldName}` : `${typeName}`;

    return {
        ...acc,
        [gqlScalarName]: `ClientFieldParserTypes['${typeAndFieldName}']`,
    };
}, {});

// @ts-ignore
console.log("clientTypeOverrides", clientTypeOverrides);

const scalarOverrides = {
    UUID: "string",
    ...clientTypeOverrides,
};

const config: CodegenConfig = {
    schema: [
        // @ts-ignore
        {
            [REASONOTE_GRAPHQL_ENDPOINT]: {
                //@ts-ignore
                headers: {
                    schema: "public",
                },
                loader: "./scripts/loader.js",
            },
            ["src/gqlDocuments/local/*.graphql"]: {
                loader: "./scripts/loader.js",
            },
        },
    ],
    documents: [
        "src/gqlDocuments/**/*.tsx",
        "src/gqlDocuments/**/*.ts",
        "src/gqlDocuments/**/*.gql",
        "src/gqlDocuments/**/*.graphql",
    ],
    ignoreNoDocuments: true, // for better experience with the watcher
    generates: {
        "./src/codegen/codegen-generic-client/": {
            preset: "client",
            plugins: [
                {
                    // Adds eslint-disable and clientTypeOverride import to output file.
                    add: {
                        content:
                            '/* eslint-disable */\nimport {type ClientFieldParserTypes} from "../../../scripts/clientFieldParsers/clientParserTypes"',
                    },
                },
            ],
            config: {
                scalars: scalarOverrides,
                fragmentMasking: false,
                // You would think we could do this, but we can't.
                // Leaving this here so we know not to turn it on. If yo'ure brave you can try it.
                // dedupeFragments: true,
            },
            presetConfig: {
                // They recommend this approach for performance, but in practice it seems to make things more confusing.
                fragmentMasking: false,
            },
        },
    },
};

export default config;
