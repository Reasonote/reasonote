import _ from "lodash";


import {
  Fade,
  Paper,
  PaperProps,
  Theme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {MessageWithAuthor} from "@reasonote/core";

import {
  ChatInnerComponent,
  ChatInnerComponentProps,
} from "./ChatInnerComponent";

export type MessageWithType = MessageWithAuthor & { type: "message" };

export type OverallMessage =
  | MessageWithType
  | { type: "enter"; authorName: string }
  | { type: "leave"; authorName: string };
export function isMessageWithType(m: OverallMessage): m is MessageWithType {
  return m.type === "message";
}

export interface ChatComponentProps extends ChatInnerComponentProps {
  chatId: string;
  divProps?: React.HTMLAttributes<HTMLDivElement>;
  paperProps?: PaperProps;
  disableFade?: boolean;
}

export function ChatComponent(props: ChatComponentProps) {
  const theme = useTheme();
  const isSmOrLowerDevice = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm")
  );

  const isMedOrLowerDevice = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );

  return (
    <Fade in={true} timeout={props.disableFade ? 0 : 750}>
      <div
        className="chat-outer"
        {...props.divProps}
        style={{
          display: "flex",
          flexGrow: 1,
          height: isSmOrLowerDevice ? 'calc(~"100dvh - 56px");' : "90vh",
          ...props.divProps?.style,
        }}
      >
        <Paper
          elevation={12}
          {...props.paperProps}
          sx={{
            flexGrow: 1,
            width: isMedOrLowerDevice ? "100vw" : theme.breakpoints.values.md,
            padding: "10px",
            ...props.paperProps?.sx,
          }}
        >
          <ChatInnerComponent {...props} />
        </Paper>
      </div>
    </Fade>
  );
}



