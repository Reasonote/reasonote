import {
  Button,
  ButtonProps,
} from "@mui/material";

export function SWOTAnalysisButton({buttonOverrides}: {buttonOverrides?: ButtonProps}) {
    return <Button {...buttonOverrides}>
        SWOT Analysis
    </Button>
}