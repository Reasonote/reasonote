import { CodegenConfig } from '@graphql-codegen/cli';
import { requireEnvVar } from '@reasonote/lib-utils-backend';

const REASONOTE_GRAPHQL_ENDPOINT = requireEnvVar("REASONOTE_GRAPHQL_ENDPOINT");
const REASONOTE_SUPABASE_ANON_KEY = requireEnvVar("REASONOTE_SUPABASE_ANON_KEY");

console.log("REASONOTE_GRAPHQL_ENDPOINT", REASONOTE_GRAPHQL_ENDPOINT);
console.log("REASONOTE_SUPABASE_ANON_KEY", REASONOTE_SUPABASE_ANON_KEY);

const scalarOverrides = {
    DateTime: "string",
    Date: "string",
    UUID: "string",
    Datetime: "string",
    JSON: "string",
    JSONB: "string",
};

const config: CodegenConfig = {
    schema: [
        {
            [REASONOTE_GRAPHQL_ENDPOINT]: {
                headers: {
                    Authorization: `Bearer ${REASONOTE_SUPABASE_ANON_KEY}`,
                    apiKey: REASONOTE_SUPABASE_ANON_KEY,
                },
            },
            // ["src/gqlDocuments/local/*.graphql"]: {},
        }
    ],
    documents: ["../sdk-apollo-client/src/gqlDocuments/local/*.graphql"],
    // watch: ["src/**/*.ts", "scripts/rsn-codegen-plugin/**/*"],
    ignoreNoDocuments: true, // for better experience with the watcher
    generates: {
        "./src/": {
            preset: "./scripts/rsn-codegen-plugin/preset.ts",
            plugins: ["./scripts/rsn-codegen-plugin/plugin.ts"],
            config: {
                rsnCodegenPluginConfig: {
                    ignoreFields: ["nodeId"],
                    ignoreObjectTypes: [],
                },
                rsnCodegenPresetConfig: {},
            },
        },
    },
};

export default config;
