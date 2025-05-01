import fetch from 'node-fetch';
import OpenAI from 'openai';

import { AI } from '../';
import {
  VoiceManager,
  VoiceProfile,
} from './VoiceManager';

export class AIAudio {
  private voiceManager: VoiceManager;
  private initialized: boolean = false;

  constructor(private ai: AI) {
    if (!this.ai.ctx.elevenLabsApiKey || !this.ai.ctx.openaiApiKey) {
      throw new Error('ElevenLabs and OpenAI API keys are required to use AIAudio');
    }

    this.voiceManager = new VoiceManager(
      this.ai.ctx.elevenLabsApiKey,
      this.ai.ctx.openaiApiKey
    );
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.voiceManager.initializeVoices();
      this.initialized = true;
    }
  }

  speech = {
    generate: async (params: {
      provider: "openai" | "elevenlabs";
      voiceId: string;
      text: string;
      metaParams?: Record<string, any>;
    }): Promise<ArrayBuffer> => {
      await this.ensureInitialized();
      const { provider, voiceId, text, metaParams } = params;
      const voice = this.voiceManager.getVoiceProfileById(voiceId);

      if (!voice) {
        throw new Error(`Voice with ID ${voiceId} not found`);
      }

      switch (provider) {
        case "openai":
          return this.generateOpenAISpeech(voice, text, metaParams);
        case "elevenlabs":
          return this.generateElevenLabsSpeech(voice, text, metaParams);
        default:
          throw new Error(`Unsupported speech provider: ${provider}`);
      }
    },
    getVoiceProfile: async (provider: string, name: string): Promise<VoiceProfile | undefined> => {
      await this.ensureInitialized();
      return this.voiceManager.getVoiceProfile(provider, name);
    },
    getVoiceProfileById: async (id: string): Promise<VoiceProfile | undefined> => {
      await this.ensureInitialized();
      return this.voiceManager.getVoiceProfileById(id);
    },
    getVoiceProfileByFullId: async (fullId: string): Promise<VoiceProfile | undefined> => {
      await this.ensureInitialized();
      return this.voiceManager.getVoiceProfileByFullId(fullId);
    },
    getAllVoices: async (): Promise<VoiceProfile[]> => {
      await this.ensureInitialized();
      return this.voiceManager.getAllVoices();
    },
    getFullIds: async (voices: VoiceProfile[]): Promise<string[]> => {
      await this.ensureInitialized();
      return this.voiceManager.getFullIds(voices);
    }
  };

  private async generateOpenAISpeech(
    voice: VoiceProfile,
    text: string,
    metaParams?: Record<string, any>
  ): Promise<ArrayBuffer> {
    const openai = new OpenAI({
      apiKey: this.ai.ctx.openaiApiKey,
    });
    const audioResponse = await openai.audio.speech.create({
      model: metaParams?.model || "tts-1",
      voice: voice.id as any,
      input: text,
      response_format: "mp3",
      ...metaParams,
    });
    return await audioResponse.arrayBuffer();
  }

  private async generateElevenLabsSpeech(
    voice: VoiceProfile,
    text: string,
    metaParams?: Record<string, any>
  ): Promise<ArrayBuffer> {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`;
    const options = {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": this.ai.ctx.elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: metaParams?.model_id || "eleven_monolingual_v1",
        voice_settings: {
          stability: voice.settings?.stability ?? 0.5,
          similarity_boost: voice.settings?.similarity_boost ?? 0.5,
          ...metaParams?.voice_settings,
        },
      }),
    };

    const response = await fetch(url, options as any);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.arrayBuffer();
  }
}
