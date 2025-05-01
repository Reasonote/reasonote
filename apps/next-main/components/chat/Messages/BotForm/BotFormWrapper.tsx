import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

import {
  Card,
  Grid,
  Stack,
  useTheme
} from "@mui/material";

export function BotFormWrapper({ children }: { children: React.ReactNode }) {
    const isSmallDevice = useIsSmallDevice()
    const theme = useTheme();
    return <Stack gap={0.5}>
        <Grid
            key={"msg-message"}
            container
            justifyContent="center"
            alignItems="center"
            flexDirection={"column"}
        >
            <Grid item sx={{
                maxWidth: isSmallDevice ? "95%" : "80%",
                height: "min-content",
                width: "max-content",
            }}>
                <Card
                    sx={{
                        backgroundColor: theme.palette.background.default,
                        borderRadius: "8px",
                        padding: isSmallDevice ? "9px" : "13px",
                        
                    }}
                    elevation={4}
                >
                    {children}
                </Card>
            </Grid>
        </Grid>
    </Stack>
}