"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {SpeechRoute} from "@/app/api/speech/routeSchema";
import {VoicesRoute} from "@/app/api/speech/voices/routeSchema";
import {
  Button,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface Voice {
  id: string;
  name: string;
  provider: 'elevenlabs' | 'openai';
  gender?: string | null;
  description?: string | null;
}

export default function SpeechTestPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState("Hello, this is a test of the text-to-speech system.");
  const [voiceId, setVoiceId] = useState("");
  const [provider, setProvider] = useState<'elevenlabs' | 'openai'>('elevenlabs');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      // Enable pitch preservation
      audioRef.current.preservesPitch = true;
    }
  }, [playbackRate]);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const {data} = await VoicesRoute.call({});

      const voices = data?.voices ?? [];

      setVoices(voices);
      if (voices.length > 0) {
        setVoiceId(voices[0].id);
        setProvider(voices[0].provider);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching voices:', err);
      setError('Failed to fetch voices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await SpeechRoute.call({
        text: testText,
        voiceId,
        provider,
      });

      const {data} = response;

      if (data?.audioUrl) {
        setAudioUrl(data.audioUrl);
      } else {
        setError('Failed to generate audio');
      }
    } catch (err) {
      console.error('Error generating audio:', err);
      setError('Failed to generate audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackRateChange = (event: Event, newValue: number | number[]) => {
    setPlaybackRate(newValue as number);
  };

  if (loading) {
    return <Typography>Loading voices...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Stack spacing={2} component="form" onSubmit={handleSubmit}>
      <Typography variant="h4">Speech Test Page</Typography>
      <TextField
        label="Test Text"
        multiline
        rows={4}
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
      />
      <Select
        value={voiceId}
        onChange={(e) => {
          const selectedVoice = voices.find(v => v.id === e.target.value);
          setVoiceId(e.target.value as string);
          if (selectedVoice) {
            setProvider(selectedVoice.provider);
          }
        }}
      >
        {voices.map((voice) => (
          <MenuItem key={voice.id} value={voice.id}>
            <Typography>{voice.name} ({voice.provider})</Typography>
            <Typography variant="body2" color="text.secondary">
              {voice.description || 'No description available'}
            </Typography>
          </MenuItem>
        ))}
      </Select>
      <Button type="submit" variant="contained" disabled={loading}>
        Generate Audio
      </Button>
      {audioUrl && (
        <>
          <audio 
            controls 
            src={audioUrl} 
            ref={audioRef}
          >
            Your browser does not support the audio element.
          </audio>
          <Stack spacing={2} direction="row" alignItems="center">
            <Typography>Playback Speed: {playbackRate}x</Typography>
            <Slider
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              min={0.5}
              max={2}
              step={0.1}
              marks
              valueLabelDisplay="auto"
              sx={{ width: 200 }}
            />
          </Stack>
        </>
      )}
    </Stack>
  );
}
