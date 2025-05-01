import {
  describe,
  expect,
  it,
} from 'vitest';

import { jsonSchemaRefFixer } from './jsonSchemaRefFixer';

describe('jsonSchemaRefFixer', () => {
  it('should handle empty schema', () => {
    const emptySchema = {};
    const result = jsonSchemaRefFixer(emptySchema);
    
    expect(result).toEqual({
      $defs: {}
    });
  });
  
  it('should handle schema with no references', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };
    
    const result = jsonSchemaRefFixer(schema);
    
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      $defs: {}
    });
  });
  
  it('should move simple reference to $defs', () => {
    const schema = {
      type: 'object',
      properties: {
        person: { $ref: '#/definitions/person' },
        other: { type: 'string' }
      },
      definitions: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          }
        }
      }
    };
    
    const result = jsonSchemaRefFixer(schema);
    
    expect(result).toHaveProperty('$defs.person');
    expect(result.properties.person.$ref).toEqual('#/$defs/person');
    expect(result.$defs.person).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    });
    // Original definitions should be removed
    expect(result.definitions).toBeUndefined();
  });
  
  it('should handle nested references', () => {
    const schema = {
      type: 'object',
      properties: {
        user: { $ref: '#/definitions/user' }
      },
      definitions: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: { $ref: '#/definitions/address' }
          }
        },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' }
          }
        }
      }
    };
    
    const result = jsonSchemaRefFixer(schema);
    
    expect(result).toHaveProperty('$defs.user');
    expect(result).toHaveProperty('$defs.address');
    expect(result.properties.user.$ref).toEqual('#/$defs/user');
    expect(result.$defs.user.properties.address.$ref).toEqual('#/$defs/address');
    expect(result.definitions).toBeUndefined();
  });
  
  it('should handle array references', () => {
    const schema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/definitions/item' }
        }
      },
      definitions: {
        item: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' }
          }
        }
      }
    };
    
    const result = jsonSchemaRefFixer(schema);
    
    expect(result).toHaveProperty('$defs.item');
    expect(result.properties.items.items.$ref).toEqual('#/$defs/item');
    expect(result.definitions).toBeUndefined();
  });
  
  it('should handle schema that already has $defs', () => {
    const schema = {
      type: 'object',
      properties: {
        person: { $ref: '#/definitions/person' },
        task: { $ref: '#/$defs/task' }
      },
      definitions: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        }
      },
      $defs: {
        task: {
          type: 'object',
          properties: {
            description: { type: 'string' }
          }
        }
      }
    };
    
    const result = jsonSchemaRefFixer(schema);
    
    expect(result).toHaveProperty('$defs.person');
    expect(result).toHaveProperty('$defs.task');
    expect(result.properties.person.$ref).toEqual('#/$defs/person');
    expect(result.properties.task.$ref).toEqual('#/$defs/task');
    
    // Original $defs should be preserved
    expect(result.$defs.task).toEqual({
      type: 'object',
      properties: {
        description: { type: 'string' }
      }
    });
    
    // Original definitions should be removed
    expect(result.definitions).toBeUndefined();
  });
  
  it('should handle complex nested schema with multiple reference levels', () => {
    const schema = {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: { $ref: '#/definitions/step' }
        },
        final_answer: { type: 'string' }
      },
      definitions: {
        step: {
          type: 'object',
          properties: {
            explanation: { type: 'string' },
            output: { type: 'string' },
            substeps: {
              type: 'array',
              items: { $ref: '#/definitions/substep' }
            }
          },
          required: ['explanation', 'output']
        },
        substep: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            result: { 
              anyOf: [
                { type: 'string' },
                { $ref: '#/definitions/complexResult' }
              ]
            }
          }
        },
        complexResult: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            unit: { type: 'string' }
          }
        }
      }
    };
    
    const result = jsonSchemaRefFixer(schema);
    
    // Check that all references were moved to $defs
    expect(result).toHaveProperty('$defs.step');
    expect(result).toHaveProperty('$defs.substep');
    expect(result).toHaveProperty('$defs.complexResult');
    
    // Check references were updated
    expect(result.properties.steps.items.$ref).toEqual('#/$defs/step');
    expect(result.$defs.step.properties.substeps.items.$ref).toEqual('#/$defs/substep');
    
    // Check nested anyOf reference
    expect(result.$defs.substep.properties.result.anyOf[1].$ref).toEqual('#/$defs/complexResult');
    
    // Original definitions should be removed
    expect(result.definitions).toBeUndefined();
  });
  
  it('should generate unique names for schemas at the same path', () => {
    const schema = {
      type: 'object',
      properties: {
        user: {
          oneOf: [
            { $ref: '#/definitions/userType1' },
            { $ref: '#/definitions/userType2' }
          ]
        }
      },
      definitions: {
        userType1: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin'] }
          }
        },
        userType2: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string', enum: ['user'] }
          }
        }
      }
    };
    
    const result = jsonSchemaRefFixer(schema);
    
    // Check both user types are in $defs with unique names
    expect(result).toHaveProperty('$defs.userType1');
    expect(result).toHaveProperty('$defs.userType2');
    
    // Check references were updated
    expect(result.properties.user.oneOf[0].$ref).toEqual('#/$defs/userType1');
    expect(result.properties.user.oneOf[1].$ref).toEqual('#/$defs/userType2');
    
    // Original definitions should be removed
    expect(result.definitions).toBeUndefined();
  });

  it('should handle references to nested properties', () => {
    const schema = {
      type: 'object',
      properties: {
        activities: {
          type: 'object',
          properties: {
            item1: {
              anyOf: [
                { $ref: '#/properties/activities/properties/item1/anyOf/1' },
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    details: { type: 'object' }
                  }
                }
              ]
            }
          }
        }
      }
    };

    const result = jsonSchemaRefFixer(schema);
    
    // Find the $defs key that was actually generated
    const itemDef = Object.keys(result.$defs).find(key => 
      result.properties.activities.properties.item1.anyOf[0].$ref === `#/$defs/${key}`
    );
    
    // Expect that we have a definition and that the reference points to it
    expect(itemDef).toBeDefined();
    if (itemDef) {
      expect(result.properties.activities.properties.item1.anyOf[0].$ref).toEqual(`#/$defs/${itemDef}`);
      
      // Check that the referenced schema was correctly copied
      expect(result.$defs[itemDef]).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          details: { type: 'object' }
        }
      });
      
      // The original referenced item should now be a reference to the $defs entry
      expect(result.properties.activities.properties.item1.anyOf[1].$ref).toEqual(`#/$defs/${itemDef}`);
    }
  });

  it('should handle multiple references to the same nested property', () => {
    const schema = {
      type: 'object',
      properties: {
        activity1: {
          type: 'object',
          properties: {
            citation: { $ref: '#/properties/common/citation' }
          }
        },
        activity2: {
          type: 'object',
          properties: {
            citation: { $ref: '#/properties/common/citation' }
          }
        },
        common: {
          citation: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              page: { type: 'number' }
            }
          }
        }
      }
    };

    const result = jsonSchemaRefFixer(schema);
    
    // Find the $defs key that was actually generated
    const citationDef = Object.keys(result.$defs).find(key => 
      result.properties.activity1.properties.citation.$ref === `#/$defs/${key}`
    );
    
    // Expect that we have a definition and that the references point to it
    expect(citationDef).toBeDefined();
    if (citationDef) {
      expect(result.properties.activity1.properties.citation.$ref).toEqual(`#/$defs/${citationDef}`);
      expect(result.properties.activity2.properties.citation.$ref).toEqual(`#/$defs/${citationDef}`);
      
      // The original citation should also be replaced with a ref
      expect(result.properties.common.citation.$ref).toEqual(`#/$defs/${citationDef}`);
      
      // Check that the referenced schema was correctly copied
      expect(result.$defs[citationDef]).toEqual({
        type: 'object',
        properties: {
          source: { type: 'string' },
          page: { type: 'number' }
        }
      });
    }
  });

  it('should handle deeply nested references with multiple levels', () => {
    const schema = {
      type: 'object',
      properties: {
        activities: {
          type: 'object',
          properties: {
            "1": {
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    citations: {
                      anyOf: [
                        {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              docId: { type: 'string' },
                              startText: { type: 'string' },
                              endText: { type: 'string' }
                            }
                          }
                        },
                        { type: 'null' }
                      ]
                    }
                  }
                }
              ]
            },
            "2": {
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    citations: { $ref: '#/properties/activities/properties/1/anyOf/0/properties/citations' }
                  }
                }
              ]
            },
            "3": {
              type: 'object',
              properties: {
                citations: { $ref: '#/properties/activities/properties/1/anyOf/0/properties/citations' }
              }
            }
          }
        }
      }
    };

    const result = jsonSchemaRefFixer(schema);
    
    // Find the $defs key that was actually generated
    const citationsDef = Object.keys(result.$defs).find(key => 
      result.properties.activities.properties['2'].anyOf[0].properties.citations.$ref === `#/$defs/${key}`
    );
    
    // Expect that we have a definition and that the references point to it
    expect(citationsDef).toBeDefined();
    if (citationsDef) {
      // The original schema should now be a reference to the $defs entry
      expect(result.properties.activities.properties['1'].anyOf[0].properties.citations.$ref).toEqual(`#/$defs/${citationsDef}`);
      
      // The explicit references should also be updated
      expect(result.properties.activities.properties['2'].anyOf[0].properties.citations.$ref).toEqual(`#/$defs/${citationsDef}`);
      expect(result.properties.activities.properties['3'].properties.citations.$ref).toEqual(`#/$defs/${citationsDef}`);
      
      // The citations definition should have the correct structure
      expect(result.$defs[citationsDef]).toHaveProperty('anyOf');
      expect(result.$defs[citationsDef].anyOf).toHaveLength(2);
      expect(result.$defs[citationsDef].anyOf[0].type).toEqual('array');
    }
  });
}); 