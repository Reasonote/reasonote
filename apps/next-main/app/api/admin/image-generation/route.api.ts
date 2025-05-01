import {NextResponse} from "next/server";
import {v4 as uuidv4} from "uuid";

import {fal} from "@fal-ai/client";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {ImageGenerationRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: ImageGenerationRoute,
  handler: async (ctx) => {
    const { parsedReq, supabase, SUPERUSER_supabase } = ctx;
    const { prompt, model = "fal-ai/flux/schnell" } = parsedReq;

    fal.config({
      credentials:process.env.FAL_API_KEY,
    });

    try {
      const result = await fal.subscribe(model, {
        input: {
          prompt: prompt,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      if (result.data.images && result.data.images.length > 0) {
        const imageUrl = result.data.images[0].url;
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileExt = imageUrl.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;

        // Ensure the bucket exists

        try {
          // TODO: NOT PUBLIC
          // TODO: NOT PUBLIC
          // TODO: NOT PUBLIC
          // TODO: NOT PUBLIC
          // TODO: NOT PUBLIC
          // TODO: NOT PUBLIC
          // TODO: NOT PUBLIC
          const { data: bucketData, error: bucketError } = await SUPERUSER_supabase.storage.createBucket('generated-images', { public: true });

          // Setup permissions such that the uploader 
          if (bucketError && bucketError.message !== 'Bucket already exists') {
            throw bucketError;
          }
        } catch (error) {
          console.error("Error creating bucket:", error);
        }

        // Upload the file
        const { data, error } = await supabase.storage
          .from('generated-images')
          .upload(fileName, buffer, {
            contentType: `image/${fileExt}`,
          });

        if (error) {
          throw error;
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('generated-images')
          .getPublicUrl(fileName);

        return NextResponse.json({
          success: true,
          data: { imageUrl: publicUrlData.publicUrl },
          error: null,
        });
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Error generating or storing image:", error);
      return NextResponse.json({ success: false, error: "Failed to generate or store image" }, { status: 500 });
    }
  }
});
