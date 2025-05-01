import _ from 'lodash';

import { ApolloLink } from '@apollo/client';

// TODO
// import gqlSchema from '../../codegen/full-schema.json';

// TODO: Add localSchema in later.
//import { loader } from 'graphql.macro';
// const localSchema = loader("../../gqlDocuments/local/codegen/clientFieldParsers.gql");

// Our typedefs, as loaded by the last schema pulled by codegen.
export const createReasonoteScalarApolloLink: any = async () => {
    // Keep for reference
    // const overrideTest = gql`
    //     scalar JSON
    //     # type ClientEventInsertInput {
    //     #     eventJsonData: JSON
    //     # }

    //     scalar ClientParsed_Annotation_cameraPlacement
    //     type Annotation {
    //         cameraPlacement: ClientParsed_Annotation_cameraPlacement
    //     }

    //     scalar ClientParsed_AnnotationPoint3d_point
    //     type AnnotationPoint3d {
    //         point: ClientParsed_AnnotationPoint3d_point
    //     }
    //     input AnnotationPoint3dInsertInput {
    //         point: ClientParsed_AnnotationPoint3d_point
    //     }
    //     input AnnotationPoint3dUpdateInput {
    //         point: ClientParsed_AnnotationPoint3d_point
    //     }
    // `

    // const gqlSchemaParsed = makeExecutableSchema({ typeDefs: gqlSchema as any });

    // const mergedSchema = mergeTypeDefs(
    //     [
    //         // overrides must come first!
    //         // Keep this for reference / debugging.
    //         // overrideTest,
    //         //localSchema,
    //         gqlSchemaParsed,
    //     ],
    //     {
    //         ignoreFieldConflicts: true,
    //     },
    // );

    // const schema = makeExecutableSchema({ typeDefs: mergedSchema as any });

    // const clientParsers = Object.fromEntries(
    //     _.entries(clientFieldParsers).map(([key, value]) => {
    //         const [typeName, fieldName] = key.split(".");
    //         const kName = fieldName ? `ClientParsed_${typeName}_${fieldName}` : `${typeName}`;
    //         return [kName, value];
    //     }),
    // );

    // /**
    //  * This link will add scalar parsing to the apollo client.
    //  *
    //  * This allows us to customize how things like Date objects,
    //  * and JSON objects, behave on the frontend. If properly configured,
    //  * JSON and Date objects will be automatically parsed and serialized.
    //  */
    // const scalarLink = withScalars({
    //     typesMap: {
    //         ...clientParsers,
    //     },
    //     schema: schema as any,
    // });

    // // return wrapApolloLink(createCustomReasonoteScalarSerializeLink({schema, typeDefs: clientParsers }), 'CustomReasonoteScalarLink');

    return ApolloLink.from([
        // wrapApolloLink(createCustomReasonoteScalarSerializeLink({schema, typeDefs: clientParsers }), 'CustomReasonoteScalarLink'),
        // wrapApolloLink(scalarLink, "ScalarLink"),
        // scalarLink,
    ]);

    // return wrapApolloLink(scalarLink, 'ScalarLink');
};
