import {Send} from "@mui/icons-material";
import {
  Button,
  ButtonProps,
  Grid,
  TextField,
  TextFieldProps,
  Tooltip,
} from "@mui/material";

export interface ChatTextFieldProps {
    textFieldProps?: TextFieldProps;
    buttonProps?: ButtonProps;
    placeholder?: string;
    tooltipDisabledText?: string;
    tooltipEnabledText?: string;
    text: string;
    setText: (text: string) => void;
    sendButtonClick: (text: string) => void;
    textSendIsDisabled: boolean;
    onKeyUp: (ev: React.KeyboardEvent<HTMLDivElement>) => void;
}


export function ChatTextField(props: ChatTextFieldProps){
    return <Grid
        justifySelf="flex-end"
        justifyContent="flex-end"
        container
        padding="5px"
        alignContent="center"
        alignItems="center"
        justifyItems="center"
        width="100%"
    >
        <Grid xs={10.5}>
        <TextField 
            id="outlined-basic"
            fullWidth
            multiline={true}
            variant="outlined"
            value={props.text}
            placeholder={props.placeholder ?? 'Type a message...'}
            onChange={(ev) => props.setText(ev.target.value)}
            onKeyUp={props.onKeyUp}
            {...props.textFieldProps}
        />
        </Grid>
        <Grid
            container
            xs={1.5}
            alignItems={"center"}
            justifyItems={"center"}
            alignContent={"center"}
            justifyContent={"center"}
            >
            <Tooltip
                placement={"top"}
                title={
                    props.textSendIsDisabled
                        ? "Write a Message to Send"
                        : "Send Your Message"
                }
            >
                <span>
                <Button
                    disabled={props.textSendIsDisabled}
                    onClick={() => props.sendButtonClick(props.text)}
                    fullWidth={false}
                    centerRipple
                    {
                        ...(props.buttonProps || {})
                    }
                >
                    <Send />
                </Button>
                </span>
            </Tooltip>
        </Grid>
    </Grid>
}