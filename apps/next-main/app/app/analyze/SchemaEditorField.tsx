import React from "react";

import {TxtField} from "@/components/textFields/TxtField";
import {Button} from "@mui/material";

const SchemaEditorField = ({
  schema,
  updateSchema,
  path = '',
  level = 0,
  textfieldProps = {},
  dropdownProps = {},
}) => {
  // Helper to update schema properties based on the path
  const handleUpdate = (newValue) => {
    const pathParts = path.split('.').filter(Boolean);
    let newSchema = { ...schema };

    let schemaPart = newSchema;
    for (let i = 0; i < pathParts.length - 1; i++) {
      schemaPart = schemaPart[pathParts[i]];
    }

    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      schemaPart[lastPart] = newValue;
    } else {
      newSchema = newValue;
    }

    updateSchema(newSchema);
  };

  const renderFieldBasedOnType = (key, propSchema, propPath, fieldLevel) => {
    const commonProps = {
      size: 'small' as const,
      ...textfieldProps,
      onBlur: (e) => handleUpdate({ ...propSchema, description: e.target.value }),
    };

    switch (propSchema.type) {
      case 'string':
      case 'number':
        return (
          <TxtField
            {...commonProps}
            label={key}
            defaultValue={propSchema.description || ''}
          />
        );
      case 'object':
      case 'array':
        // Placeholder for complex types, adjust as needed
        return (
          <div style={{ marginLeft: `${level * 20}px` }}>
            <Button onClick={() => {}}>Edit {key}</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {Object.entries(schema.properties || {}).map(([key, propSchema], index) => (
        <React.Fragment key={index}>
          {renderFieldBasedOnType(key, propSchema, `${path}.${key}`, level)}
        </React.Fragment>
      ))}
      <Button onClick={() => {/* logic to add new property */}}>Add Property</Button>
    </>
  );
};

export default SchemaEditorField;