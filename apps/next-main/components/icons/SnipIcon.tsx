import {ContentCut} from "@mui/icons-material";

type SnipIconProps = React.ComponentProps<typeof ContentCut>;

export function SnipIcon(props: SnipIconProps) {
  return <ContentCut {...props} />;
}
