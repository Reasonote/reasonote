import { useMutation } from "@apollo/client";
import { PersonAdd } from "@mui/icons-material";
import { Avatar, useTheme } from "@mui/material";
import Chip from "@mui/material/Chip/Chip";
import { purple } from "@mui/material/colors";
import { createBotFlatMutDoc } from "@reasonote/lib-sdk-apollo-client/src";
import { typedUuidV4 } from "@reasonote/lib-utils";

interface CreatePersonButtonProps {
  setEditingAuthorId: (id: string | null) => void;
}

export default function CreatePersonButton({
  setEditingAuthorId,
}: CreatePersonButtonProps) {
  const [createBot] = useMutation(createBotFlatMutDoc);
  const theme = useTheme();
  return (
    <Chip
      variant="outlined"
      key={"new-author"}
      avatar={
        <Avatar sx={{ backgroundColor: theme.palette.text.primary }}>
          <PersonAdd
            sx={{
              width: "15px",
              height: "15px",
              color: theme.palette.purple.main,
            }}
          />
        </Avatar>
      }
      label={<b>Create New Person</b>}
      sx={{
        color: theme.palette.text.primary,
        "&:hover": {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.purple.main,
        },
      }}
      onClick={async () => {
        const persona = {
          id: typedUuidV4("persona"),
          name: "New Persona",
          description: "",
          avatarUrl: "",
          prompt: "",
        };

        await createBot({
          variables: {
            objects: [persona],
          },
        });

        setEditingAuthorId(persona.id);
      }}
    />
  );
}
