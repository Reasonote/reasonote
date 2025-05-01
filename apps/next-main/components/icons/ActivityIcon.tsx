import {Games} from "@mui/icons-material";

type ActivityIconProps = React.ComponentProps<typeof Games>;

export function ActivityIcon(props: ActivityIconProps) {
  return <Games {...props} />;
}
