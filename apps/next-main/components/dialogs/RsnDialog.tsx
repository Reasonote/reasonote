import RsnErrorBoundary from "@/clientOnly/error/RsnErrorBoundary";
import {
  Close as CloseIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogProps,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

interface RsnDialogProps extends DialogProps {
  onClose: () => void;
}

function DialogErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Stack spacing={3} alignItems="center" sx={{ p: 4 }}>
      <ErrorIcon color="error" sx={{ fontSize: 48 }} />
      <Typography variant="h6" align="center">
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        {error.message}
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={resetErrorBoundary}>
          Try Again
        </Button>
        <Button variant="contained" color="error" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </Stack>
    </Stack>
  );
}

export default function RsnDialog({ children, onClose, ...dialogProps }: RsnDialogProps) {
  return (
    <Dialog
      {...dialogProps}
      onClose={onClose}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
          zIndex: 1
        }}
      >
        <CloseIcon />
      </IconButton>

      <RsnErrorBoundary
        fallback={DialogErrorFallback}
        onReset={() => {
          // Clear any error state in the parent component if needed
          onClose();
        }}
      >
        {children}
      </RsnErrorBoundary>
    </Dialog>
  );
} 