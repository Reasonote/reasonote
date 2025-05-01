// apps/next-main/app/admin/testing/youtube-transcript/page.tsx
"use client";

import {useState} from "react";

import _ from "lodash";

import {
  YoutubeTranscriptRoute,
  YoutubeTranscriptRouteRequestIn,
} from "@/app/api/integrations/youtube/getTranscript/routeSchema";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

export default function YoutubeTranscriptPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTranscript('');
    setAiTranscript('');

    try {
      const input: YoutubeTranscriptRouteRequestIn = { youtubeUrl };
      const result = await YoutubeTranscriptRoute.call(input);

      if (result.error) {
        setError(result.error.message);
      } else {
        setTranscript(result.data?.transcript ?? '');
        setAiTranscript(result.data?.aiTranscript ?? '');
      }
    } catch (err) {
      setError(_.get(err, 'body.message', 'Failed to fetch transcript. Please check the URL and try again.'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenterPaperStack>
        <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
            YouTube Transcript Fetcher
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
            <TextField
                fullWidth
                label="YouTube Video URL"
                variant="outlined"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                margin="normal"
            />
            <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                disabled={isLoading}
                sx={{ mt: 2 }}
            >
                {isLoading ? 'Fetching...' : 'Get Transcript'}
            </Button>
            </form>
        </Paper>
        
        {error && (
            <Typography color="error" sx={{ mt: 2 }}>
            {error}
            </Typography>
        )}
        
        {(transcript || aiTranscript) && (
            <Box sx={{ mt: 3 }}>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Original Transcript</Typography>
                </AccordionSummary>
                <AccordionDetails>
            <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                {transcript}
            </Typography>
                </AccordionDetails>
            </Accordion>
            
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>AI Transcript</Typography>
                </AccordionSummary>
                <AccordionDetails>
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {aiTranscript}
                </Typography>
                </AccordionDetails>
            </Accordion>
        </Box>
        )}
        </Box>
    </CenterPaperStack>
  );
}