import {useState} from "react";

import {z} from "zod";

import {SuggestLearningTopicsFunction} from "@/components/chat/hooks/useChat";
import {SkillChip} from "@/components/chips/SkillChip/SkillChip";

import {
  ExpandLess,
  ExpandMore,
  KeyboardDoubleArrowDown,
} from "@mui/icons-material";
import {
  Card,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export type SuggestTopicsFunctionCall = {
  name: (typeof SuggestLearningTopicsFunction)["functionName"];
  arguments: z.infer<
    (typeof SuggestLearningTopicsFunction)["functionParameters"]
  >;
};

export interface SuggestTopicsMessageProps {
  i: number;
  call: SuggestTopicsFunctionCall;
}

export function SuggestTopicsMessage({ i, call }: SuggestTopicsMessageProps) {
  const isSmallDevice = useIsSmallDevice()
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const MIN_TOPICS = 3;
  const hasMoreTopics = call.arguments.topics.length > MIN_TOPICS;

  return (
    <Stack key={`msg-${i}`} gap={0.5}>
      <Grid
        key={"msg-message"}
        container
        justifyContent="flex-end"
        flexDirection={"column"}
      >
        <Grid width={"100%"}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.default,
              borderRadius: "8px",
              padding: isSmallDevice ? "9px" : "13px",
              maxWidth: "80%",
              height: "min-content",
              width: "max-content",
            }}
            elevation={4}
          >
            <Stack gap={1}>
              <Stack direction={'row'} alignItems={'center'}>
                <KeyboardDoubleArrowDown/>
                <Typography variant={"caption"}>
                  Dig Deeper
                </Typography>
              </Stack>
              <Grid container gap={1}>
                {/* {call.arguments.topics.map((topic, i) => {
                  return <SkillChip key={i} topicOrId={topic} />;
                })} */}
                {call.arguments.topics.slice(0, isExpanded ? undefined : MIN_TOPICS).map((topic, i) => {
                  return <SkillChip key={i} topicOrId={topic} />;
                })}
                {hasMoreTopics && !isExpanded && (
                  <IconButton
                    size={"small"}
                    onClick={() => setIsExpanded(true)}
                  >
                    <ExpandMore />
                  </IconButton>
                )}
                {
                  hasMoreTopics && isExpanded && (
                    <IconButton
                      size={"small"}
                      onClick={() => setIsExpanded(false)}
                    >
                      <ExpandLess />
                    </IconButton>
                  )
                }
              </Grid>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
