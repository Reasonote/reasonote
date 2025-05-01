import {
  Lightbulb,
  ThumbDown,
  ThumbUp,
  Warning,
} from "@mui/icons-material";

export const swotConfigs = {
    strength: {
        icon: <ThumbUp />,
        title: 'Strengths'
    },
    weakness: {
        icon: <ThumbDown />,
        title: 'Weaknesses'
    },
    opportunity: {
        icon: <Lightbulb />,
        title: 'Opportunities'
    },
    threat: {
        icon: <Warning />,
        title: 'Threats'
    }
};