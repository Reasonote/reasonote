import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";
import {uuidv4} from "@reasonote/lib-utils";

import {SpeechRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: SpeechRoute,
  handler: async (ctx) => {
    const { parsedReq, supabase, SUPERUSER_supabase, ai } = ctx;
    const { text, voiceId, provider } = parsedReq;

    try {
      const voice = await ai.audio.speech.getVoiceProfileById(voiceId);
      if (!voice) {
        return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
      }

      const audioBuffer = await ai.audio.speech.generate({
        provider,
        voiceId: voice.id,
        text,
      });

      // Check if the bucket exists, if not create it
      const { data: buckets } = await SUPERUSER_supabase.storage.listBuckets();
      const speechBucket = buckets?.find(bucket => bucket.name === 'speech');
      
      if (!speechBucket) {
        const { error: createBucketError } = await SUPERUSER_supabase.storage.createBucket('speech', {
          public: false
        });
        if (createBucketError) {
          throw new Error(`Failed to create speech bucket: ${createBucketError.message}`);
        }
      }

      // Store audio in Supabase storage
      const fileName = `${uuidv4()}.mp3`;
      const fullFilePath = `${provider}/${voice.name}/${fileName}`;

      const { error: storageError } = await SUPERUSER_supabase.storage
        .from('speech')
        .upload(fullFilePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (storageError) {
        throw new Error(`Failed to upload audio: ${storageError.message}`);
      }

      // Get the public URL for the uploaded file
      const { data } = await SUPERUSER_supabase.storage
        .from('speech')
        .createSignedUrl(fullFilePath, 3600);

      if (!data) {
        throw new Error('Failed to create signed URL');
      }

      return NextResponse.json({ audioUrl: data.signedUrl });
    } catch (error) {
      console.error('Error generating or storing audio:', error);
      return NextResponse.json({ error: 'Failed to generate or store audio' }, { status: 500 });
    }
  }
});
