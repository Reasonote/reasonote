import {
  Avatar,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {isEmoji} from "@reasonote/core";

export interface PersonaListEntryDumbProps {
    persona: {
        name: string;
        avatarContent?: string;
        description?: string;
    }
    disableDefaultAvatar?: boolean;
}


export function PersonaListEntryDumb({persona, disableDefaultAvatar}: PersonaListEntryDumbProps) {
    return <Grid container gridAutoFlow={'row'} gap={.5}>
        <Grid item xs={1} minWidth={'30px'}> 
            <Avatar sx={{ width: '30px', height: '30px' }}>
                {persona.avatarContent && isEmoji(persona.avatarContent.trim()) ? persona.avatarContent.trim() : disableDefaultAvatar ? '' : '🧒'}
            </Avatar>
        </Grid>
        <Grid item xs={10}>
            <Stack>
                <Typography variant="body1">
                    {persona.name}
                </Typography>
                {
                    persona.description && <Typography variant="caption">
                        {persona.description}
                    </Typography>
                }
            </Stack>
        </Grid>
    </Grid>
}