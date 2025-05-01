/**
 * 
 * This should take in a JSON object, array, or primitive, and return a map of paths to their mapped values.
 * 
 * The path is a string that represents the path to the value.
 * 
 * If a mapper function is provided, the mapped value is a result of running the mapper function on the value.
 * If no mapper is provided, the value will be null for all paths.
 * 
 * 
 * So, for example, if we have the following object:
 * 
 * {
 *   "a": {
 *     "b": [1, 2, 3]
 *   }
 * }
 * 
 * With no mapper, the result will be:
 * {
 *   "a": null,
 *   "a.b": null,
 *   "a.b.0": null,
 *   "a.b.1": null,
 *   "a.b.2": null
 * }
 */
export function reduceObjectToPaths<TReducedValue = null>(
    object: any, 
    mapper?: (value: any) => TReducedValue, 
    parentPath: string = ''
): Map<string, TReducedValue> {
    const defaultMapper = () => null as TReducedValue;
    const actualMapper = mapper || defaultMapper;
    
    const result = new Map<string, TReducedValue>();
    
    // Handle null or undefined
    if (object === null || object === undefined) {
        if (parentPath) {
            result.set(parentPath, actualMapper(object));
        }
        return result;
    }
    
    // Handle arrays
    if (Array.isArray(object)) {
        // Map the array itself at the parent path if it exists
        if (parentPath) {
            result.set(parentPath, actualMapper(object));
        }
        
        // Map each array element
        object.forEach((value, index) => {
            const currentPath = parentPath ? `${parentPath}.${index}` : `${index}`;
            
            if (typeof value === 'object') {
                // Recursively map nested objects/arrays
                const nestedPaths = reduceObjectToPaths(value, actualMapper, currentPath);
                nestedPaths.forEach((mappedValue, path) => {
                    result.set(path, mappedValue);
                });
            } else {
                // Map primitive values
                result.set(currentPath, actualMapper(value));
            }
        });
        
        return result;
    }
    
    // Handle objects
    if (typeof object === 'object') {
        // Map the object itself at the parent path if it exists
        if (parentPath) {
            result.set(parentPath, actualMapper(object));
        }
        
        // Map each object property
        Object.entries(object).forEach(([key, value]) => {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            
            if (typeof value === 'object') {
                // Recursively map nested objects/arrays
                const nestedPaths = reduceObjectToPaths(value, actualMapper, currentPath);
                nestedPaths.forEach((mappedValue, path) => {
                    result.set(path, mappedValue);
                });
            } else {
                // Map primitive values
                result.set(currentPath, actualMapper(value));
            }
        });
        
        return result;
    }
    
    // Handle primitive values
    if (parentPath) {
        result.set(parentPath, actualMapper(object));
    }
    
    return result;
}