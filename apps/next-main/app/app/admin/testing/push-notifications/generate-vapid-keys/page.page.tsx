'use client';

import React, {useState} from "react";

import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

export default function VapidGenerator() {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const generateKeys = async () => {
    try {
      const response = await fetch('/api/admin/push-notifications/generate-vapid-keys', { method: 'POST' });
      const data = await response.json();
      setPublicKey(data.publicKey);
      setPrivateKey(data.privateKey);
    } catch (error) {
      console.error('Error generating VAPID keys:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600 }}>
        <Typography variant="h4" gutterBottom>VAPID Key Generator</Typography>
        <Button variant="contained" color="primary" onClick={generateKeys} sx={{ mb: 2 }}>
          Generate VAPID Keys
        </Button>
        <TextField
          label="Public Key"
          fullWidth
          value={publicKey}
          margin="normal"
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Private Key"
          fullWidth
          value={privateKey}
          margin="normal"
          InputProps={{ readOnly: true }}
        />
      </Paper>
    </Box>
  );
}