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
                filename: `${options.baseOutputDir}/hooks/fragment-hooks/codegen/index.ts`,
                plugins,
                pluginMap,
                schema: options.schema,
                config: {
                    ...forwardedConfig,
                    rsnCodegenPresetConfig: {
                        operationType: "fragmentLoader",
                        pureSchema: options.schema,
                    },
                },
                documents: options.documents,
            },
        ];
    },
};
