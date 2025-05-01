import React, {useState} from "react";

import useThrottledCallback from "beautiful-react-hooks/useThrottledCallback";
import _, {
  Dictionary,
  toNumber,
} from "lodash";

import {Delete} from "@mui/icons-material";
import {
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface InProgressComparison {
  /** The COMPLETE original item. */
  original: Dictionary<any>;

  /** The proposed COMPLETE new item. */
  proposedChanges: Dictionary<any>;

  /** Changes that have been *tentatively* accepted by the user... but have not yet been committed.
   *
   * This defaults to `proposedChanges`, but entries can be modified by the user.
   *
   */
  stagedChanges: Dictionary<any>;

  /**
   * These are fields from the proposal that have been explicitly rejected by the user.
   */
  rejectedFields: (string | number)[][];
}

interface ComparisonFieldScalarProps<TScalar> {
  fieldName: string | number;
  oldFieldValue: TScalar;
  stagedFieldValue: TScalar;
  depth: number;
  onDelete?: () => void;
  /**
   * This is called whenever the user modifies a field in the comparison.
   * At time of writing, this should be the only way to modify the `stagedChanges` object.
   * @param path The path from the root object to this field.
   * @param newValue The new value of this field.
   * @returns
   */
  onModifyStaged?: (newValue: TScalar) => void;
}

interface ComparisonFieldProps {
  path: (string | number)[];
  fieldName: string | number;
  fieldValue: any;
  comparison: InProgressComparison;
  depth?: number;
  onDelete?: (path: (string | number)[]) => void;
  onModifyStaged?: (path: (string | number)[], newValue: any) => void;
}

/**
 * For comparing strings.
 */
const StringComparisonField: React.FC<ComparisonFieldScalarProps<string>> = ({
  depth,
  fieldName,
  stagedFieldValue,
  oldFieldValue,
  onDelete,
  onModifyStaged,
}) => {
  const [value, setValue] = useState(stagedFieldValue);

  const handleChange = useThrottledCallback(
    (newValue: string) => {
      onModifyStaged && onModifyStaged(newValue);
    },
    [onModifyStaged],
    1000,
    { leading: false }
  );

  return (
    <Stack
      paddingLeft={depth}
      flexDirection={"row"}
      gap={1}
      alignItems={"center"}
      justifyItems={"center"}
    >
      <div>
        {oldFieldValue ? (
          <TextField
            label={`${fieldName} (old)`}
            defaultValue={oldFieldValue}
            variant="outlined"
            size="small"
            disabled
            multiline
          />
        ) : (
          <Typography fontStyle={"italic"}>None</Typography>
        )}
      </div>
      <div>
        <TextField
          label={`${fieldName} (new)`}
          value={value}
          variant="outlined"
          size="small"
          onChange={(ev) => {
            setValue(ev.target.value);
            handleChange(ev.target.value);
          }}
          onBlur={() => setValue(stagedFieldValue)}
          multiline
        />
      </div>
      <IconButton size="small" onClick={() => onDelete && onDelete()}>
        <Delete fontSize="small" />
      </IconButton>
    </Stack>
  );
};

/**
 * For comparing numbers.
 */
const NumberComparisonField: React.FC<ComparisonFieldScalarProps<number>> = ({
  depth,
  fieldName,
  stagedFieldValue,
  oldFieldValue,
  onDelete,
  onModifyStaged,
}) => {
  const [value, setValue] = useState(stagedFieldValue);

  // useEffect(() => {
  //     setValue(stagedFieldValue);
  // }, [stagedFieldValue]);

  const handleChange = useThrottledCallback(
    (newValue: number) => {
      onModifyStaged && onModifyStaged(newValue);
    },
    [onModifyStaged],
    1000,
    { leading: false }
  );

  const handleBlur: React.FocusEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (p) => {
    onModifyStaged && onModifyStaged(toNumber(p.target.value));
  };

  return (
    <Stack
      paddingLeft={depth}
      flexDirection={"row"}
      gap={1}
      alignItems={"center"}
      justifyItems={"center"}
    >
      <div>
        {oldFieldValue ? (
          <TextField
            label={`${fieldName} (old)`}
            defaultValue={oldFieldValue}
            variant="outlined"
            size="small"
            disabled
            multiline
          />
        ) : (
          <Typography fontStyle={"italic"}>None</Typography>
        )}
      </div>
      <div>
        <TextField
          label={`${fieldName} (new)`}
          value={value}
          variant="outlined"
          size="small"
          onChange={(ev) => {
            setValue(toNumber(ev.target.value));
            handleChange(toNumber(ev.target.value));
          }}
          onBlur={handleBlur}
          multiline
        />
      </div>
      <IconButton size="small" onClick={() => onDelete && onDelete()}>
        <Delete fontSize="small" />
      </IconButton>
    </Stack>
  );
};

/**
 * For comparing lists.
 */
const ListComparisonField: React.FC<ComparisonFieldProps> = ({
  path = [],
  comparison,
  depth = 0,
  onDelete,
  onModifyStaged,
}) => {
  const fieldName = path[path.length - 1].toString();

  const newList = _.get(comparison.proposedChanges, path) ?? [];
  if (!Array.isArray(newList)) {
    console.warn(`Expected ${fieldName} to be an array, but it was not.`);
    return null;
  }

  // return (
  //   <Box paddingLeft={depth}>
  //     <div>
  //       {path.length > 0 ? (
  //         <Typography variant={"body1"}>{fieldName}</Typography>
  //       ) : null}

  //       {/* Render all children. */}
  //       {newList.map((item: any, index: number) => (
  //         <ComparisonItem
  //           key={index}
  //           fieldName={index}
  //           fieldValue={item}
  //           comparison={comparison}
  //           path={[...path, index]}
  //           onDelete={onDelete}
  //           onModifyStaged={onModifyStaged}
  //           depth={depth + 1}
  //         />
  //       ))}
  //     </div>
  //   </Box>
  // );
  return null;
};

/**
 * For comparing dictionary fields in a comparison.
 */
const DictionaryComparisonField: React.FC<ComparisonFieldProps> = ({
  path = [],
  comparison,
  depth = 0,
  onDelete,
  onModifyStaged,
}) => {
  // Name of this dictionary in the parent object.
  const fieldName = _.last(path)?.toString();

  // The proposed changes to this dictionary.
  const newDict =
    path.length > 0
      ? _.get(comparison.proposedChanges, path)
      : comparison.proposedChanges;
  if (typeof newDict !== "object") {
    console.warn(`Expected ${fieldName} to be an object, but it was not.`);
    return null;
  }

  return (
    null
    // <Box paddingLeft={depth}>
    //   {path.length > 0 ? (
    //     <Typography variant={"body1"}>{fieldName}</Typography>
    //   ) : null}
    //   {/* Render all children. */}
    //   {Object.keys(newDict).map((childKey, index) => (
    //     <ComparisonItem
    //       key={childKey}
    //       comparison={comparison}
    //       path={[...path, childKey]}
    //       fieldName={childKey}
    //       fieldValue={newDict[childKey]}
    //       onDelete={onDelete}
    //       onModifyStaged={onModifyStaged}
    //       depth={depth + 1}
    //     />
    //   ))}
    // </Box>
  );
};

export interface ComparisonItemProps {
  path: (string | number)[];
  fieldName: string | number;
  fieldValue: any;
  comparison: InProgressComparison;
  depth?: number;
  onDelete?: (path: (string | number)[]) => void;

  /**
   * This is called whenever the user modifies a field in the comparison.
   * At time of writing, this should be the only way to modify the `stagedChanges` object.
   * @param path The path from the root object to this field.
   * @param newValue The new value of this field.
   * @returns
   */
  onModifyStaged?: (path: (string | number)[], newValue: any) => void;
}

export const ComparisonItem: React.FC<ComparisonItemProps> = ({
  path,
  fieldName,
  fieldValue,
  comparison,
  depth,
  onDelete,
  onModifyStaged,
}) => {
  if (
    _.some(comparison.rejectedFields.map((fPath) => _.isEqual(path, fPath)))
  ) {
    return null;
  }

  const stagedFieldValue = _.get(comparison.stagedChanges, path);
  const oldFieldValue = _.get(comparison.original, path);

  return (
    <>
      {(() => {
        if (typeof fieldValue === "string") {
          return (
            <StringComparisonField
              key={fieldName}
              fieldName={fieldName}
              stagedFieldValue={stagedFieldValue}
              oldFieldValue={oldFieldValue}
              depth={depth ?? 0}
              onDelete={() => onDelete && onDelete(path)}
              onModifyStaged={(newVal) =>
                onModifyStaged && onModifyStaged(path, newVal)
              }
            />
          );
        } else if (typeof fieldValue === "number") {
          return (
            <NumberComparisonField
              key={fieldName}
              fieldName={fieldName}
              stagedFieldValue={stagedFieldValue}
              oldFieldValue={oldFieldValue}
              depth={depth ?? 0}
              onDelete={() => onDelete && onDelete(path)}
              onModifyStaged={(newVal) =>
                onModifyStaged && onModifyStaged(path, newVal)
              }
            />
          );
        } else if (Array.isArray(fieldValue)) {
          return (
            <ListComparisonField
              key={fieldName}
              path={path}
              fieldName={fieldName}
              fieldValue={fieldValue}
              comparison={comparison}
              depth={depth}
              onDelete={onDelete}
              onModifyStaged={onModifyStaged}
            />
          );
        } else if (typeof fieldValue === "object") {
          return (
            <DictionaryComparisonField
              key={fieldName}
              path={path}
              fieldName={fieldName}
              fieldValue={fieldValue}
              comparison={comparison}
              depth={depth}
              onDelete={onDelete}
              onModifyStaged={onModifyStaged}
            />
          );
        }
        return null;
      })()}
    </>
  );
};

export interface ComparisonCardProps {
  comparison: InProgressComparison;
  depth?: number;
  onDelete?: (path: (string | number)[]) => void;
  /**
   * This is called whenever the user modifies a field in the comparison.
   * At time of writing, this should be the only way to modify the `stagedChanges` object.
   * @param path The path from the root object to this field.
   * @param newValue The new value of this field.
   * @returns
   */
  onModifyStaged?: (path: (string | number)[], newValue: any) => void;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  comparison,
  depth = 0,
  onDelete,
  onModifyStaged,
}) => {
  // TODO: these are on parent component.
  //      TODO: On first render:
  //      1. Create the InProgressComparison object
  //      2. Use the InProgressComparison object to render the ComparisonCard

  //      TODO: When the user modifies a field, update the InProgressComparison's stagedChanges object at the right path.
  //      TODO: When the user rejects a field, update the InProgressComparison's rejectedFields array to include this path.

  return (
    <Stack
      gap={2}
      sx={{ margin: "5px", padding: "5px", borderLeft: "1px solid gray" }}
    >
      <ComparisonItem
        path={[]}
        fieldName={""}
        fieldValue={comparison.proposedChanges}
        comparison={comparison}
        depth={depth}
        onDelete={onDelete}
        onModifyStaged={onModifyStaged}
      />
    </Stack>
  );
};

export default ComparisonCard;
