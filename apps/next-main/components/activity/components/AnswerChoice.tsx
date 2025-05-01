import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {
  CheckBoxOutlineBlank,
  CheckBoxOutlined,
  Dangerous,
} from "@mui/icons-material";
import {
  Badge,
  Card,
  Grid,
  Stack,
  useTheme,
} from "@mui/material";

export const AnswerChoice = ({
    answerChoice,
    isCorrectAnswer,
    isUserAnswer,
    isSelected,
    onSelectChange,
    isSmallDevice,
    answersSubmitted,
    animateTyping,
    boldStyle
  }: {
    answerChoice: string;
    isCorrectAnswer: boolean;
    isUserAnswer: boolean;
    isSelected: boolean;
    answersSubmitted: boolean;
    onSelectChange: (selected: boolean) => void;
    isSmallDevice: boolean;
    animateTyping?: boolean;
    boldStyle?: boolean;
  }) => {
    const theme = useTheme();
    const selectedIcon = answersSubmitted ? (
      <Badge
        badgeContent={
          isUserAnswer ? (
            <CurUserAvatar sx={{ height: "14px", width: "14px" }} />
          ) : undefined
        }
      >
        {isCorrectAnswer ? (
          <CheckBoxOutlined />
        ) : isUserAnswer ? (
          <Dangerous />
        ) : (
          <Dangerous />
        )}
      </Badge>
    ) : (
      isSelected ? (
      <Badge
        badgeContent={<CurUserAvatar sx={{ height: "14px", width: "14px" }} />}
      >
        <CheckBoxOutlined />
      </Badge>
    ) : (
      <CheckBoxOutlineBlank />
    ))

 
    const shouldBeFaded = answersSubmitted && !isCorrectAnswer && !isUserAnswer;
  
    const bgColor =
      answersSubmitted
        ? isCorrectAnswer
          ? isUserAnswer
            ? theme.palette.success.dark
            : theme.palette.success.dark
          : isUserAnswer
              ? theme.palette.error.dark
              : undefined
        : isSelected
          ? theme.palette.info.dark
          : undefined;
  
    return (
      <Grid item sx={{ width: "100%" }}>
        <Card
          elevation={shouldBeFaded ? 2 : 6}
          onClick={() => {
              onSelectChange(!isSelected);
          }}
          sx={{
            "&:hover": {
              transform: "scale(1.03)",
              filter: "brightness(1.2)",
            },
            transition: "transform .04s",
            cursor: "pointer",
            backgroundColor: bgColor,
            padding: "10px",
          }}
        >
          <Stack direction="row" gap={2}>
            <div>{selectedIcon}</div>
            <MuiMarkdownDefault
              animateTyping={animateTyping}
            >
              {
                boldStyle ? `<b>${answerChoice}</b>` : answerChoice
              }
            </MuiMarkdownDefault>
          </Stack>
        </Card>
      </Grid>
    );
  };