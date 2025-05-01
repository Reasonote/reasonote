import {Stack} from "@mui/material";

export function RoleplayIntroCardBody({ children }: { children: React.ReactNode }) {
  return (
    <Stack p={1}>
      {children}
    </Stack>
  );
}