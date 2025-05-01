import { GraphQLSchema } from 'graphql';

import { PluginFunction } from '@graphql-codegen/plugin-helpers';

import {
  ClientFieldParserTypeNames,
} from '../../../sdk-apollo-client-rsn-codegen/scripts/clientFieldParsers/clientParserTypeNames';
import {
  getClientFieldParserScalarName,
} from '../../../sdk-apollo-client-rsn-codegen/scripts/clientFieldParsers/getClientFieldParserScalarName';
import { getValidMutationsForType } from './getValidMutationsForType';
import { ExpectedTotalConfig } from './pluginTypes';
import { getNamesForType } from './utils';

export const handleClientParsers: PluginFunction<ExpectedTotalConfig> = (
    schema: GraphQLSchema,
    documents,
    config,
    info,
) => {
    return ClientFieldParserTypeNames.map((typeAndField) => {
        const [typeName, fieldName] = typeAndField.split(".");
        console.debug("handleClientParsers", typeName, fieldName);

        const validInserts = getValidMutationsForType({ schema, documents, config, mutationType: "insert" });
        const validDeletes = getValidMutationsForType({ schema, documents, config, mutationType: "delete" });
        const validUpdates = getValidMutationsForType({ schema, documents, config, mutationType: "update" });

        const namesForType = getNamesForType(typeName);

        const foundInsert = validInserts.find((o) => o.name.value === typeName);
        const foundDelete = validDeletes.find((o) => o.name.value === typeName);
        const foundUpdate = validUpdates.find((o) => o.name.value === typeName);

        // Want it to look like:
        // # put your overrides here
        // # override the generic jsonb type
        // scalar JSON_ClientParsed_Vector3

        // May also be "input AnnotationPoint3d" if it is an InputObjectType
        // type AnnotationPoint3d {
        //     point: JSON_ClientParsed_Vector3
        // }

        const typeNode = schema.getType(typeName);

        const typePrefix = typeNode?.astNode?.kind === "InputObjectTypeDefinition" ? "input" : "type";

        return fieldName
            ? [
                `scalar ${getClientFieldParserScalarName(typeName, fieldName)}`,
                fieldName
                    ? [
                        `${typePrefix} ${typeName} {`,
                        `    ${fieldName}: ${getClientFieldParserScalarName(typeName, fieldName)}`,
                        `}`,
                    ].join("\n")
                    : "",
                foundInsert
                    ? [
                        `input ${namesForType.insert.inputName} {`,
                        `    ${fieldName}: ${getClientFieldParserScalarName(typeName, fieldName)}`,
                        `}`,
                    ].join("\n")
                    : "",
                foundUpdate
                    ? [
                        `input ${namesForType.update.inputName} {`,
                        `    ${fieldName}: ${getClientFieldParserScalarName(typeName, fieldName)}`,
                        `}`,
                    ].join("\n")
                    : "",
            ].join("\n")
            : "";
    }).join("\n\n");
};
