'use client'
import React, {useState} from "react";

import {EmailSendRoute} from "@/app/api/email/send/routeSchema";
import {
  Alert,
  Box,
  Button,
  Container,
  CssBaseline,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

const EmailForm = () => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    text: '',
    html: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData({
      ...emailData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await EmailSendRoute.call(emailData);
    
    if (response.data){
      setSuccess(true);
    }
    else {
      setError(true);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(false);
  };

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Send an Email
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            variant="outlined"
            required
            fullWidth
            id="to"
            label="To"
            name="to"
            autoComplete="email"
            value={emailData.to}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            variant="outlined"
            required
            fullWidth
            id="subject"
            label="Subject"
            name="subject"
            value={emailData.subject}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            variant="outlined"
            required
            fullWidth
            id="text"
            label="Text"
            name="text"
            value={emailData.text}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            variant="outlined"
            fullWidth
            id="html"
            label="HTML"
            name="html"
            value={emailData.html}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Send Email
          </Button>
        </Box>
      </Box>
      <Snackbar open={success} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          Email sent successfully!
        </Alert>
      </Snackbar>
      <Snackbar open={error} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          Failed to send email.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmailForm;