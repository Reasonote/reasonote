import {GoalPursuitIcon} from "@/components/icons/GoalPursuitIcon";

import {Star} from "@mui/icons-material";
import {
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {RoleplayIntroCardBody} from "./RoleplayIntroCard/RoleplayIntroCardBody";
import {
  RoleplayIntroCardHeader,
} from "./RoleplayIntroCard/RoleplayIntroCardHeader";

interface Goal {
  objectiveName: string;
  objectiveDescription: string;
}

interface GoalDisplayProps {
  goals: Goal[];
}

export function GoalDisplay({ goals }: GoalDisplayProps) {
  const theme = useTheme();
  return (
    <Stack gap={1} sx={{ backgroundColor: theme.palette.info.main, padding: 2, borderRadius: 2 }}>
      <RoleplayIntroCardHeader
        icon={<Star sx={{ color: theme.palette.text.primary }} />}
        title={goals.length > 1 ? 'Your Goals' : 'Your Goal'}
      />
      <RoleplayIntroCardBody>
        {goals.map((goal) => (
          <Grid container gridAutoFlow={'row'} gap={.5} key={goal.objectiveName}>
            <ListItem sx={{ p: 0 }} alignItems={'flex-start'}>
              <ListItemIcon>
                <GoalPursuitIcon />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body1" fontWeight={'bold'}>
                  {goal.objectiveName}
                </Typography>
                <Typography variant="caption" fontWeight={'bold'}>
                  {goal.objectiveDescription}
                </Typography>
              </ListItemText>
            </ListItem>
          </Grid>
        ))}
      </RoleplayIntroCardBody>
    </Stack>
  );
}