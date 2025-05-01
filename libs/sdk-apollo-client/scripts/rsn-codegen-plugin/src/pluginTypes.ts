import { DocumentNode } from 'graphql';

export interface ReasonoteCodegenPresetConfig {
    operationType:
    | "query"
    | "mutation"
    | "subscription"
    | "fragment"
    | "clientParsers"
    | "_rawPureSchema"
    | "_rawPureSchemaGql";
    pureSchema: DocumentNode;
}

export interface ReasonoteCodegenPluginConfig {
    ignoreFields?: string[];
    ignoreObjectTypes?: string[];
}

export type ExpectedTotalConfig = {
    rsnCodegenPresetConfig: ReasonoteCodegenPresetConfig;
    rsnCodegenPluginConfig: ReasonoteCodegenPluginConfig;
};
