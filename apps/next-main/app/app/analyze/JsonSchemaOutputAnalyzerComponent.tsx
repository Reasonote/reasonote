import React, {useState} from "react";

import {JSONSchema7} from "json-schema";
import _ from "lodash";

import {
  Button,
  Divider,
  Stack,
  TextField,
} from "@mui/material";

import {JsonSchemaNode} from "./JsonSchemaEditor/JsonSchemaNode";

type Props = {
  currentSchema: JSONSchema7;
  updateSchema: (newSchema: JSONSchema7) => any;
  level?: number;
  title?: string;
};


const OldJsonSchemaOutputAnalyzerComponent: React.FC<Props> = ({
  currentSchema,
  updateSchema,
  level = 0,
  title
}) => {
  const [tempPropertyName, setTempPropertyName] = useState<string>("");

  const updateProperty = (propName: string, changes: Partial<JSONSchema7>) => {
    const newSchema = _.cloneDeep(currentSchema);

    if (newSchema.type === "object") {
      if (!newSchema.properties) {
        newSchema.properties = {};
      }
      
      const newProp = newSchema.properties[propName];

      //@ts-ignore
      newSchema.properties[propName] = { ...newProp, ...changes };
    }
    else if (newSchema.type === "array") {
      const newProp = newSchema.items as JSONSchema7;
      //@ts-ignore
      newSchema.items = { ...newProp, ...changes };
    }


    updateSchema(newSchema);
  };

  const updatePropertyName = (oldName: string, newName: string) => {
    const newSchema = _.cloneDeep(currentSchema);
    if (!newSchema.properties) {
      newSchema.properties = {};
    }
    newSchema.properties[newName] = newSchema.properties[oldName];
    delete newSchema.properties[oldName];
    updateSchema(newSchema);
  };

  const addNewProperty = () => {
    const newSchema = _.cloneDeep(currentSchema);
    if (!newSchema.properties) {
      newSchema.properties = {};
    }
    newSchema.properties[tempPropertyName] = {
      type: "string",
      description: "",
    };
    setTempPropertyName("");
    updateSchema(newSchema);
  };


  // We have two jobs:
  // 1. Render ourself.
  // 2. Render our children.
  const thisName = currentSchema.title ?? title ?? "";
  const thisType = currentSchema.type;

  return (
    <>
      {/* Render ourself */}
      <Stack
        sx={{
          marginLeft: level * 3,
          borderLeft: "gray solid 1px",
          paddingLeft: "5px",
        }}
        direction={"column"}
        gap={3}
      >
        <Stack direction={"row"} gap={2}>
          <TextField
            size="small"
            label={"Property Name"}
            defaultValue={thisName}
            onBlur={(e) => {
              updatePropertyName(thisName, e.target.value);
            }}
          />
          {/* <Select
            size="small"
            value={thisType}
            onChange={(e) =>
              updateProperty(propName, {
                type: e.target.value as JSONSchema7TypeName,
              })
            }
          >
            <MenuItem value={"string"}>String</MenuItem>
            <MenuItem value={"number"}>Number</MenuItem>
            <MenuItem value={"object"}>Object</MenuItem>
            <MenuItem value={"array"}>Array</MenuItem>
          </Select> */}
        </Stack>
      </Stack>
    
      <Stack
        sx={{
          marginLeft: level * 3,
          borderLeft: "gray solid 1px",
          paddingLeft: "5px",
        }}
        direction={"column"}
        gap={3}
      >
        {
          currentSchema.type === 'object' ? _.entries(currentSchema.properties || {}).map(
          ([propName, propSchema]) => {
            if (!_.isBoolean(propSchema)) {
              return (
                <Stack direction={"column"} gap={3}>
                  <Stack direction={"column"} key={propName} gap={2}>
                    

                    <TextField
                      size="small"
                      multiline
                      label={"Description"}
                      defaultValue={propSchema.description || ""}
                      onBlur={(e) => {
                        updateProperty(propName, {
                          description: e.target.value,
                        });
                      }}
                    />
                    <Divider />
                  </Stack>

                  {(propSchema.type === "object" ||
                    propSchema.type === "array") && (
                    <JsonSchemaOutputAnalyzerComponent
                      currentSchema={propSchema}
                      updateSchema={(newSchema: any) =>
                        updateProperty(propName, newSchema)
                      }
                      level={level + 1}
                    />
                  )}
                </Stack>
              );
            }
          }
        )
        : null
      }
      {
        currentSchema.type === 'array' ? 
        <JsonSchemaOutputAnalyzerComponent
          currentSchema={currentSchema.items as JSONSchema7}
          updateSchema={(newSchema: any) => updateProperty('items', newSchema)}
          level={level + 1}
        />
        : null
      }


        <Button onClick={addNewProperty}>New Item</Button>
      </Stack>
    </>
  );
};

export function JsonSchemaOutputAnalyzerComponent(props: any) {
  return <Stack direction={"column"} gap={1}>
      <JsonSchemaNode 
        // currentSchema={undefined}
        // updateSchema={function (newSchema: any) {
        //   throw new Error("Function not implemented.");
        // } }
        // updateOwnName={function (newName: string) {
        //   throw new Error("Function not implemented.");
        // } }
        updateOwnName={() => {}}
        deleteSelf={() => {}}
        currentSchema={props.currentSchema}
        updateSchema={props.updateSchema}
        level={props.level}
      />
    </Stack>
}

export default JsonSchemaOutputAnalyzerComponent;
