import {
  Handle,
  Position,
} from "reactflow";

import {Paper} from "@mui/material";

export function ConceptTreeNode({ data, id }: { data: any; id: string }) {
  return (
    <Paper sx={{ padding: "5px" }} elevation={10}>
      {data.label}

      {/* @ts-ignore */}
      <Handle type="target" position={Position.Top} id={id} />
      {/* @ts-ignore */}
      <Handle type="source" position={Position.Bottom} id={id} />
    </Paper>
  );
}
