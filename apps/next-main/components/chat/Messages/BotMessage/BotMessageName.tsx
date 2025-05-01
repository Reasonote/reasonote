import {Edit} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Button,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {grey} from "@mui/material/colors";

export function BotMessageHeader({ isAuthorStillInChat, persona, overrideIcon, overrideToolbar, usingName, usingEmoji, isEditingAuthor, setEditingAuthorId, disableEditing, isThinking, thinkingIcon }: { 
  isAuthorStillInChat?: boolean, 
  persona: any, 
  overrideIcon?: React.ReactNode, 
  overrideToolbar?: React.ReactNode, 
  usingName?: string | null, 
  usingEmoji: React.ReactNode, 
  isEditingAuthor?: boolean, 
  setEditingAuthorId?: (id: string | null) => void, 
  disableEditing?: boolean,
  isThinking?: boolean,
  thinkingIcon?: React.ReactNode,
}) {
  const theme = useTheme();

  return <Stack
    key={"msg-header"}
    justifyContent="start"
    alignContent={"center"}
    alignItems={"center"}
    flexDirection="row"
    gap={2}
    height={"max-content"}
  >
    <Badge
      color={isAuthorStillInChat ? "primary" : "default"}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      overlap={"circular"}
      variant={"dot"}
    >
      {/* {
            overrideIcon ?
              <Avatar
                sx={{ width: 24, height: 24, color: theme.palette.grey[100]}}
              >
                {overrideIcon}
              </Avatar>
              :
              <AutoAvatar
                name={usingName}
                avatarProps={{
                  alt: usingName ?? undefined,
                  // this should ensure that if we have an override avatar url, it will be used.
                  //src: persona?.avatarUrl ?? undefined,
                  sx: { width: 24, height: 24 },
                }}
              />
          } */}
      <Avatar sx={{ width: 24, height: 24, padding: '15px', color: theme.palette.grey[100] }}>
        {overrideIcon ? overrideIcon : usingEmoji}
      </Avatar>
    </Badge>
    <Typography color={theme.palette.grey[600]}>{usingName}</Typography>
    {
      overrideToolbar ? overrideToolbar : null
    }
    {isThinking ? thinkingIcon ?? null : null}
    {disableEditing ? null : (
      <Button
        onClick={(ev) => {
          ev.stopPropagation();
          if (isEditingAuthor) {
            setEditingAuthorId?.(null);
          } else {
            setEditingAuthorId?.(persona?.id ?? null);
          }
        }}
        sx={{
          backgroundColor: isEditingAuthor ? grey["500"] : "primary",
          color: isAuthorStillInChat ? "primary" : "secondary",
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
        <Edit sx={{ width: "15px", height: "15px" }} />
      </Button>
    )}
  </Stack>
}