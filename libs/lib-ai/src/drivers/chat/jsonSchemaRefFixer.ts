/**
 * Transforms a JSON Schema by moving referenced definitions to a top-level $defs object
 * and updating all references accordingly.
 * 
 * @param schema The JSON Schema to transform
 * @returns A new JSON Schema with definitions moved to $defs
 */
export function jsonSchemaRefFixer(schema: any): any {
  // Create a new schema with the same top-level properties
  const newSchema = JSON.parse(JSON.stringify(schema));
  
  // Create $defs object if it doesn't exist
  if (!newSchema.$defs) {
    newSchema.$defs = {};
  }
  
  // Map to store original refs and their new locations
  const refMap = new Map<string, string>();
  
  // Store path to source objects that need to be converted to refs
  const sourcesToConvert = new Map<string, string>();
  
  // Find all $ref occurrences in the schema
  const findAllRefs = (obj: any): string[] => {
    const refs: string[] = [];
    
    const traverse = (o: any) => {
      if (!o || typeof o !== 'object') return;
      
      if (o.$ref && typeof o.$ref === 'string' && o.$ref.startsWith('#/')) {
        refs.push(o.$ref);
      }
      
      for (const key in o) {
        if (key !== '$ref') {
          traverse(o[key]);
        }
      }
    };
    
    traverse(obj);
    return [...new Set(refs)]; // Deduplicate
  };
  
  const allRefs = findAllRefs(schema);
  
  // Sort refs by path length (process deeper paths first)
  allRefs.sort((a, b) => b.length - a.length);
  
  // Generate unique names for schemas
  const usedNames = new Set<string>();
  const generateUniqueName = (refPath: string): string => {
    const parts = refPath.substring(2).split('/');
    
    // Handle definitions specially - preserve the name
    if (parts[0] === 'definitions') {
      return parts[1];
    }
    
    // Extract meaningful parts from the path
    const meaningfulParts: any[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      //@ts-ignore
      if (part !== 'properties' && !['anyOf', 'oneOf', 'allOf'].includes(part) && !part.match(/^\d+$/)) {
        meaningfulParts.push(part);
      }
    }
    
    let baseName = '';
    
    // If we have meaningful parts, use the last one as the base name
    if (meaningfulParts.length > 0) {
      baseName = meaningfulParts[meaningfulParts.length - 1];
    }
    
    // If we don't have a baseName yet, try to create one from structural elements
    if (!baseName) {
      // Find sequences like "anyOf/1" or similar structural patterns
      for (let i = 0; i < parts.length - 1; i++) {
        if (['anyOf', 'oneOf', 'allOf'].includes(parts[i]) && parts[i + 1].match(/^\d+$/)) {
          // If we have a previous named part, use that plus the structural info
          if (i > 0 && !['properties', 'anyOf', 'oneOf', 'allOf'].includes(parts[i - 1]) && !parts[i - 1].match(/^\d+$/)) {
            baseName = parts[i - 1] + parts[i].charAt(0).toUpperCase() + parts[i].slice(1) + parts[i + 1];
          } else {
            baseName = parts[i] + parts[i + 1];
          }
          break;
        }
      }
    }
    
    // Add 'Item' suffix if this is an array items schema
    if (parts.includes('items')) {
      // Find the nearest named part before 'items'
      const itemsIndex = parts.indexOf('items');
      let itemsBaseName = '';
      
      for (let i = itemsIndex - 1; i >= 0; i--) {
        if (parts[i] !== 'properties' && !['anyOf', 'oneOf', 'allOf'].includes(parts[i]) && !parts[i].match(/^\d+$/)) {
          itemsBaseName = parts[i];
          break;
        }
      }
      
      if (itemsBaseName) {
        if (itemsBaseName.endsWith('s')) {
          baseName = itemsBaseName.substring(0, itemsBaseName.length - 1) + 'Item';
        } else {
          baseName = itemsBaseName + 'Item';
        }
      } else if (baseName) {
        if (baseName.endsWith('s')) {
          baseName = baseName.substring(0, baseName.length - 1) + 'Item';
        } else {
          baseName = baseName + 'Item';
        }
      }
    }
    
    // Default name if nothing else worked
    if (!baseName) {
      baseName = 'schema';
    }
    
    // Ensure uniqueness
    let name = baseName;
    let counter = 1;
    while (usedNames.has(name)) {
      name = `${baseName}${counter}`;
      counter++;
    }
    
    usedNames.add(name);
    return name;
  };
  
  // Create mappings for all references
  for (const ref of allRefs) {
    const name = generateUniqueName(ref);
    refMap.set(ref, `#/$defs/${name}`);
    sourcesToConvert.set(ref, `#/$defs/${name}`);
  }
  
  // Extract schema at a path
  const getSchemaAtPath = (path: string): any => {
    if (!path.startsWith('#/')) return null;
    
    try {
      const pathParts = path.substring(2).split('/');
      let current = schema;
      
      for (const part of pathParts) {
        if (current === undefined || current === null) {
          return null;
        }
        
        // Try to handle numeric indices separately
        if (part.match(/^\d+$/)) {
          const index = parseInt(part, 10);
          // If current is an array and index is valid
          if (Array.isArray(current) && index < current.length) {
            current = current[index];
          } 
          // Otherwise treat it as a property name
          else if (typeof current === 'object' && part in current) {
            current = current[part];
          } 
          else {
            return null;
          }
        } 
        // Handle regular property access
        else if (typeof current === 'object' && part in current) {
          current = current[part];
        } 
        else {
          return null;
        }
      }
      
      return current ? JSON.parse(JSON.stringify(current)) : null;
    } catch (err) {
      return null;
    }
  };
  
  // Replace object at a path with a reference
  const replaceWithRef = (obj: any, path: string, refValue: string): void => {
    if (!path.startsWith('#/')) return;
    
    // Skip replacing $defs entries to preserve their original content
    if (path.startsWith('#/$defs/')) {
      return;
    }
    
    try {
      const pathParts = path.substring(2).split('/');
      
      // Handle top-level replacement
      if (pathParts.length === 1) {
        // Skip if this is a $defs entry
        if (pathParts[0] === '$defs') {
          return;
        }
        obj[pathParts[0]] = { $ref: refValue };
        return;
      }
      
      // Don't replace within $defs
      if (pathParts[0] === '$defs') {
        return;
      }
      
      // Navigate to parent object
      let current = obj;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        if (!current) return;
        
        if (part.match(/^\d+$/)) {
          const index = parseInt(part, 10);
          if (Array.isArray(current) && index < current.length) {
            current = current[index];
          } else if (typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            return;
          }
        } else {
          if (!(part in current)) {
            return;
          }
          current = current[part];
        }
      }
      
      // Replace object with reference in parent
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.match(/^\d+$/)) {
        const index = parseInt(lastPart, 10);
        if (Array.isArray(current) && index < current.length) {
          current[index] = { $ref: refValue };
        }
      } else {
        if (current && typeof current === 'object') {
          current[lastPart] = { $ref: refValue };
        }
      }
    } catch (err) {
      console.error(`Error replacing path ${path} with reference:`, err);
    }
  };
  
  // First add all schemas to $defs
  for (const [refPath, newRef] of refMap.entries()) {
    const defName = newRef.substring(8); // Remove "#/$defs/"
    const schemaToAdd = getSchemaAtPath(refPath);
    
    if (schemaToAdd) {
      // Add to $defs without updating references yet
      // If this key already exists in $defs, don't overwrite it
      if (!(defName in newSchema.$defs)) {
        newSchema.$defs[defName] = schemaToAdd;
      }
    }
  }
  
  // Update references in a schema
  const updateReferences = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Create a new object/array to avoid modifying the original
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    
    // Update $ref if present
    if (result.$ref && typeof result.$ref === 'string' && refMap.has(result.$ref)) {
      result.$ref = refMap.get(result.$ref);
    }
    
    // Update all properties
    for (const key in result) {
      if (key !== '$ref') { // Avoid double-processing $ref
        const value = result[key];
        if (Array.isArray(value)) {
          result[key] = value.map(item => updateReferences(item));
        } else if (value && typeof value === 'object') {
          result[key] = updateReferences(value);
        }
      }
    }
    
    return result;
  };
  
  // Update references in $defs without replacing objects with references
  for (const key in newSchema.$defs) {
    newSchema.$defs[key] = updateReferences(newSchema.$defs[key]);
  }
  
  // Update references in the main schema
  for (const key in newSchema) {
    if (key !== '$defs') {
      newSchema[key] = updateReferences(newSchema[key]);
    }
  }
  
  // Replace original objects with references to $defs
  for (const [sourcePath, newRef] of sourcesToConvert.entries()) {
    replaceWithRef(newSchema, sourcePath, newRef);
  }
  
  // Remove the original definitions section if it exists (since we've moved everything to $defs)
  if (newSchema.definitions) {
    delete newSchema.definitions;
  }
  
  return newSchema;
} 