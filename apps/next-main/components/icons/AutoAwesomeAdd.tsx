
import {
  AddCircle,
  AutoAwesome,
} from "@mui/icons-material";
import {
  Badge,
  Stack,
  useTheme,
} from "@mui/material";

import CircularProgressWrapper from "../progress/CircularProgressWrapper";

export type AutoAwesomeAddIconProps = React.ComponentProps<typeof AddCircle> & {
    generateDisabled?: boolean;
    isGenerating?: boolean;
};

export function AutoAwesomeAddIcon(
    { generateDisabled, isGenerating, ...rest}: AutoAwesomeAddIconProps
) {
    const theme = useTheme();
    return <div>
        <Badge
            badgeContent={
                <CircularProgressWrapper
                    disabled={!isGenerating}
                >
                    <AutoAwesome
                        sx={{
                        width: "15px",
                        height: "15px",
                        color:
                            generateDisabled
                                ? theme.palette.grey[400]
                                : undefined,
                        }}
                    />
                </CircularProgressWrapper>
            }
        >
            <Stack>
                <AddCircle {...rest} />
            </Stack>
        </Badge>
    </div>
}