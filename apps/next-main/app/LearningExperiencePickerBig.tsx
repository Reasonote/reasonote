import {
  useCallback,
  useState,
} from "react";

import {Waves} from "lucide-react";

import {Txt} from "@/components/typography/Txt";
import {
  Headphones,
  School,
} from "@mui/icons-material";
import {
  Card,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {ExperienceCard} from "./ExperienceCardBig";
import {getLearningModes} from "./LearningModes";

// New components
export const LearningExperiencePickerBig = ({ onExperiencePicked, onClose }) => {
    const theme = useTheme();
    const LearningModes = getLearningModes(theme);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [loadingIcon, setLoadingIcon] = useState<React.ReactNode | null>(null);
  
    const handleExperiencePick = useCallback(async (experience: 'classroom' | 'podcast' | 'practice') => {
      if (isLoading) return; // Prevent multiple clicks
  
      setIsLoading(true);
      let text = '';
      let icon: React.ReactNode | null = null;
      switch (experience) {
        case 'classroom':
          text = 'Setting up your interactive classroom...';
          icon = <School sx={{ fontSize: 45 }} />;
          break;
        case 'podcast':
          text = 'Preparing your AI podcast...';
          icon = <Headphones sx={{ fontSize: 45 }} />;
          break;
        case 'practice':
          text = 'Initializing Practice Mode...';
          icon = <Waves size={45} />;
          break;
      }
      setLoadingText(text);
      setLoadingIcon(icon);
      // Call the onExperiencePicked function
      await onExperiencePicked(experience);
    }, [onExperiencePicked, isLoading]);
  
    return isLoading ? (
          <Card>
            <Stack width="100%" maxWidth={400} >
              <Stack direction="row" gap={1}>
                {loadingIcon}
                <Stack>
                  <Txt variant="body1" gutterBottom color={theme.palette.text.primary}>
                    {loadingText}
                  </Txt>
                  <Txt variant="body2" gutterBottom color={theme.palette.text.secondary}>
                    This should only take a few seconds...
                  </Txt>
                </Stack>
              </Stack>
              <LinearProgress />
            </Stack>
          </Card>
        ) : ( 
          <Stack spacing={2} alignItems="center" width="100%" maxWidth="800px" onClick={() => onClose()}>
            <Typography variant={'h4'} gutterBottom>Choose Your Learning Experience</Typography>
            <Grid container gap={1} justifyContent="center">
              <ExperienceCard
                icon={<School sx={{ fontSize: 60, mb: 2 }} />}
                title="Classroom"
                description="Learn in an interactive classroom"
                onClick={(event) => {
                  event.stopPropagation();
                  handleExperiencePick('classroom');
                }}
                backgroundColor={LearningModes.find(m => m.experience === 'classroom')?.backgroundColor}
                cardProps={{}}
              />
              <ExperienceCard
                icon={<Headphones sx={{ fontSize: 60, mb: 2 }} />}
                title="Podcast"
                description="Learn via an interactive podcast"
                backgroundColor={LearningModes.find(m => m.experience === 'podcast')?.backgroundColor}
                onClick={(event) => {
                  event.stopPropagation();
                  handleExperiencePick('podcast');
                }}
                cardProps={{}}
              />
              <ExperienceCard
                icon={<Waves size={60} style={{ marginBottom: '20px' }} />}
                backgroundColor={LearningModes.find(m => m.experience === 'practice')?.backgroundColor}
                title="Practice Mode"
                description="Infinite activities, generated just for you"
                onClick={(event) => {
                  event.stopPropagation();
                  handleExperiencePick('practice');
                }}
                cardProps={{}}
              />
            </Grid>
          </Stack>
      )
  };