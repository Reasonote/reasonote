"use client";
import {
  Delete,
  Edit,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  ClickAwayListener,
  LinearProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import {grey} from "@mui/material/colors";
import {useBotFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import AutoAvatar from "../../users/profile/AutoAvatar";

interface ChatBotChipProps {
  botId: string;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUnselect: (id: string) => void;
  setEditingBotId: (id: string | null) => void;
  onBotDelete: (id: string) => void;
}

export function ChatBotChip({
  botId,
  isEditing,
  isSelected,
  setEditingBotId,
  onBotDelete,
  onSelect,
  onUnselect,
}: ChatBotChipProps) {
  const {
    data: bot,
    error: botError,
    loading: botLoading,
  } = useBotFlatFragLoader(botId);

  const handleClickAway = () => {
    onUnselect(botId);
  };

  if (botLoading) {
    return <LinearProgress />;
  }

  if (!bot) {
    return null;
  }

  if (botError) {
    return <Chip color="error" label="Error Loading" />;
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Tooltip placement={"top"} title={bot.description} enterDelay={1000}>
        <span>
          <Chip
            key={bot.id}
            avatar={
              <AutoAvatar
                name={bot.name}
                avatarProps={{
                  alt: bot.name ?? undefined,
                  sx: {
                    width: "20px",
                    height: "20px",
                    marginLeft: "5px",
                  },
                }}
              />
            }
            label={
              <Stack direction={"row"} alignItems={"center"} gap={1}>
                {bot.name}
                {isSelected && (
                  <>
                    <Button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (isEditing) {
                          setEditingBotId(null);
                        } else {
                          setEditingBotId(bot.id);
                        }
                      }}
                      sx={{
                        backgroundColor: isEditing ? grey["500"] : "primary",
                        color: isSelected
                          ? "primary.contrastText"
                          : "secondary.contrastText",
                        "&:hover": {
                          color: "white",
                          backgroundColor: grey["500"],
                        },
                        minWidth: "15px",
                        minHeight: "15px",
                        maxWidth: "40px",
                        maxHeight: "40px",
                      }}
                    >
                      <Edit
                        sx={{
                          width: "15px",
                          height: "15px",
                        }}
                      />
                    </Button>
                    <Button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onBotDelete(bot.id);
                      }}
                      sx={{
                        backgroundColor: isEditing ? grey["500"] : "primary",
                        color: isSelected
                          ? "primary.contrastText"
                          : "secondary.contrastText",
                        "&:hover": {
                          color: "white",
                          backgroundColor: grey["500"],
                        },
                        minWidth: "15px",
                        minHeight: "15px",
                        maxWidth: "40px",
                        maxHeight: "40px",
                      }}
                    >
                      <Delete
                        sx={{
                          width: "15px",
                          height: "15px",
                        }}
                      />
                    </Button>
                  </>
                )}
              </Stack>
            }
            color={isSelected ? "primary" : "primary"}
            onClick={() => {
              onSelect(bot.id);
              // TODO re-enable
              // if (isSelected) {
              //     setSelectedAuthorIds((s) => s.filter(said => said !== author.id))
              //     setMessageHistory((mh) => [...mh, { type: 'leave', authorName: author.name }])
              // } else {
              //     setSelectedAuthorIds((s) => [...s, author.id])
              //     setMessageHistory((mh) => [...mh, { type: 'enter', authorName: author.name }])
              // }
            }}
          />
        </span>
      </Tooltip>
    </ClickAwayListener>
  );
}
