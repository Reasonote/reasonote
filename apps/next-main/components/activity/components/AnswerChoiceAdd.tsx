import {useState} from "react";

import {Txt} from "@/components/typography/Txt";

import {Add} from "@mui/icons-material";
import {
  Card,
  Grid,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";

export const AnswerChoiceAdd = ({
    primaryText,
    secondaryText,
    onAddChoice,
    placeholder,
  }: {
    primaryText: string;
    secondaryText?: string;
    placeholder?: string;
    onAddChoice: (choice: string) => void;
  }) => {
    const theme = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [choiceText, setChoiceText] = useState("");

    const icon = (<Add />);
  
    return (
      <Grid item sx={{ width: "100%" }}>
        <Card
          elevation={6}
          onClick={() => setIsEditing(true)}
          sx={{
            "&:hover": {
              transform: "scale(1.03)",
              filter: "brightness(1.2)",
            },
            transition: "transform .04s",
            cursor: "pointer",
            backgroundColor: theme.palette.gray.dark,
            padding: "10px",
          }}
        >
          {isEditing ? (
            <TextField
              autoFocus
              value={choiceText}
              placeholder={placeholder}
              onChange={(e) => setChoiceText(e.target.value)}
              onBlur={() => {
                if (choiceText.trim().length > 0) {
                  onAddChoice(choiceText.trim());
                }
                setIsEditing(false);
                setChoiceText("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (choiceText.trim().length > 0) {
                    onAddChoice(choiceText.trim());
                  }
                  setIsEditing(false);
                  setChoiceText("");
                }
              }}
              fullWidth
            />
          ) : (
            <Stack direction="row" gap={2}>
              <div>{icon}</div>
              <div>
                <Txt variant="body2">{primaryText}</Txt>
                {secondaryText && (
                  <Txt variant="caption">
                    {secondaryText}
                  </Txt>
                )}
              </div>
            </Stack>
          )}
        </Card>
      </Grid>
    );
  };