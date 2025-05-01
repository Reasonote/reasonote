import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {
  Avatar,
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {grey} from "@mui/material/colors";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export interface UserMessageProps {
  msg: {
    content: string;
  };
  overrideIcon?: React.ReactNode;
  overrideName?: string;
}

function TextFormatted(props: { text: string }) {
  const regex = /@\[(.+?)\]\((.+?)\)/g;

  const parts = props.text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        // For every 3rd element in the array (index starting at 0), we replace with an anchor tag
        if (index % 3 === 0) {
          return part;
        } else if (index % 3 === 1) {
          return (
            <a key={index} href={parts[index + 1]}>
              {part}
            </a>
          );
        } else {
          // We don't want to output anything for the URL parts
          return null;
        }
      })}
    </span>
  );
}

export function UserMessage({msg, overrideIcon, overrideName}: UserMessageProps) {
  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();

  return (
    <Stack
      justifyContent="end"
      alignContent={"end"}
      alignItems={'end'}
      flexDirection="column"
      height={"max-content"}
      gap={1}
    >
      {
        <Stack
          key={"msg-header"}
          justifyContent="start"
          alignContent={"center"}
          alignItems={"center"}
          flexDirection="row"
          gap={2}
          height={"max-content"}
        >
        {
          overrideIcon ?
            <Avatar
              sx={{ width: 24, height: 24, color: theme.palette.grey[100]}}
            >
              {overrideIcon}
            </Avatar>
            :
            null
        } 
        {
          overrideName ?
            <Typography color={theme.palette.grey[600]}>{overrideName}</Typography>
            :
            null
        }
        </Stack>
      }
      <Card
        sx={{
          color: grey[50],
          backgroundColor: theme.palette.primary.main,
          borderRadius: "8px",
          maxWidth: "80%",
          padding: isSmallDevice ? "9px" : "13px",
          width: "max-content",
          height: 'min-content',
          '& p': {
            height: 'min-content',
            margin: 0
          }
        }}
        elevation={4}
      >
        {/* <Typography variant="body1" align="left" sx={{}}> */}
          <MuiMarkdownDefault>{msg.content}</MuiMarkdownDefault>
          {/* <TextFormatted text={msg.content} /> */}
        {/* </Typography> */}
      </Card>
    </Stack>
  );
}
