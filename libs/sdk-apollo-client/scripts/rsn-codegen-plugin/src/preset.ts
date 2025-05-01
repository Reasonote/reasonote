import {
  FragmentDefinitionNode,
  OperationDefinitionNode,
} from 'graphql';

import type { Types } from '@graphql-codegen/plugin-helpers';
import { Source } from '@graphql-tools/utils';

export type OperationOrFragment = {
    initialName: string;
    definition: OperationDefinitionNode | FragmentDefinitionNode;
};

export type SourceWithOperations = {
    source: Source;
    operations: Array<OperationOrFragment>;
};

const documentTypePartial = `
export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<
    infer TType,
    any
>
    ? TType
    : never;
`.split(`\n`);

const isOutputFolderLike = (baseOutputDir: string) => baseOutputDir.endsWith("/");

export const preset: Types.OutputPreset<any> = {
    prepareDocuments: (outputFilePath, outputSpecificDocuments) => [...outputSpecificDocuments, `!${outputFilePath}`],
    buildGeneratesSection: (options) => {
        if (!isOutputFolderLike(options.baseOutputDir)) {
            Error('[client-preset] target output should be a directory, ex: "src/gql/"');
        }

        if (options.plugins.length > 0 && Object.keys(options.plugins).some((p) => p.startsWith("typescript"))) {
            throw new Error(
                '[client-preset] providing typescript-based `plugins` with `preset: "client" leads to duplicated generated types',
            );
        }

        const forwardedConfig = {
            ...options.config,
        };

        const pluginMap = {
            ...options.pluginMap,
        };

        const plugins: Array<Types.ConfiguredPlugin> = [...options.plugins];

        return [
            {
                filename: `${options.baseOutputDir}/gqlDocuments/fragments/codegen/index.ts`,
                plugins,
                pluginMap,
                schema: options.schema,
                config: {
                    ...forwardedConfig,
                    rsnCodegenPresetConfig: {
                        operationType: "fragment",
                        pureSchema: options.schema,
                    },
                },
                documents: options.documents,
            },
            {
                filename: `${options.baseOutputDir}/gqlDocuments/queries/codegen/index.ts`,
                plugins,
                pluginMap,
                schema: options.schema,
                config: {
                    ...forwardedConfig,
                    rsnCodegenPresetConfig: {
                        operationType: "query",
                        pureSchema: options.schema,
                    },
                },
                documents: options.documents,
            },
            // {
            //     filename: `${options.baseOutputDir}/codegen/full-schema.json`,
            //     plugins,
            //     pluginMap,
            //     schema: options.schema,
            //     config: {
            //         ...forwardedConfig,
            //         rsnCodegenPresetConfig: {
            //             operationType: "_rawPureSchema",
            //             pureSchema: options.schema,
            //         },
            //     },
            //     documents: options.documents,
            // },
            // Helpful for debugging
            // {
            //     filename: `${options.baseOutputDir}/codegen/full-remote-schema.graphql`,
            //     plugins,
            //     pluginMap,
            //     schema: options.schema,
            //     config: {
            //         ...forwardedConfig,
            //         rsnCodegenPresetConfig: {
            //             operationType: "_rawPureSchemaGql",
            //             pureSchema: options.schema,
            //         },
            //     },
            //     documents: options.documents,
            // },
            {
                filename: `${options.baseOutputDir}/gqlDocuments/mutations/codegen/index.ts`,
                plugins,
                pluginMap,
                schema: options.schema,
                config: {
                    ...forwardedConfig,
                    rsnCodegenPresetConfig: {
                        operationType: "mutation",
                        pureSchema: options.schema,
                    },
                },
                documents: options.documents,
            },
            // {
            //     filename: `${options.baseOutputDir}/gqlDocuments/local/codegen/clientFieldParsers.gql`,
            //     plugins,
            //     pluginMap,
            //     schema: options.schema,
            //     config: {
            //         ...forwardedConfig,
            //         rsnCodegenPresetConfig: {
            //             operationType: "clientParsers",
            //             pureSchema: options.schema,
            //         },
            //     },
            //     documents: options.documents,
            // },
            // {
            //     filename: `${options.baseOutputDir}gql${gqlArtifactFileExtension}`,
            //     plugins: genDtsPlugins,
            //     pluginMap,
            //     schema: options.schema,
            //     config: {
            //     ...config,
            //     gqlTagName: options.presetConfig.gqlTagName || 'graphql',
            //     },
            //     documents: sources,
            // },
            // ...(fragmentMaskingFileGenerateConfig ? [fragmentMaskingFileGenerateConfig] : []),
            // ...(indexFileGenerateConfig ? [indexFileGenerateConfig] : []),
        ];
    },
};
