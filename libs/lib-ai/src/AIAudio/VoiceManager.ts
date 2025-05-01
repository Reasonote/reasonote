import OpenAI from 'openai';
import { z } from 'zod';

export interface VoiceProfile {
  id: string;
  name: string;
  provider: 'elevenlabs' | 'openai';
  gender?: string | null;
  description?: string | null ;
  settings?: {
    stability?: number | null;
    similarity_boost?: number | null;
    style?: number | null;
    use_speaker_boost?: boolean | null;
  } | null;
  quality?: 'standard' | 'enhanced' | null;
}

// Define Zod schema for the API response
const ElevenLabsVoiceResponseSchema = z.object({
  voices: z.array(z.object({
    voice_id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    labels: z.object({
      gender: z.string().nullish(),
    }).passthrough().nullish(),
    settings: z.object({
      stability: z.number().nullish(),
      similarity_boost: z.number().nullish(),
      style: z.number().nullish(),
      use_speaker_boost: z.boolean().nullish(),
    }).passthrough().nullish(),
  }).passthrough())
}).passthrough();

// Type inference from the schema
type ElevenLabsVoiceResponse = z.infer<typeof ElevenLabsVoiceResponseSchema>;

export class VoiceManager {
  private elevenLabsApiKey: string;
  private openAIClient: OpenAI;
  private voices: VoiceProfile[] = [];

  constructor(elevenLabsApiKey: string, openAIApiKey: string) {
    this.elevenLabsApiKey = elevenLabsApiKey;
    this.openAIClient = new OpenAI({ apiKey: openAIApiKey });
  }

  async initializeVoices() {
    await this.fetchElevenLabsVoices();
    await this.fetchOpenAIVoices();
  }

  private async fetchElevenLabsVoices() {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.elevenLabsApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const rawData = await response.json();
      
      // Parse the response with Zod
      const parseResult = ElevenLabsVoiceResponseSchema.safeParse(rawData);
      
      if (!parseResult.success) {
        console.warn(
          'ElevenLabs API response schema changed. Please update the schema:', 
          JSON.stringify(parseResult.error.format(), null, 2),
          '\nRaw response:',
          JSON.stringify(rawData, null, 2)
        );
        // Fall back to using the raw data
        const data = rawData as ElevenLabsVoiceResponse;
        this.processVoicesData(data);
      } else {
        // Use the parsed and validated data
        this.processVoicesData(parseResult.data);
      }
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      throw error;
    }
  }

  private processVoicesData(data: ElevenLabsVoiceResponse) {
    this.voices.push(...data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name ?? voice.voice_id,
      provider: 'elevenlabs' as const,
      description: voice.description ?? `${JSON.stringify(voice.labels)}`,
      settings: voice.settings,
      gender: voice.labels?.gender,
      quality: 'enhanced' as const
    })));
  }

  private async fetchOpenAIVoices() {
    // OpenAI doesn't have an API to fetch voices, so we'll hardcode them
    const openAIVoices: VoiceProfile[] = [
      { id: 'alloy', name: 'Alloy', provider: 'openai', gender: 'neutral', description: 'A fairly androgynous voice, good for a podcast that needs to be gender neutral.', quality: 'standard' },
      { id: 'echo', name: 'Echo', provider: 'openai', gender: 'male', description: 'A warm and high male voice. Friendly and engaging.', quality: 'standard' },
      { id: 'fable', name: 'Fable', provider: 'openai', gender: 'male', description: 'A british male voice with a high register. Friendly and engaging.', quality: 'standard' },
      { id: 'onyx', name: 'Onyx', provider: 'openai', gender: 'male', description: 'A deep and warm male voice. Friendly and engaging.', quality: 'standard' },
      { id: 'nova', name: 'Nova', provider: 'openai', gender: 'female', description: 'A female voice with a high register. Friendly, engaging, youthful, kind.', quality: 'standard' },
      { id: 'shimmer', name: 'Shimmer', provider: 'openai', gender: 'female', description: 'A female voice with a deeper tone. Mature, kind.', quality: 'standard' },
    ];
    this.voices.push(...openAIVoices);
  }

  getVoiceProfile(provider: string, name: string): VoiceProfile | undefined {
    return this.voices.find(v => v.provider === provider && v.name === name);
  }

  getVoiceProfileById(id: string): VoiceProfile | undefined {
    return this.voices.find(v => v.id === id);
  }

  getVoiceProfileByFullId(fullId: string): VoiceProfile | undefined {
    // Resolve names into a voice profile in the following precedence:
    // provider:voiceId > provider:name > id > name

    if (fullId.includes(':')) {
      const [provider, voiceId] = fullId.split(':');

      const byProviderVoiceId = this.voices.find(v => v.provider === provider && v.id === voiceId);
      if (byProviderVoiceId) return byProviderVoiceId;

      const byProviderName = this.voices.find(v => v.provider === provider && v.name === voiceId);
      if (byProviderName) return byProviderName;
    }
    else {
      const byId = this.voices.find(v => v.id === fullId);
      if (byId) return byId;

      const byName = this.voices.find(v => v.name === fullId);
      if (byName) return byName;
    }

    return undefined;
  }

  getFullIds(voices: VoiceProfile[]): string[] {
    return voices.map(v => `${v.provider}:${v.id}`);
  }

  getAllVoices(): VoiceProfile[] {
    return this.voices;
  }
}
