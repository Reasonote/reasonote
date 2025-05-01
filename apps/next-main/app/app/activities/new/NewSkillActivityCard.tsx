import {ReactNode} from "react";


import {ArrowForwardIos} from "@mui/icons-material";
import {
  Avatar,
  Card,
  CardActionArea,
  CardActionAreaProps,
  CardContent,
  CardProps,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

interface NewSkillActivityTypeCardProps {
    title: string | ReactNode;
    subtitle?: string | ReactNode;
    onClick: () => void;
    avatar?: ReactNode;
    cardProps?: CardProps;
    cardActionAreaProps?: CardActionAreaProps;
}


export function NewSkillActivityTypeCardProps({ onClick, ...props }: NewSkillActivityTypeCardProps) {
    const isSmallDevice = useIsSmallDevice();

    return <Card {...props.cardProps} elevation={20} sx={{ 
        borderRadius: "20px", 
        transition: "background-color 0.5s ease",
        ...props.cardProps?.sx
    }} color="primary" >
        <CardActionArea
            sx={{ 
                ...props.cardActionAreaProps?.sx,
                borderRadius: "20px", padding: "0px" 
            }}
            onClick={() => onClick()}
            {...props.cardActionAreaProps}
        >
            <CardContent>
                <Grid container alignItems={'center'} justifyItems={'center'} alignContent={'space-between'} gap={.5}>
                    <Grid item xs={11}>
                        <Stack direction={"column"} gap={2}>
                            <Stack direction={"row"} gap={2}>
                                <Avatar>
                                    {props.avatar}
                                </Avatar>

                                {
                                    typeof props.title === "string" ?
                                        <Typography variant={isSmallDevice ? "h6" : "h5"}>
                                            {props.title}
                                        </Typography>
                                        :
                                        props.title
                                }
                            </Stack>
                            {props.subtitle && <Typography variant="body1">{props.subtitle}</Typography>}
                        </Stack>
                    </Grid>
                    <Grid item xs={.5} alignContent={'center'} justifyContent={'center'}>
                        <div>
                            <ArrowForwardIos fontSize="medium"/>
                        </div>
                    </Grid>
                </Grid>
            </CardContent>
        </CardActionArea>
    </Card>
}