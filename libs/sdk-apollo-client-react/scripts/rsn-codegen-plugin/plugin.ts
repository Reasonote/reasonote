import { GraphQLSchema } from 'graphql';

import { PluginFunction } from '@graphql-codegen/plugin-helpers';

import { handleFragmentLoader } from './handlers/handleFragmentLoader';
import { ExpectedTotalConfig } from './pluginTypes';

export const plugin: PluginFunction<ExpectedTotalConfig> = (schema: GraphQLSchema, documents, config, info) => {
    const typesMap = schema.getTypeMap();

    const { rsnCodegenPresetConfig, rsnCodegenPluginConfig } = config;

    const { pureSchema, operationType } = rsnCodegenPresetConfig;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const typeName = operationType;

    if (typeName === "fragmentLoader") {
        return handleFragmentLoader(schema, documents, config, info);
    }

    throw new Error(`Unknown operation type: ${typeName}`);
};
