import { NextRequest } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;



export async function POST(req: NextRequest) {
  const { text, voice = 'alloy' } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), { status: 400 });
  }

  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      response_format: 'mp3',
    });

    const stream = response.body;

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate speech' }), { status: 500 });
  }
}