import {ScreenLoader} from "@/components/loaders/ScreenLoader";

import {getLearningModes, LearningMode} from "./LearningModes";
import { useTheme } from "@mui/material";

export default function ExperiencePickedLoader({mode}: {mode: LearningMode['experience']}) {
  const theme = useTheme();
  const selectedMode = getLearningModes(theme).find(m => m.experience === mode);
  
  return (
    <ScreenLoader
      icon={selectedMode?.icon}
      title={selectedMode?.loadingText ?? ''}
      subtitle={selectedMode?.loadingSubText ?? ''}
    />
  );
}