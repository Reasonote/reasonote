// Determines if an item has some value, and tells typescript such.
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

export function camelize(str: string) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, "");
}

export function getNamesForType(typeName: string) {
    return {
        typeName,
        insert: {
            mutationName: `insertInto${typeName}Collection`,
            inputName: `${typeName}InsertInput`,
            responseName: `${typeName}InsertResponse`,
            filterName: `${typeName}Filter`,
        },
        update: {
            mutationName: `update${typeName}Collection`,
            inputName: `${typeName}UpdateInput`,
            responseName: `${typeName}UpdateResponse`,
            filterName: `${typeName}Filter`,
        },
        delete: {
            mutationName: `deleteFrom${typeName}Collection`,
            inputName: undefined,
            responseName: `${typeName}DeleteResponse`,
            filterName: `${typeName}Filter`,
        },
    };
}
