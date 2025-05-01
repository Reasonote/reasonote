'use client'
import React, {useState} from "react";

import {z} from "zod";

import {
  ImageGenerationRoute,
} from "@/app/api/admin/image-generation/routeSchema";
import {aib} from "@/clientOnly/ai/aib";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

const promptSchema = z.object({
  prompt: z.string(),
});

export default function ImageGenerationTestPage() {
  const [subject, setSubject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('fal-ai/flux/schnell');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGeneratePrompt = async () => {
    setLoading(true);
    try {
      const aiResponse = await aib.streamGenObject({
        schema: promptSchema,
        prompt: `Given the subject "${subject}", create a prompt for image generation. 
                 Come up with a material description and a background description. 
                 Then output a prompt in the format: 
                 \`
                 A visual, mnemonic text display of the word "${subject}"
                 
                 The word ${subject} is carefully spelled, and is made of the material "MATERIAL".

                 The background is "BACKGROUND"
                 \`
                 Be creative and descriptive in your choices for material and background.
                 
                 The material and background should be explicitly related to the subject, because the image will be used as a mnemonic.
                 `,
      });
      setPrompt(`${aiResponse.object.prompt}
        (The word "${subject}" should be spelled very carefully, and perfectly)`);
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await ImageGenerationRoute.call({ prompt, model });
      setResult(response);
    } catch (error) {
      console.error('Error:', error);
      setResult({ success: false, error: 'Failed to generate image' });
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = result?.data?.data?.imageUrl;

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Image Generation Test</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          margin="normal"
          required
        />
        <Button 
          onClick={handleGeneratePrompt} 
          variant="outlined" 
          disabled={loading || !subject}
          sx={{ mt: 1, mb: 2 }}
        >
          Generate Prompt
        </Button>
        <TextField
          fullWidth
          label="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          margin="normal"
          required
          multiline
          rows={3}
        />
        <TextField
          fullWidth
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          margin="normal"
        />
        <Button type="submit" variant="contained" disabled={loading || !prompt}>
          {loading ? 'Generating...' : 'Generate Image'}
        </Button>
      </form>

      {imageUrl && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6">Result:</Typography>
          {result.success && result.data && imageUrl ? (
            <Box mt={2}>
              <img 
                src={imageUrl} 
                alt="Generated" 
                style={{ maxWidth: '100%', height: 'auto' }} 
              />
            </Box>
          ) : (
            <Typography color="error">
              {result.error ? JSON.stringify(result.error) : 'Failed to generate image'}
            </Typography>
          )}
          {/* <Typography variant="subtitle2" mt={2}>Raw Response:</Typography>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre> */}
        </Paper>
      )}
    </Box>
  );
}
