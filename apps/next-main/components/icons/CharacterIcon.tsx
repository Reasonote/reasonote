import {Person} from "@mui/icons-material";

type CharacterIconProps = React.ComponentProps<typeof Person>;

export function CharacterIcon(props: CharacterIconProps) {
    return <Person {...props} />;
}
  