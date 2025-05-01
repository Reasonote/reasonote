import React from "react";

import _ from "lodash";

import {Delete} from "@mui/icons-material";
import {
  IconButton,
  List,
  Stack,
} from "@mui/material";

import {JsonSchemaEditorPropertyHeader} from "./JsonSchemaEditorPropertyHeader";
import {JsonSchemaNode} from "./JsonSchemaNode";
import {JsonSchemaNodeProps} from "./JsonSchemaNodeProps";

export const JsonSchemaNodeArray = ({
    currentSchema,
    updateSchema,
    updateOwnName,
    level = 0,
    title,
    deleteSelf
}: JsonSchemaNodeProps) => {
  // Handle the case where items is not defined
  if (!currentSchema.items) {
    currentSchema.items = { type: "string" }; // Default to string type for new items
  }

  const handleItemTypeChange = (event: any) => {
    const newType = event.target.value as any;
    updateSchema({
        ...currentSchema,
        type: newType,
    });
  };

  const type = currentSchema.type;

  if (type !== "array") {
    return <div>Invalid type when rendering Array: '{type}' </div>;
  }

  const itemsSchema = currentSchema.items as any;
  const itemsType = itemsSchema.type;

  return (
    <>
      <Stack
        sx={{
          marginLeft: level * 3,
          borderLeft: "gray solid 1px",
          paddingLeft: "5px",
        }}
        direction="column"
      >
        <Stack direction="row" gap={2}>
            {/* Display the array title if provided */}
            <JsonSchemaEditorPropertyHeader
                title={title}
                type={type}
                description={currentSchema.description}
                startIcon={() => <List/>}
                level={level}
                updateOwnName={updateOwnName}
                handleItemTypeChange={handleItemTypeChange}
                updateDescription={(newDescription: string) => {
                    updateSchema({
                        ...currentSchema,
                        description: newDescription,
                    });
                }}
                rightSection={
                    <Stack direction={"column"} gap={1}>
                        <IconButton onClick={deleteSelf}>
                            <Delete/>
                        </IconButton>
                    </Stack>
                }
            /> 
        </Stack>
        {/* Conditionally render JsonSchemaNode for object or array types */}
      </Stack>
      {currentSchema.items && (
          <JsonSchemaNode
            currentSchema={currentSchema.items as any}
            updateSchema={(newSchema: any) => {
              const newCurrentSchema = _.cloneDeep(currentSchema);
              newCurrentSchema.items = newSchema;
              updateSchema(newCurrentSchema);
            }}
            deleteSelf={deleteSelf}
            updateOwnName={(newName: string) => {}}
            level={level + 1}
          />
        )}
    </>
  );
};