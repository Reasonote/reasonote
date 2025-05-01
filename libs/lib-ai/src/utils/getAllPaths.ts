/**
 * Takes in a JSON object, array, or primitive, and returns a Set of all paths in the object.
 * 
 * The path is a string that represents the path to each value in the object.
 * If a filter function is provided, only paths where filter(value) returns true will be included.
 * 
 * For example, if we have the following object:
 * {
 *   "a": {
 *     "b": [1, 2, 3]
 *   }
 * }
 * 
 * With filter = (value) => typeof value === 'number', the result will be:
 * [
 *   "a.b.0",
 *   "a.b.1",
 *   "a.b.2"
 * ]
 */
export function getAllPaths(
    object: any, 
    filter?: (value: any) => boolean,
    parentPath: string = ''
): Set<string> {
    const result = new Set<string>();
    const shouldInclude = (value: any) => !filter || filter(value);
    
    // Handle null or undefined
    if (object === null || object === undefined) {
        if (parentPath && shouldInclude(object)) {
            result.add(parentPath);
        }
        return result;
    }
    
    // Handle arrays
    if (Array.isArray(object)) {
        if (parentPath && shouldInclude(object)) {
            result.add(parentPath);
        }
        
        object.forEach((value, index) => {
            const currentPath = parentPath ? `${parentPath}.${index}` : `${index}`;
            
            if (typeof value === 'object') {
                const nestedPaths = getAllPaths(value, filter, currentPath);
                nestedPaths.forEach(path => result.add(path));
            } else if (shouldInclude(value)) {
                result.add(currentPath);
            }
        });
        
        return result;
    }
    
    // Handle objects
    if (typeof object === 'object') {
        if (parentPath && shouldInclude(object)) {
            result.add(parentPath);
        }
        
        Object.entries(object).forEach(([key, value]) => {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            
            if (typeof value === 'object') {
                const nestedPaths = getAllPaths(value, filter, currentPath);
                nestedPaths.forEach(path => result.add(path));
            } else if (shouldInclude(value)) {
                result.add(currentPath);
            }
        });
        
        return result;
    }
    
    // Handle primitive values
    if (parentPath && shouldInclude(object)) {
        result.add(parentPath);
    }
    
    return result;
} 