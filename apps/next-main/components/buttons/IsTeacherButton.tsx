import {School} from "@mui/icons-material";
import {Chip} from "@mui/material";

export function TeacherHeaderIndicator() {
    // TODO actually check if the user is currently in teacher mode
    // from their user settings
  const isTeacher = false;

  return isTeacher ? (
    <Chip icon={<School/>} label="Teacher" color="primary" />
  ) : null;
}