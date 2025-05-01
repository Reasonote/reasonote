export function getClientFieldParserScalarName(typeName: string, fieldName: string | undefined) {
    return fieldName ? `ClientParsed_${typeName}_${fieldName}` : `ClientParsed_${typeName}`;
}
