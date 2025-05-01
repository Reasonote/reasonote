import React, { useMemo } from "react";

import { applyPatch, Operation as JSONPatchOperation } from "fast-json-patch";
import _, { Dictionary } from "lodash";

import { Stack } from "@mui/material";

import { ComparisonItem } from "./ComparisonCard";

export interface InProgressComparisonV2 {
  /** The COMPLETE original item. */
  original: Dictionary<any>;

  /**
   * Changes applied to the original item.
   */
  changes: {
    /**
     * Changes proposed by the system.
     */
    proposed: JSONPatchOperation[];
    /**
     * Changes that the user makes to the proposals by the system.
     * These are applied AFTER the proposed changes.
     *
     *
     * This could also include a full reversion of everything in the proposed section.
     * This is not the most space / time performant way to do this.
     *
     * TODO-OPTIMIZABLE
     **/
    userEdits?: JSONPatchOperation[];
  };
}

interface ComparisonCardV2Props {
  comparison: InProgressComparisonV2;
  depth?: number;
  /**
   * The user has determined to perform an edit
   * @param op
   * @returns
   */
  onUserEditOp?: (op: JSONPatchOperation) => void;
}

export const ComparisonCardV2: React.FC<ComparisonCardV2Props> = ({
  comparison,
  depth = 0,
  onUserEditOp,
}) => {
  // We create the object which is the result of applying the changes in order.
  // We do this because it's easier to recurse over an existing object...
  const resultObj = useMemo(() => {
    const theRes = _.cloneDeep(comparison.original);

    return applyPatch(
      theRes,
      [...comparison.changes.proposed, ...(comparison.changes.userEdits ?? [])],
      false,
      false
    ).newDocument;
  }, [JSON.stringify(comparison.original), JSON.stringify(comparison.changes)]);

  return (
    <Stack
      gap={2}
      sx={{ margin: "5px", padding: "5px", borderLeft: "1px solid gray" }}
    >
      <ComparisonItem
        path={[]}
        fieldName={""}
        fieldValue={resultObj}
        comparison={{
          original: comparison.original,
          proposedChanges: resultObj,
          stagedChanges: resultObj,
          rejectedFields: [],
        }}
        depth={depth}
        onDelete={(path: (string | number)[]) => {
          // TODO: unset this value.
          // onUserEditOp && onUserEditOp({
          //     path: jsonPatchPath,
          //     op: ''
          // })
        }}
        onModifyStaged={(path, value) => {
          // TODO: we have to update to turn into a JSONPatch.
          const jsonPatchPath = `/${path.map((p) => p.toString()).join("/")}`;

          onUserEditOp &&
            onUserEditOp({
              path: jsonPatchPath,
              op: "replace",
              value: value,
            });
        }}
      />
    </Stack>
  );
};

export default ComparisonCardV2;
