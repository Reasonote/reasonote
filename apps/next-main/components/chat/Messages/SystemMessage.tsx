import {useState} from "react";

import {useIsDebugMode} from "@/clientOnly/hooks/useIsDebugMode";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Card,
  Stack,
  Typography,
} from "@mui/material";
import {grey} from "@mui/material/colors";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export interface SystemMessageProps {
  msg: {
    content: string;
    context?: {
      contextId?: string | null;
      contextType?: string | null;
      contextData?: any | null;
    }
  };
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



export function SystemMessage(props: SystemMessageProps) {
  const isSmallDevice = useIsSmallDevice()
  const [collapsed, setCollapsed] = useState(true);
  const isAdmin = useIsDebugMode();

  return isAdmin ? collapsed ? (
    <Card
      sx={{
        color: grey[700],
        backgroundColor: "gray",
        borderRadius: "8px",
        maxWidth: "80%",
        padding: "3px",
        width: "max-content",
        cursor: "pointer",
      }}
      elevation={4}
    >
      <Typography
        variant="caption"
        align="right"
        fontStyle={"italic"}
        onClick={() => setCollapsed(false)}
      >
        System Message
      </Typography>
    </Card>
  ) : (
    <Stack
      justifyContent="start"
      alignContent={"start"}
      flexDirection="row"
      height={"max-content"}
      onClick={() => setCollapsed(true)}
    >
      <Card
        sx={{
          color: grey[700],
          backgroundColor: "gray",
          borderRadius: "8px",
          maxWidth: "80%",
          padding: isSmallDevice ? "9px" : "13px",
          width: "max-content",
        }}
        elevation={4}
      >
        <Typography
          variant="caption"
          align="left"
          fontStyle={"italic"}
          onClick={() => setCollapsed(false)}
        >
          System Message
        </Typography>
        <Typography variant="body1" align="left">
          <MuiMarkdownDefault>{props.msg.content}</MuiMarkdownDefault>
          <Typography variant="h4">Context</Typography>
          <MuiMarkdownDefault>
            {trimLines(`
            \`\`\`json
            ${JSON.stringify(props.msg.context, null, 2)}
            \`\`\`
            `)}
          </MuiMarkdownDefault>
        </Typography>
      </Card>
    </Stack>
  )
  :
  null;
}
