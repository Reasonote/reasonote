import React from "react";

import _ from "lodash";
import {
  JsonSchema7NumberType,
  JsonSchema7StringType,
} from "zod-to-json-schema";

import {JsonSchemaNodeArray} from "./JsonSchemaNodeArray";
import {JsonSchemaNodeNumber} from "./JsonSchemaNodeNumber";
import {JsonSchemaNodeObject} from "./JsonSchemaNodeObject";
import {JsonSchemaNodeProps} from "./JsonSchemaNodeProps";
import {JsonSchemaNodeString} from "./JsonSchemaNodeString";

export const JsonSchemaNode = (props: JsonSchemaNodeProps) => { 
    const currentSchema = props.currentSchema;

    if (currentSchema.type === "object") {
        return <JsonSchemaNodeObject
            {...props}
            currentSchema={currentSchema as any}
        />
    }
    else if (currentSchema.type === "array") {
        return <JsonSchemaNodeArray
            {...props}
            currentSchema={currentSchema as any}
        />
    } else if (currentSchema.type === "string") {
        return <JsonSchemaNodeString
            {...props}
            currentSchema={currentSchema as JsonSchema7StringType}
        />   
    } else if (currentSchema.type === "number") {
        return <JsonSchemaNodeNumber
            {...props}
            currentSchema={currentSchema as JsonSchema7NumberType}
        />   
    }

    return null;
}
