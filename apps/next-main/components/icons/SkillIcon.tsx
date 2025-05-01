import { FitnessCenter } from "@mui/icons-material";

type SkillIconProps = React.ComponentProps<typeof FitnessCenter>;

export function SkillIcon(props: SkillIconProps) {
  return <FitnessCenter {...props} />;
}
