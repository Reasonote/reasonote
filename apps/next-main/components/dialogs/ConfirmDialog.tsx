// ConfirmDialog.tsx
import React from "react";

import { Info, Warning } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  titleIcon?: React.ReactNode;
  title: string;
  details: React.ReactNode;
  consequences?: React.ReactNode;
  acceptText?: string;
  cancelText?: string;
  onAccept: () => void;
  onCancel: () => void;
  style?: {
    wrapper?: React.CSSProperties;
    title?: React.CSSProperties;
    details?: React.CSSProperties;
    consequences?: React.CSSProperties;
    acceptText?: React.CSSProperties;
    cancelText?: React.CSSProperties;
  };
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  titleIcon,
  title,
  details,
  consequences,
  acceptText = "Yes",
  cancelText = "No",
  onAccept,
  onCancel,
  style = {},
}) => {
  return (
    <Dialog open={open} onClose={onCancel} style={style.wrapper}>
      <DialogTitle style={style.title}>
        <Stack direction="row" gap={1} alignItems="center">
          {titleIcon ? (
            titleIcon
          ) : (
            <Avatar color="info">
              <Info />
            </Avatar>
          )}
          {title}
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {/* <Paper elevation={10} style={{ padding: '10px' }}> */}
        <Stack direction="column" gap={3}>
          {details}
          {consequences && (
            <DialogContentText style={style.consequences}>
              <Alert color="warning" icon={<Warning />}>
                {consequences}
              </Alert>
            </DialogContentText>
          )}
        </Stack>
        {/* </Paper> */}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onAccept}
          color="primary"
          style={{
            backgroundColor: "red",
            color: "white",
            ...style.acceptText,
          }}
        >
          {acceptText}
        </Button>
        <Button
          onClick={onCancel}
          color="primary"
          autoFocus
          style={{
            backgroundColor: "gray",
            color: "white",
            ...style.cancelText,
          }}
        >
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
