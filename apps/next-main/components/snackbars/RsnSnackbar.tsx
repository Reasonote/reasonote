import {Close} from "@mui/icons-material";
import {
  IconButton,
  Snackbar,
  SnackbarProps,
  Stack,
} from "@mui/material";

import {LinearProgressCountdown} from "../progress/LinearProgressCountdown";

export interface RsnSnackbarProps extends SnackbarProps {
    disableCountdown?: boolean;
    disableClose?: boolean;
    onClose?: (event: React.SyntheticEvent<any, Event> | Event | null, reason: string) => void;
}

export function RsnSnackbar({disableCountdown, disableClose, ...props}: RsnSnackbarProps){

    const duration = props.autoHideDuration ?? 6000;

    return <Snackbar
        {...props}
        autoHideDuration={duration}
        message={
            <Stack gap={1}>
                {props.message}
                {
                    disableCountdown ?
                        null
                        :
                        <LinearProgressCountdown
                            totalDuration={duration}
                            direction="down"
                        />
                }
            </Stack>
        }
        action={
            disableClose ?
                null
                :
                <IconButton 
                    color="primary"
                    onClick={() => {
                        props.onClose?.(null, "clickaway");
                    }}
                >
                    <Close/>
                </IconButton> 
        }
    />
}