import { useMutation } from "@apollo/client";
import { PersonAdd } from "@mui/icons-material";
import { Avatar, Chip, useTheme } from "@mui/material";
import { purple } from "@mui/material/colors";
import { createBotFlatMutDoc } from "@reasonote/lib-sdk-apollo-client/src";
import { typedUuidV4 } from "@reasonote/lib-utils";

interface MagicPersonButtonProps {
  topic?: string;
  onPersonCreated?: (id: string) => void;
}

export function MagicPersonButton({
  topic,
  onPersonCreated,
}: MagicPersonButtonProps) {
  const [createBot] = useMutation(createBotFlatMutDoc);
  const theme = useTheme();
  
  return (
    <Chip
      key={"new-author-magic"}
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
      label={<b>Magic New Person</b>}
      sx={{
        // backgroundColor: purple['300'],
        color: theme.palette.text.primary,
        "&:hover": {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.purple.main,
        },
      }}
      onClick={async () => {
        // 1. Generate persona from topic

        // 2. Create persona
        const persona = {
          id: typedUuidV4("persona"),
          name: "New Persona",
          description: "",
          avatarUrl: "",
          prompt: "",
        };

        const res = await createBot({
          variables: {
            objects: [persona],
          },
        });

        const { data, errors } = res;

        if (errors && errors.length > 0) {
          console.error(`Error creating bot`, errors);
        } else {
          if (data && data.insertIntoBotCollection?.records?.length) {
            const newId = data.insertIntoBotCollection.records[0].id;
          }
        }
      }}
    />
  );
}
