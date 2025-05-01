"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {Buffer} from "buffer";

import {RealtimeAudioRoute} from "@/app/api/realtime-audio/routeSchema";
import {Txt} from "@/components/typography/Txt";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

export default function RealtimeAudioTestPage() {
  const [selectedText, setSelectedText] = useState('');
  const [customText, setCustomText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioChunks, setAudioChunks] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const predefinedStyles = [
    {
      name: "english biddy",
      description: "You are an old english biddy, as if hailing from bridgerton. You wear big long fluffy dresses with collars, and have many small dogs as pets. You are fanciful and detached from reality."
    },
    {
      name: "Old-Timey Prospector",
      description: "You are an old-timey prospector, as if hailing from the late 1800s. You are rugged and tough, with a strong accent. You are full of vim and vigor."
    }
    // Add more predefined styles here
  ];

  const predefinedLines = [
    `Boy, you got a lot o' nerve comin' up here after what you did to m' daughters. I'm gonna *have* to set 'ya straight son, y'know that don't ya? 
    [OMINOUS PAUSE, LOADS WEAPON]
    .... *Don't Ya*?`,
    "The old clock on the mantel struck midnight, its chimes echoing through the empty house. Sarah held her breath, listening for any sign of movement in the darkness.",
    "As the spaceship emerged from the wormhole, Captain Chen gasped at the sight before her. A planet, shimmering with vibrant colors never before seen by human eyes, loomed large in the viewscreen.",
    "Detective Johnson rubbed his tired eyes and poured another cup of coffee. The case had seemed straightforward at first, but now, with each new piece of evidence, it was becoming a labyrinth of deception and intrigue.",
    "The ancient tome crackled as Elara carefully turned its pages, her eyes widening with each arcane symbol she deciphered. Little did she know, the very act of reading was awakening a long-dormant magic within the book.",
    "As the last notes of the symphony faded away, the concert hall erupted in thunderous applause. Backstage, the young violinist's hands trembled, a mix of relief and exhilaration coursing through her veins.",
    // Add more predefined lines here
  ];

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      // Clean up AudioContext on component unmount
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const style = selectedStyle === 'custom' ? customStyle : 
      predefinedStyles.find(s => s.name === selectedStyle)?.description || '';
    
    const text = selectedText === 'custom' ? customText : selectedText;

    try {
      const response = await RealtimeAudioRoute.call({ text, style });
      if (!response.success) {
        throw new Error(response.error);
      }
      setAudioChunks(response.data.audioChunks);
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('An error occurred while generating audio.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (audioChunks.length > 0 && audioContextRef.current) {
      // Decode and concatenate all chunks
      const decodedChunks = audioChunks.map(chunk => Buffer.from(chunk, 'base64'));
      const concatenatedBuffer = Buffer.concat(decodedChunks);

      // Convert to AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        concatenatedBuffer.length / 2, // 16-bit samples
        24000 // sample rate
      );
      const channelData = audioBuffer.getChannelData(0);
      const int16Array = new Int16Array(concatenatedBuffer.buffer);

      // Convert Int16Array to Float32Array
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      // Play the audio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    }
  };

  const createWavFile = () => {
    if (audioChunks.length === 0) return;

    // Decode and concatenate all chunks
    const decodedChunks = audioChunks.map(chunk => Buffer.from(chunk, 'base64'));
    const audioData = Buffer.concat(decodedChunks);

    // WAV header
    const header = Buffer.alloc(44);
    const totalAudioLen = audioData.length;
    const totalDataLen = totalAudioLen + 36;
    const sampleRate = 24000;
    const channels = 1;
    const bitsPerSample = 16;

    header.write('RIFF', 0);
    header.writeUInt32LE(totalDataLen, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
    header.writeUInt16LE(channels * bitsPerSample / 8, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(totalAudioLen, 40);

    // Combine header and audio data
    const wavFile = Buffer.concat([header, audioData]);

    // Create Blob
    const blob = new Blob([wavFile], { type: 'audio/wav' });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audio.wav';
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Txt variant="h4" mb={2}>Realtime Audio Test</Txt>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Select Text</InputLabel>
          <Select
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
            label="Select Text"
          >
            {predefinedLines.map((line, index) => (
              <MenuItem key={index} value={line}>{line}</MenuItem>
            ))}
            <MenuItem value="custom">Custom Text</MenuItem>
          </Select>
        </FormControl>
        {selectedText === 'custom' && (
          <TextField
            fullWidth
            label="Enter your custom text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            margin="normal"
            variant="outlined"
            rows={4}
            multiline
          />
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel>Select Style</InputLabel>
          <Select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            label="Select Style"
          >
            {predefinedStyles.map((style) => (
              <MenuItem key={style.name} value={style.name}>{style.name}</MenuItem>
            ))}
            <MenuItem value="custom">Custom Style</MenuItem>
          </Select>
        </FormControl>
        {selectedStyle === 'custom' && (
          <TextField
            fullWidth
            label="Enter your custom style"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            margin="normal"
            variant="outlined"
            rows={4}
            multiline
          />
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !selectedText || (!selectedStyle && !customStyle)}
          sx={{ mt: 2 }}
        >
          {loading ? 'Generating...' : 'Generate Audio'}
        </Button>
      </form>
      {audioChunks.length > 0 && (
        <Box mt={4}>
          <Txt variant="h6" mb={2}>Generated Audio:</Txt>
          <Button
            variant="contained"
            color="secondary"
            onClick={playAudio}
            sx={{ mr: 2 }}
          >
            Play Audio
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={createWavFile}
          >
            Download WAV
          </Button>
        </Box>
      )}
    </Box>
  );
}