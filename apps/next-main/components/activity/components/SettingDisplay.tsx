import {Txt} from "@/components/typography/Txt";

import {PinDrop} from "@mui/icons-material";
import {
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {RoleplayIntroCardBody} from "./RoleplayIntroCard/RoleplayIntroCardBody";
import {
  RoleplayIntroCardHeader,
} from "./RoleplayIntroCard/RoleplayIntroCardHeader";

interface SettingDisplayProps {
  name: string;
  emoji: string;
  description: string;
}

export function SettingDisplay({ name, emoji, description }: SettingDisplayProps) {
  const theme = useTheme();
  return (
    <Card elevation={7} sx={{p: 0}}>
      <Stack gap={1} sx={{ padding: 2}}>
        <RoleplayIntroCardHeader
          icon={<PinDrop sx={{ color: theme.palette.text.primary }} />}
          title={"Setting"}
          sx={{
            opacity: .8
          }}
        /> 

        <RoleplayIntroCardBody>
          <Txt startIcon={emoji} variant="h6"> 
            {name}
          </Txt>

          <Typography variant="body1">
            {description}
          </Typography>
        </RoleplayIntroCardBody>
      </Stack>
    </Card>
  );
}