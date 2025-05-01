import {
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";

import FullCenter from "../positioning/FullCenter";

export function TransitionCentered({
  transitionName,
}: {
  transitionName: string;
}) {
  return (
    <FullCenter>
      <Paper sx={{ borderRadius: "10px", padding: "20px" }}>
        <Typography variant={"h6"}>{transitionName}</Typography>
        <LinearProgress />
      </Paper>
    </FullCenter>
  );
}
