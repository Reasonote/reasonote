export function isJsonSchemaLike(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  if ('isJsonSchema' in obj && obj.isJsonSchema) {
    return true;
  }

  let score = 0;
  const requiredScore = 3;

  const validTypes = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'];

  if ('$schema' in obj && typeof obj.$schema === 'string' && obj.$schema.includes('json-schema.org')) {
    score += 2;
  }

  if ('type' in obj && typeof obj.type === 'string' && validTypes.includes(obj.type)) {
    score++;
    
    // Check for nested structure
    if (obj.type === 'object' && 'properties' in obj && typeof obj.properties === 'object') {
      score++;
    } else if (obj.type === 'array' && 'items' in obj && typeof obj.items === 'object') {
      score++;
    }
  }

  if ('properties' in obj && typeof obj.properties === 'object') {
    score++;
  }

  if ('required' in obj && Array.isArray(obj.required)) {
    score++;
  }

  const schemaKeywords = ['allOf', 'anyOf', 'oneOf', 'not', '$ref', 'definitions'];
  for (const keyword of schemaKeywords) {
    if (keyword in obj) {
      score++;
    }
  }

  // Check for conflicting properties
  if (('properties' in obj && 'items' in obj) || ('allOf' in obj && 'anyOf' in obj)) {
    score--;
  }

  return score >= requiredScore;
}