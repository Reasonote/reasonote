import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {JSONSchema7} from "json-schema";
import _ from "lodash";
import {
  JsonSchema7ObjectType,
  JsonSchema7Type,
} from "zod-to-json-schema";

import {
  notEmpty,
  typedUuidV4,
} from "@lukebechtel/lab-ts-utils";
import {
  AddCircle,
  Delete,
} from "@mui/icons-material";
import {
  Button,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";

import {JsonSchemaEditorPropertyHeader} from "./JsonSchemaEditorPropertyHeader";
import {JsonSchemaNode} from "./JsonSchemaNode";
import {JsonSchemaNodeProps} from "./JsonSchemaNodeProps";

type JsonSchema7TypeExtended = JsonSchema7Type & {
  displayOrder?: number;
  uniqId?: string;
};

type JsonSchema7ObjectTypeExtended = JsonSchema7ObjectType & {
  description?: string,
  properties: Record<string, JsonSchema7TypeExtended>;
};


export const JsonSchemaNodeObject = ({
  currentSchema,
  updateSchema,
  updateOwnName,
  deleteSelf,
  level = 0,
  title
}: Omit<Omit<JsonSchemaNodeProps, 'currentSchema'>, 'updateSchema'> & {
  currentSchema: JsonSchema7ObjectTypeExtended;
  updateSchema: (newSchema: JsonSchema7ObjectTypeExtended) => any;
}
) => {
  // Ensure properties object exists to prevent runtime errors
  if (!currentSchema.properties) {
    currentSchema.properties = {};
  }
  const theme = useTheme();

  const updateChildProperty = useCallback((propName: string, changes: Partial<JSONSchema7>) => {
    const newSchema = _.cloneDeep(currentSchema);
    const oldProperty = newSchema.properties![propName] as any;
    newSchema.properties![propName] = { ...oldProperty, ...changes };
    updateSchema(newSchema);
  }, [currentSchema, updateSchema]);

  const updateChildPropertyName = useCallback((oldName: string, newName: string) => {
    // Get the index of the key in the properties object
    const keys = Object.keys(currentSchema.properties!);
    const index = keys.indexOf(oldName);
    
    // Now, create a list of tuples of the form [key, value] for the properties
    // Overwrite the correct index
    const newProperties = keys.map((key, i) => {
      if (i === index) {
        return [newName, currentSchema.properties![oldName]];
      }
      return [key, currentSchema.properties![key]];
    });

    const newSchema = _.cloneDeep(currentSchema);
    
    // Convert the list of tuples back to an object
    newSchema.properties = Object.fromEntries(newProperties);

    console.log({newSchema, currentSchema, oldName, newName})
    updateSchema(newSchema);
  }, [currentSchema, updateSchema]);

  // Function to add a new child property with a unique key
  const addNewChildProperty = useCallback(() => {
    const newSchema = _.cloneDeep(currentSchema);
    const uniqueKey = `newProperty_${Object.keys(newSchema.properties!).length}`;
    newSchema.properties![uniqueKey] = {
      type: "string",
      description: "",
    };
    updateSchema(newSchema);
  }, [currentSchema, updateSchema]);

  // Improved type safety for the type update
  const handleTypeChange = (event: any) => {
    const newType = event.target.value as any;
    if (["string", "number", "object", "array"].includes(newType)) {
      updateSchema({ ...currentSchema, type: newType });
    }
  };

  const [lastPropertiesChecked, setLastPropertiesChecked] = useState<Record<string, JsonSchema7TypeExtended>>({});

  useEffect(() => {
    // Go through all the properties. If they don't have a `displayOrder` property, set it to the current index.
    const properties = currentSchema.properties!;

    // Don't check again if same.
    if (_.isEqual(properties, lastPropertiesChecked)) {
      return;
    }

    setLastPropertiesChecked(properties);

    var anyIncomplete = false;
    var anyDuplicateOrders = false;
    var displayOrdersSeen: number[] = [];

    Object.entries(properties).forEach(([key, value], index) => {
      const thisDisplayOrder = value.displayOrder;
      const thisUniqId = value.uniqId;
      if (!notEmpty(thisUniqId) || !notEmpty(thisDisplayOrder)) {
        anyIncomplete = true;
      }
      else {
        if (displayOrdersSeen.includes(thisDisplayOrder)) {
          anyDuplicateOrders = true;
        }

        displayOrdersSeen.push(thisDisplayOrder);
      }
    });

    if (!anyIncomplete && !anyDuplicateOrders) {
      return;
    }

    console.log({anyIncomplete, anyDuplicateOrders})

    var propertiesOrderedInitial = Object.entries(properties).sort((a, b) => {
      const aOrder = a[1]?.displayOrder ?? Number.MAX_VALUE;
      const bOrder = b[1]?.displayOrder ?? Number.MAX_VALUE;
      return aOrder - bOrder;
    });

    // Do all our properties have a displayOrder? If not, we need to update the schema.
    const propertiesWithOrder: any[] = propertiesOrderedInitial.map(([key, value], index) => {
      // Rewrite all display orders.
      // Anything that doesn't have a display order will be at the end because of the previous sort.
      value.displayOrder = index;
      
      if (!value.uniqId){
        value.uniqId = typedUuidV4('jsonobj');
      }

      return [key, value] as const;
    });

    const sortedProperties = propertiesWithOrder.sort((a, b) => a[1].displayOrder! - b[1].displayOrder!);

    // Now, if we made any changes, we need to call the update function
    
    console.log("UPDATING")
    updateSchema({
      ...currentSchema,
      properties: Object.fromEntries(sortedProperties),
    });
  }, [currentSchema.properties]);


  const orderedProperties = Object.entries(currentSchema.properties).sort((a, b) => {
    const aOrder = a[1].displayOrder ?? 0;
    const bOrder = b[1].displayOrder ?? 0;
    return aOrder - bOrder;
  });

  return (
    <>
      <Stack
        sx={{
          marginLeft: level * 3,
          borderLeft: "gray solid 1px",
          paddingLeft: "5px",
          // width: "100%",
        }}
        direction={"column"}
        // gap={3}
      >
        <Stack direction={"row"} gap={2}>
          <JsonSchemaEditorPropertyHeader
              title={title}
              type={'object'}
              level={level}
              updateOwnName={updateOwnName}
              handleItemTypeChange={handleTypeChange}
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
        
      </Stack>
      {/* Add Button for adding new child property */}
      <Stack
        sx={{
          marginLeft: (level + 1) * 3,
          paddingLeft: "5px",
          borderLeft: "gray solid 1px",
          // width: "100%",
          paddingY: '10px'
        }}
        direction={"column"}
      >
        <div>
          {/* <IconButton onClick={addNewChildProperty}>
            <AddCircle/>
          </IconButton> */}
          <Button onClick={addNewChildProperty} startIcon={<AddCircle/>} sx={{color: theme.palette.text.primary}}>
            Add Field
          </Button>
        </div>
      </Stack>
      
      {
        orderedProperties.map(([propName, propSchema]: [string, any], index) => {
          // Added key prop to prevent React key warning
          return (
              <JsonSchemaNode
                key={propSchema.uniqId ?? propName}
                currentSchema={propSchema}
                updateSchema={(newSchema: any) => {
                  updateChildProperty(propName, newSchema);
                }}
                deleteSelf={() => {
                  const newSchema = _.cloneDeep(currentSchema);
                  delete newSchema.properties![propName];
                  updateSchema(newSchema);
                }}
                updateOwnName={(newName) => {
                  updateChildPropertyName(propName, newName);
                }}
                level={level + 1}
                title={propName}
              />
          );
        })
      }
    </>
  );
}