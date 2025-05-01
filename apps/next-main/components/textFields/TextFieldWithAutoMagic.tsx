import { AutoAwesome } from "@mui/icons-material";
import {
  IconButton,
  IconButtonProps,
  Stack,
  StackProps,
  TextField,
  TextFieldProps,
  Tooltip,
  TooltipProps,
} from "@mui/material";

export function TextFieldWithAutoMagic({
  autoMagicOnClick,
  textValue,
  textLabel,
  textOnChange,
  tooltipText,
  stackProps,
  textFieldProps,
  tooltipProps,
  iconButtonProps,
}: {
  tooltipText: string;
  autoMagicOnClick: (currentText: string) => any;
  textValue: string;
  textLabel: string;
  textOnChange: (event: React.ChangeEvent<HTMLInputElement>) => any;
  stackProps?: StackProps;
  textFieldProps?: TextFieldProps;
  tooltipProps?: TooltipProps;
  iconButtonProps?: IconButtonProps;
}) {
  return (
    <Stack direction={"row"} gap={1} alignItems={"center"} {...stackProps}>
      <TextField
        label={textLabel}
        fullWidth
        value={textValue}
        onChange={textOnChange}
        size={"medium"}
        {...textFieldProps}
      />
      <Tooltip title={tooltipText} {...tooltipProps}>
        <IconButton
          size={"small"}
          color={"secondary"}
          sx={{ height: "35px", width: "35px" }}
          {...iconButtonProps}
        >
          <AutoAwesome fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
