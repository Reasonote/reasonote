import { DocumentNode } from 'graphql';

export interface ReasonoteCodegenPresetConfig {
    operationType:
    | "fragmentLoader"
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
