import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {
  Chip,
  ChipProps,
} from "@mui/material";

export interface ActivityCountChipProps extends ChipProps {
    count: number;
    'data-testid'?: string;
}

export function ActivityCountChip({count, 'data-testid': testId, ...rest}: ActivityCountChipProps) {
    return <Chip 
        size={'small'} 
        avatar={<ActivityIcon/>} 
        label={`${count}`}
        variant="outlined"
        data-testid={testId}
        {...rest}
        sx={{
            width: 'max-content',
            ...rest.sx
        }}
    />
}