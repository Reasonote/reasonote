'use client'
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {z} from "zod";

import {aib} from "@/clientOnly/ai/aib";
import {
  Box,
  Button,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

interface Message {
  text: string;
  isUser: boolean;
  toolCalls?: any[];
}

interface EmotionAnalysis {
  emotions: {
    name: string;
    emoji: string;
    probability: number;
  }[]
}

const emotionSchema = z.object({
  emotions: z.array(z.object({
    name: z.string().describe('The name of the emotion'),
    emoji: z.string().describe('The emoji representing the emotion'),
    probability: z.number().describe('The probability of the emotion, between 0 and 1'),
  })),
});

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [emotionAnalyses, setEmotionAnalyses] = useState<EmotionAnalysis[]>([]);
  const [inputText, setInputText] = useState('');
  const [modelName, setModelName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModelName(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === '' || modelName.trim() === '') return;

    const userMessage: Message = { text: inputText, isUser: true };
    var newMessages: Message[] = [...messages, userMessage]
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');

    // Generate bot response
    const botResponse = await aib.genText({
        messages: newMessages.map((msg) => ({ 
            role: msg.isUser ? 'user' : 'assistant', 
            content: msg.text 
        })),
        tools: {
            getWeather: {
                description: 'Get the weather for a location',
                parameters: z.object({
                    location: z.string()
                })
            }
        },
        model: modelName
    });

    const botMessage: Message = { text: botResponse.text, isUser: false, toolCalls: botResponse.toolCalls };
    setMessages((prevMessages) => [...prevMessages, botMessage]);

    // Generate emotion analysis
    const emotionAnalysis = await aib.genObject({
      schema: emotionSchema,
      prompt: `Guess the current emotional state of the user based on this conversation.

      Provide a list of emotions that you think the user is feeling.
      
      <Conversation>
        ${newMessages.map((msg) => `<${msg.isUser ? 'User' : 'Assistant'}>${msg.text}</${msg.isUser ? 'User' : 'Assistant'}>`).join('')}
      </Conversation>
      `,
      model: modelName
    });

    setEmotionAnalyses((prevEmotions) => [...prevEmotions, emotionAnalysis.object]);
  };

  return (
    <Container maxWidth="lg">
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Paper elevation={3} style={{ height: '70vh', overflowY: 'auto', padding: '16px', marginBottom: '16px' }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: message.isUser ? 'primary.main' : 'secondary.dark',
                    maxWidth: '70%',
                  }}
                >
                  <Typography>{message.text}</Typography>
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <pre>
                      <code>{JSON.stringify(message.toolCalls, null, 2)}</code>
                    </pre>
                  )}
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Paper>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <TextField
              fullWidth
              variant="outlined"
              value={modelName}
              onChange={handleModelChange}
              placeholder="Enter model name..."
            />
            <div style={{ display: 'flex' }}>
              <TextField
                fullWidth
                variant="outlined"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Type your message..."
              />
              <Button type="submit" variant="contained" color="primary" style={{ marginLeft: '8px' }}>
                Send
              </Button>
            </div>
          </form>
        </Grid>
        <Grid item xs={4}>
          <Paper elevation={3} style={{ padding: '16px', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Emotion Analysis
            </Typography>
            {emotionAnalyses.length > 0 && (
              <List>
                <ListItem>
                  <ListItemText
                    primary="Latest Emotion Analysis:"
                    secondary={
                      <List dense>
                        {emotionAnalyses[emotionAnalyses.length - 1]?.emotions?.map((emotion, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>{emotion.emoji}</ListItemIcon>
                            <ListItemText primary={emotion.name} secondary={`${(emotion.probability * 100).toFixed(2)}%`} />
                          </ListItem>
                        ))}
                      </List>
                    }
                  />
                </ListItem>
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChatbotPage;
