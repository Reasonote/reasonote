import {
  Chip,
  ChipProps,
  Typography,
} from "@mui/material";

const scoreToColor = (score: number) => {
    if(score > 80){
        return 'success'
    } else if(score > 60){
        return 'warning'
    } else {
        return 'error'
    }
}

export function Score0To100Chip({score, short, ...rest}: {score: number, short?: boolean} & ChipProps) {
    return <Chip 
        label={<Typography variant="caption">{score}{short ? '' : '/ 100'}</Typography>}
        color={scoreToColor(score)}
        {...rest}
    />
}