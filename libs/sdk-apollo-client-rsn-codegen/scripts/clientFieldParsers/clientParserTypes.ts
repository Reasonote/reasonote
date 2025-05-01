import {
    DateClientFieldParserType,
} from './FieldTypeParsers/DateClientFieldParser';
import {
    JSONClientFieldParserType,
} from './FieldTypeParsers/JSONClientFieldParser';

/** These are the typescript type mappings which will be used to be exported in the `graphql.ts`
 * file that the codegen-generic-client generates. */
export type ClientFieldParserTypes = {
    // "Annotation.cameraPlacement": BasicPlacementClientFieldParserType;
    // "AnnotationPoint3d.point": BasicVector3ClientFieldParserType;
    // "AnnotationPoint3d.direction": BasicVector3ClientFieldParserType;
    // "Annotation.unstructuredData": AnnotationUnstructuredDataClientFieldParserType;
    // "AnnotationLinearMeasurement.firstPoint": BasicPointNormalClientFieldParserType;
    // "AnnotationLinearMeasurement.secondPoint": BasicPointNormalClientFieldParserType;
    // "AnnotationLinearMeasurement.angleControlPoint": BasicPointNormalClientFieldParserType;
    JSON: JSONClientFieldParserType;
    JSONB: JSONClientFieldParserType;
    Date: DateClientFieldParserType;
    DateTime: DateClientFieldParserType;
    Datetime: DateClientFieldParserType;
    BigInt: number;
};
