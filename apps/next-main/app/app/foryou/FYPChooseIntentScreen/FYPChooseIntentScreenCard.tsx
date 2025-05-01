import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {GradientCard} from "@/components/cards/GradientCard";

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
  useTheme,
} from "@mui/material";

interface FYPChooseIntentScreenCardProps {
    title: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    onClick: () => void;
    avatar?: React.ReactNode;
    cardProps?: CardProps;
    cardActionAreaProps?: CardActionAreaProps;
    variant?: "v0" | "v1";
}

export function FYPChooseIntentScreenCardV1({ onClick, ...props }: FYPChooseIntentScreenCardProps & {variant: 'v1'}) {
    const theme = useTheme();
    return <GradientCard onClick={onClick}>
        <div className="flex items-center mb-4">
                <span className="text-3xl mr-2">{props.avatar}</span>
                <h2 className="text-xl font-bold" style={{color: theme.palette.text.primary}}>{props.title}</h2>
        </div>
        <></>
    </GradientCard>
}

export function FYPChooseIntentScreenCard({ variant, ...props }: FYPChooseIntentScreenCardProps) {
    return variant === "v1" ? <FYPChooseIntentScreenCardV1 {...props} variant="v1" /> : <FYPChooseIntentScreenCardV0 {...props} />
}


export function FYPChooseIntentScreenCardV0({ onClick, ...props }: FYPChooseIntentScreenCardProps) {
    const isSmallDevice = useIsSmallDevice();

    return <Card {...props.cardProps} elevation={20} sx={{ 
        borderRadius: "20px", 
        transition: "background-color 0.1s ease",
        p: 0,
        ...props.cardProps?.sx,
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