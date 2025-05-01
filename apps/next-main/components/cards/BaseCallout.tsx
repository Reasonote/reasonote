import {
  Paper,
  PaperProps,
  Stack,
} from "@mui/material";

interface BaseCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: JSX.Element;
  header: JSX.Element;
  elevation?: number;
  backgroundColor?: string;
  borderColor?: string;
  overrides?: {
    paper?: PaperProps;
  };
  sx?: {
    paper?: PaperProps["sx"];
  };
}

export function BaseCallout(props: BaseCalloutProps) {
  return (
    <Paper
      sx={{
        borderRadius: 2,
        padding: 1,
        elevation: props.elevation ?? 3,
        backgroundColor: props.backgroundColor,
        borderColor: props.borderColor,
        ...props.sx?.paper,
      }}
      {...props?.overrides?.paper}
    >
      <Stack direction="row" columnGap={1} alignItems={"center"}>
        <div
          style={{ 
            display: "flex",
            justifyItems: "start",
            alignItems: "center",
            alignContent: "center",
            justifyContent: "start",
          }}
        >
          {props.icon ? props.icon : <div></div>}
        </div>
        {props.header}
      </Stack>
      <div>{props.children}</div>
    </Paper>
  );
}
