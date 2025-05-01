import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {uuidv4} from "@reasonote/lib-utils";

import {SpeechPodcastVoiceRoute} from "./routeSchema";

export const maxDuration = 60; // 1 minute, adjust as needed

export const { POST } = makeServerApiHandlerV3({
  route: SpeechPodcastVoiceRoute,
  handler: async (ctx) => {
    const { parsedReq, supabase, SUPERUSER_supabase, ai } = ctx;
    const { podcast_line_id } = parsedReq;

    const { data: podcastLine, error } = await supabase.from('podcast_line')
      .select(`*, podcast (outline)`)
      .eq('id', podcast_line_id).single();

    if (!podcastLine) {
      return new Response(JSON.stringify({ error: 'Podcast line not found' }), { status: 404 });
    }

    const { speaker, dialogue, podcast } = podcastLine;

    const outlineCharacter = (podcast?.outline as any)?.hosts?.find((h: any) => h.name.toLowerCase().trim().includes(speaker.toLowerCase().trim()));
    
    try {
      // Check if audio already exists for this line
      const { data: existingAudio } = await supabase
        .from('podcast_audio')
        .select('*')
        .eq('podcast_line_id', podcast_line_id)
        .single();

      if (existingAudio) {
        return {
          audioFile: existingAudio.audio_file,
          podcast_line_id,
          character: outlineCharacter?.name || speaker,
          dialogue,
          speed: existingAudio.speed,
        };
      }

      let voice;

      if (!outlineCharacter) {
        console.warn(`Character ${speaker} not found in outline. Picking random voice.`);
        const allVoices = await ai.audio.speech.getAllVoices();
        voice = allVoices[Math.floor(Math.random() * allVoices.length)];
      } else {
        voice = await ai.audio.speech.getVoiceProfileByFullId(outlineCharacter.voice);
      }
  
      if (!voice) {
        return new Response(JSON.stringify({ error: `Voice not found for ${outlineCharacter?.voice.provider}:${outlineCharacter?.voice.name}` }), { status: 404 });
      }

      // Generate new audio using ai.audio.speech.generate
      const audioBuffer = await ai.audio.speech.generate({
        provider: voice.provider,
        voiceId: voice.id,
        text: dialogue,
        metaParams: {
          speed: 1,
        },
      });

      // Check if the bucket exists, if not create it
      const { data: buckets } = await SUPERUSER_supabase.storage.listBuckets();
      const podcastAudioBucket = buckets?.find(bucket => bucket.name === 'podcast_audio');
      
      if (!podcastAudioBucket) {
        const { error: createBucketError } = await SUPERUSER_supabase.storage.createBucket('podcast_audio', {
          public: false
        });
        if (createBucketError) {
          throw new Error(`Failed to create podcast_audio bucket: ${createBucketError.message}`);
        }
      }

      // Store audio in Supabase storage
      const fileName = `${podcast_line_id}-${uuidv4()}.mp3`;
      const fullFilePath = `${podcastLine.podcast_id}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('podcast_audio')
        .upload(fullFilePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (storageError) {
        throw new Error(`Failed to upload audio: ${storageError.message}`);
      }

      // Insert record into podcast_audio table
      const { error: insertError } = await SUPERUSER_supabase
        .from('podcast_audio')
        .insert({
          podcast_line_id,
          audio_file: fullFilePath,
          speed: 1,
        });

      if (insertError) {
        throw new Error(`Failed to insert podcast audio record: ${insertError.message}`);
      }

      console.log(`Audio generated and stored for podcast line ${podcast_line_id}`);

      return {
        audioFile: fullFilePath,
        podcast_line_id,
        character: outlineCharacter?.name || speaker,
        dialogue,
        speed: 1,
      };
    } catch (error) {
      console.error('Error generating or storing audio:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate or store audio' }), { status: 500 });
    }
  }
});
