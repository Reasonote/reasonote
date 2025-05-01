import {
  PersonaListEntryDumb,
} from "@/components/personas/PersonaList/PersonaListEntryDumb";

import {EmojiPeople} from "@mui/icons-material";
import {
  Card,
  Grid,
  Stack,
  useTheme
} from "@mui/material";

import {RoleplayIntroCardBody} from "./RoleplayIntroCard/RoleplayIntroCardBody";
import {
  RoleplayIntroCardHeader,
} from "./RoleplayIntroCard/RoleplayIntroCardHeader";

interface CharacterDisplayProps {
  characters: Array<{
    name: string;
    emoji?: string;
    description?: string;
  }>;
}

export function CharacterDisplay({ characters }: CharacterDisplayProps) {
  const theme = useTheme();
  return (
    <Card elevation={10} sx={{p: 0}}>
      <Stack gap={1} sx={{ padding: 2}}>
        <RoleplayIntroCardHeader
          icon={<EmojiPeople sx={{ color: theme.palette.text.primary }} />}
          title={"Characters"}
          sx={{
            opacity: .8
          }}
        />

        <RoleplayIntroCardBody>
          <Grid container spacing={1} p={.5}>
            {characters.map((char) => (
              <Grid item xs={6} key={char.name}>
                <Card sx={{ backgroundColor: theme.palette.gray.dark }}>
                  <PersonaListEntryDumb
                    persona={{
                      name: char.name,
                      avatarContent: char.emoji,
                      description: char.description
                    }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </RoleplayIntroCardBody>
      </Stack>
    </Card>
  );
}