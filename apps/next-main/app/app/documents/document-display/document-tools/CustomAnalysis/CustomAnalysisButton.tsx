import {
  Button,
  ButtonProps,
} from "@mui/material";

export function CustomAnalysisButton({buttonOverrides}: {buttonOverrides?: ButtonProps}) {
    return <Button {...buttonOverrides}>
        Custom Analysis
    </Button>
}