const { loadSchema } = require("@graphql-tools/load");
const { mergeTypeDefs } = require("@graphql-tools/merge");
const { gql } = require("graphql-tag");

/**
 * merges custom definitions into the schema defined by hasura, overwriting the generic jsonb types
 */
module.exports = async (schemaString, config) => {
    const reasonoteSchema = await loadSchema(schemaString, config);
    // TODO:CustomCodegen
    // const localSchema = await loadSchema(
    //     path.join(__dirname, "../src/gqlDocuments/local/codegen/clientFieldParsers.gql"),
    //     config,
    // );

    return mergeTypeDefs(
        [
            // TODO:CustomCodegen
            // overrides must come first!
            // localSchema,
            reasonoteSchema,
        ],
        {
            ignoreFieldConflicts: true,
        },
    );
};
