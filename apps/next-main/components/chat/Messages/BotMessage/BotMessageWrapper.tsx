import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

import {
  Card,
  Grid,
  Stack,
  useTheme
} from "@mui/material";

export function BotMessageWrapper({ children }: { children: React.ReactNode }) {
    const isSmallDevice = useIsSmallDevice()
    const theme = useTheme();
    return <Stack gap={0.5}>
        <Grid
            key={"msg-message"}
            container
            justifyContent="flex-start"
            flexDirection={"column"}
        >
            <Grid width={"100%"}>
                <Card
                    sx={{
                        backgroundColor: theme.palette.background.default,
                        borderRadius: "8px",
                        padding: isSmallDevice ? "9px" : "13px",
                        maxWidth: "80%",
                        height: "min-content",
                        width: "max-content",
                    }}
                    elevation={4}
                >
                    {children}
                </Card>
            </Grid>
        </Grid>
    </Stack>
}