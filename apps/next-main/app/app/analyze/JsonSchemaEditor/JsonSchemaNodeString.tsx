import React from "react";

import _ from "lodash";

import {Delete} from "@mui/icons-material";
import {
  IconButton,
  Stack,
} from "@mui/material";

import {JsonSchemaEditorPropertyHeader} from "./JsonSchemaEditorPropertyHeader";
import {JsonSchemaNodeProps} from "./JsonSchemaNodeProps";

export const JsonSchemaNodeString = ({
    currentSchema,
    updateSchema,
    updateOwnName,
    level = 0,
    title,
    deleteSelf
}: JsonSchemaNodeProps) => {
  const handleItemTypeChange = (event: any) => {
    const newType = event.target.value as any;
    updateSchema({
        ...currentSchema,
        type: newType,
    });
  };

  const type = currentSchema.type;

  if (type !== "string") {
    return <div>Invalid type when rendering String: '{type}' </div>;
  }

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
            <JsonSchemaEditorPropertyHeader
                title={title}
                type={type}
                level={level}
                updateOwnName={updateOwnName}
                handleItemTypeChange={handleItemTypeChange}
                description={currentSchema.description}
                updateDescription={(newDescription: string) => {
                    updateSchema({
                        ...currentSchema,
                        description: newDescription,
                    });
                }}
                rightSection={
                    <Stack direction={"row"} gap={1}>
                        <IconButton onClick={deleteSelf}>
                            <Delete/>
                        </IconButton>
                    </Stack>
                }
            /> 
        </Stack>
        {/* Conditionally render JsonSchemaNode for object or array types */}
      </Stack>
    </>
  );
};