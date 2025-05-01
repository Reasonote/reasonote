import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Txt} from "@/components/typography/Txt";
import {
  Card,
  CardProps,
  LinearProgress,
  Stack,
  useTheme,
} from "@mui/material";

interface ScreenLoaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  cardProps?: CardProps;
}

export function ScreenLoader({icon, title, subtitle, cardProps}: ScreenLoaderProps) {
  const theme = useTheme();
  const isSmallDevice = useIsSmallDevice();

  return (
    <Card 
      {...cardProps}
      sx={{ 
        width: isSmallDevice ? '100vw' : '80vw', 
        minWidth: '320px', 
        maxWidth: '600px', 
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: '10px', 
        padding: '20px', 
        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
        ...cardProps?.sx
      }}
    >
      <Stack width="100%">
        <Stack direction="row" gap={1}>
          {icon}
          <Stack>
            <Txt variant="body1" gutterBottom color={theme.palette.text.primary}>
              {title}
            </Txt>
            <Txt variant="body2" gutterBottom color={theme.palette.text.secondary}>
              {subtitle}
            </Txt>
          </Stack>
        </Stack>
        <LinearProgress />
      </Stack>
    </Card>
  );
} 