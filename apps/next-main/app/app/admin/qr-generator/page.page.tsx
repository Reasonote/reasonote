"use client";

import {
  useEffect,
  useState,
} from "react";

import {QRCodeSVG} from "qrcode.react";

import {Txt} from "@/components/typography/Txt";
import {
  Paper,
  Stack,
  TextField,
} from "@mui/material";

export default function QRGeneratorPage() {
  const [url, setUrl] = useState("");
  const [logoBase64, setLogoBase64] = useState<string>("");
  
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw a rounded rectangle clipping path
      const radius = 12; // Adjust this value to control the roundness
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(img.width - radius, 0);
      ctx.quadraticCurveTo(img.width, 0, img.width, radius);
      ctx.lineTo(img.width, img.height - radius);
      ctx.quadraticCurveTo(img.width, img.height, img.width - radius, img.height);
      ctx.lineTo(radius, img.height);
      ctx.quadraticCurveTo(0, img.height, 0, img.height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, 0, 0);

      const base64 = canvas.toDataURL('image/png');
      setLogoBase64(base64);
    };

    img.src = "/favicon.ico";
  }, []);
  
  return (
    <Stack spacing={3} p={3} maxWidth={600} mx="auto">
      <Txt variant="h4">QR Code Generator</Txt>
      
      <TextField
        label="Enter URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        placeholder="https://example.com"
      />
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'center',
          bgcolor: 'white',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <QRCodeSVG
          value={url || "https://reasonote.com"}
          size={256}
          marginSize={1}
          level="H"
          imageSettings={logoBase64 ? {
            src: logoBase64,
            height: 64,
            width: 64, 
            excavate: true,
          } : undefined}
        />
      </Paper>
      
      <Txt color="text.secondary" variant="body2">
        The QR code will update automatically as you type. It includes the Reasonote favicon in the center.
      </Txt>
    </Stack>
  );
} 