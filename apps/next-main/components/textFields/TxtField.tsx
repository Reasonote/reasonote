import {
  InputAdornment,
  TextField,
  TextFieldProps,
} from "@mui/material";

export type TxtFieldProps = TextFieldProps & {
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
}


export function TxtField (props: TxtFieldProps) {
    const { startIcon, endIcon, ...restProps } = props;

    return <TextField 
        {...restProps}
        InputProps={{
            ...restProps.InputProps,
            startAdornment: startIcon ? 
                <InputAdornment 
                    sx={{
                        // alignSelf: 'start',
                        // paddingTop: '10px'
                    }}
                    position="start"
                >
                    {startIcon}
                </InputAdornment> 
                :
                undefined,
            endAdornment: endIcon ? <InputAdornment position="end">{endIcon}</InputAdornment> : undefined,
        }}
    />
}