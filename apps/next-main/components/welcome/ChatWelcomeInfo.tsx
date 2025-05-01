"use client";
import {useState} from "react";

import {
  Autorenew,
  CenterFocusStrong,
  CheckBox,
  CheckBoxOutlineBlank,
  ExpandMore,
  Info,
  Send,
  Timer,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {useEffectDeepEqual} from "@reasonote/lib-utils-frontend";

import {AddPersonasStyled} from "../chat/AddPeople/AddPeopleButton";
import {OrderedList} from "../lists/OrderedList";
import {LinearProgressCountdown} from "../progress/LinearProgressCountdown";

interface ChatWelcomeInfoProps {
  showWelcomeMessage: boolean;
  onClose: () => void;
  stepStatuses: {
    topic: {
      status: "waiting" | "in-progress" | "complete";
    };
    addPersonas: {
      status: "waiting" | "in-progress" | "complete";
    };
    sendMessage: {
      status: "waiting" | "in-progress" | "complete";
    };
  };
}

const fadeInStyle = {
  animation: "fadeIn 5s ease-in-out",
};

export function ChatWelcomeInfo({
  showWelcomeMessage,
  onClose,
  stepStatuses,
}: ChatWelcomeInfoProps) {
  const [closingSoon, setClosingSoon] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [wasCompleteOnOpen, setWasCompleteOnOpen] = useState(false);

  useEffectDeepEqual(() => {
    // If we haven't rendered yet, we need to check if all of the items are complete and set our indicator.
    if (!hasRendered) {
      if (
        Object.values(stepStatuses).every((step) => step.status === "complete")
      ) {
        setWasCompleteOnOpen(true);
        setHasRendered(true);
        return;
      }
      setHasRendered(true);
    } else {
      // If the welcome message was complete on open, then we don't want to auto-close.
      if (wasCompleteOnOpen) {
        return;
      } else {
        // If all statuses are complete, set a timer to close the welcome message.
        if (
          Object.values(stepStatuses).every(
            (step) => step.status === "complete"
          )
        ) {
          setClosingSoon(true);
        }
      }
    }
  }, [stepStatuses]);

  const steps = stepStatuses;

  const showAddPersona = stepStatuses.topic.status === "complete";
  const showSendMessage = stepStatuses.addPersonas.status === "complete";

  const stepArr = [steps.topic, steps.addPersonas, steps.sendMessage];

  return (
    <Paper color={"info"} elevation={24}>
      <Stack padding={"10px"} direction={"row"} gap={2} alignItems="center">
        <Tooltip
          placement={"top"}
          title={showWelcomeMessage ? "Hide Info" : "Show Info"}
        >
          <span>
            <Button
              onClick={() => onClose()}
              size={"small"}
              sx={{ minWidth: "30px" }}
            >
              <Info color={"info"} />
            </Button>
          </span>
        </Tooltip>
        <Typography variant={"body1"} sx={{ fontSize: "1rem" }}>
          <b>Welcome to your new group chat!</b>
        </Typography>
      </Stack>
      <Stack style={{ ...fadeInStyle }}>
        <Divider />
        <OrderedList
          listStackProps={{
            sx: {
              listStyleType: "disc",
              fontSize: ".85rem",
              gap: 2,
              padding: 2,
            },
          }}
          listItemProps={{ gap: 1 }}
          marker={(item, idx) => (
            <>
              {stepArr[idx].status === "complete" ? (
                <CheckBox color="primary" />
              ) : (
                <CheckBoxOutlineBlank />
              )}{" "}
              <Typography
                variant="h6"
                style={{
                  color:
                    stepArr[idx].status === "complete" ? "gray" : undefined,
                }}
              >
                {idx + 1}
              </Typography>
            </>
          )}
        >
          <Stack direction="row">
            <Typography
              variant="body1"
              color={steps.topic.status === "complete" ? "gray" : undefined}
              style={{
                textDecoration:
                  steps.topic.status === "complete"
                    ? "line-through"
                    : undefined,
              }}
            >
              <b>
                Choose a{" "}
                <CenterFocusStrong sx={{ width: "1rem", height: "1rem" }} />{" "}
                Topic
              </b>{" "}
              for your group chat above.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            style={{ opacity: showAddPersona ? "100%" : "0%" }}
          >
            <Typography
              variant="body1"
              color={
                stepStatuses.addPersonas.status === "complete"
                  ? "gray"
                  : undefined
              }
              style={{
                textDecoration:
                  steps.addPersonas.status === "complete"
                    ? "line-through"
                    : undefined,
              }}
            >
              <b>Click</b> <AddPersonasStyled /> at the top to add chat
              partners.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            style={{ opacity: showSendMessage ? "100%" : "0%" }}
          >
            <Typography
              variant="body1"
              color={
                stepStatuses.sendMessage.status === "complete"
                  ? "gray"
                  : undefined
              }
              style={{
                textDecoration:
                  steps.sendMessage.status === "complete"
                    ? "line-through"
                    : undefined,
              }}
            >
              <Send sx={{ width: "1rem", height: "1rem" }} color={"primary"} />{" "}
              <b>Send</b> a message to the group.
            </Typography>
          </Stack>
        </OrderedList>

        {closingSoon && (
          <>
            <Typography textAlign="center">Happy Chatting 😊</Typography>
            <LinearProgressCountdown
              totalDuration={5000}
              direction="down"
              onEnd={onClose}
            />
          </>
        )}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            style={{ flexDirection: "row-reverse" }}
          >
            <Typography variant={"body2"}>More Info</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack gap={1}>
              <div>
                <Autorenew
                  sx={{ width: "1rem", height: "1rem" }}
                  color={"primary"}
                />{" "}
                <b>Generate</b> will prompt one of the participants to speak.
              </div>
              <div>
                <Timer
                  sx={{ width: "1rem", height: "1rem" }}
                  color={"primary"}
                />{" "}
                <b>Auto-Generate</b> will make the participants continue the
                conversation automatically. Try it!
              </div>
              <div>
                <Info sx={{ width: "1rem", height: "1rem" }} color={"info"} />{" "}
                <b>Info</b> will show you this message again.
              </div>
            </Stack>
          </AccordionDetails>
        </Accordion>
        {/* <li><div><Autorenew sx={{ width: '1rem', height: '1rem' }} /></div><Typography sx={{ fontSize: '.8rem' }}><i> <b>Generate</b> will generate messages for you when you click it.</i></Typography></li> */}
        {/* <li><div><Timer sx={{ width: '1rem', height: '1rem' }} /></div><Typography sx={{ fontSize: '.8rem' }}><i><b>Auto-Generate</b> will generate messages for you automatically, when enabled.</i></Typography></li> */}
      </Stack>
    </Paper>
  );
}
