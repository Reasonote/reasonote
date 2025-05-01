import {
  CheckBox,
  CheckBoxOutlineBlank,
} from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardActionAreaProps,
  CardContent,
  CardContentProps,
  CardProps,
  Stack,
  Typography,
} from "@mui/material";

export function SimpleSelectableCard({
    title,
    subtitle,
    selected,
    onClick,
    slotProps,
    endItem,
  }: {
    title: string,
    subtitle?: string,
    selected: boolean,
    onClick: () => void,
    slotProps?: {
        cardActionArea?: CardActionAreaProps;
        cardProps?: CardProps;
        cardContentProps?: CardContentProps;
    },
    endItem?: React.ReactNode;
  }) {
    return <Card
        elevation={20}
        {...slotProps?.cardProps}
        sx={{
            borderRadius: "20px",
            backgroundColor: selected ? 'primary.main' : 'gray',
            ...slotProps?.cardProps?.sx,
        }}
    >
      <CardActionArea
        {...slotProps?.cardActionArea}
        sx={{ 
            borderRadius: "20px",
            padding: "0px",
            ...slotProps?.cardActionArea?.sx,
        }}
        onClick={onClick}
      >
        <CardContent {...slotProps?.cardContentProps}>
          <Stack justifyContent={'space-between'} direction={'row'} alignItems={'center'}>
            <Stack direction={'row'} gap={2}>
              {selected ? <CheckBox/> : <CheckBoxOutlineBlank/>}
              <Stack direction={"column"} gap={2}>
                <Typography variant={'body1'}>{title}</Typography>
                {subtitle ? <Typography variant={'body1'}>{subtitle}</Typography> : null}
              </Stack>
            </Stack>
            
            {
              endItem ? endItem : null
            }
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
}