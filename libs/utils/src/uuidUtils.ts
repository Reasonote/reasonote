import { v4 as uuidv4 } from "uuid";

export { v4 as uuidv4 } from "uuid";

export function typedUuidV4<TTypeName extends string = any>(
    typeName: TTypeName,
): `${TTypeName}_${string}` {
    // We use `_` because:
    // 1. It doesn't require URI encoding.
    // 2. It is a single character, so it is easy to split on in all languages.
    // It is visually distinct from the rest of the UUID, so it is easy to see where the type name ends and the UUID begins.
    return `${typeName}_${uuidv4()}`;
}
