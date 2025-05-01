import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {Send} from "@mui/icons-material";
import {
  Card,
  Typography,
  useTheme,
} from "@mui/material";
import {grey} from "@mui/material/colors";

export interface SuggestedNextMessageProps {
    i: number;
    msg: string;
    sendMessage: (message: string) => void;
}

export default function SuggestedNextMessage({i, msg, sendMessage}: SuggestedNextMessageProps) {
    const isSmallDevice = useIsSmallDevice()
    const theme = useTheme();

    return (
        <Card
            onClick={() => sendMessage(msg)}
            sx={{
                color: grey[50],
                backgroundColor: theme.palette.primary.main,
                borderRadius: "8px",
                height: "100%",
                minHeight: "70px",
                width: "100%",
                border: '1px dashed rgba(255, 255, 255, 0.5)',
                opacity: 0.75,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.02)',
                    boxShadow: theme.shadows[3],
                    backgroundColor: theme.palette.primary.dark,
                }
            }}
            elevation={1}
        >
            <Send 
                fontSize="small" 
                sx={{ 
                    position: 'absolute', 
                    top: '3px', 
                    right: '3px', 
                    opacity: 0.5, 
                    width: '12px', 
                    height: '12px',
                    color: grey[50],
                    zIndex: 3
                }} 
            />
            <Typography 
                variant="body2" 
                align="left"
                sx={{
                    padding: isSmallDevice ? "5px 8px" : "8px 12px",
                    paddingRight: "18px",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    fontWeight: 400,
                    fontSize: isSmallDevice ? '0.75rem' : '0.8rem',
                    lineHeight: 1.4,
                }}
            >
                {msg}
            </Typography>
        </Card>
    );
}