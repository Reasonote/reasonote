import "core-js";

import {NextResponse} from "next/server";
import {v4 as uuidv4} from "uuid";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";

import {UserProfilePictureUploadRoute} from "./routeSchema";

// Define allowed image types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const {POST} = makeServerApiHandlerV3({
  route: UserProfilePictureUploadRoute,
  handler: async (ctx) => {
    const {formData, supabase, SUPERUSER_supabase, user} = ctx;

    if (!formData) {
      return NextResponse.json({error: "No form data provided."}, {status: 400});
    }

    const rsnUserId = user?.rsnUserId;
    if (!rsnUserId) {
      return NextResponse.json({error: "No user found."}, {status: 400});
    }

    try {
      // Check if user is admin
      const {data: isAdmin} = await supabase.rpc('is_admin');

      // Get the target RSN user ID from form data
      const targetRsnUserId = formData.get("rsnUserId");
      if (!targetRsnUserId || typeof targetRsnUserId !== "string") {
        return NextResponse.json({error: "RSN user ID is required"}, {status: 400});
      }

      // Verify permission - user can only update their own profile unless they're admin
      if (targetRsnUserId !== rsnUserId && !isAdmin) {
        return NextResponse.json({error: "Unauthorized"}, {status: 403});
      }

      // Get the file from form data
      const file = formData.get("file");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({error: "No file provided"}, {status: 400});
      }

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({error: "Invalid file type. Only images are allowed."}, {status: 400});
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({error: "File size exceeds 5MB limit"}, {status: 400});
      }

      // Check if the bucket exists, if not create it
      const {data: buckets} = await SUPERUSER_supabase.storage.listBuckets();
      const profilePictureBucket = buckets?.find(bucket => bucket.name === 'user-profile-picture');
      
      if (!profilePictureBucket) {
        const {error: createBucketError} = await SUPERUSER_supabase.storage.createBucket('user-profile-picture', {
          public: true
        });
        if (createBucketError) {
          throw new Error(`Failed to create user-profile-picture bucket: ${createBucketError.message}`);
        }
      }

      // Generate unique filename
      const fileExtension = file.type.split('/')[1];
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;

      // Upload file to storage
      const {data: uploadData, error: uploadError} = await supabase.storage
        .from('user-profile-picture')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return NextResponse.json({error: `Failed to upload file: ${uploadError.message}`}, {status: 400});
      }

      // Get the public URL
      const {data: {publicUrl}} = supabase.storage
        .from('user-profile-picture')
        .getPublicUrl(uploadData.path);

      // Update the user profile with the new image URL
      const {error: updateError} = await supabase
        .from('user_profile')
        .update({profile_image_url: publicUrl})
        .eq('rsn_user_id', targetRsnUserId);

      if (updateError) {
        return NextResponse.json({error: `Failed to update profile: ${updateError.message}`}, {status: 400});
      }

      return {
        profile_image_url: publicUrl,
      };

    } catch (error: any) {
      console.error(error);
      return NextResponse.json({error: error.message}, {status: 500});
    }
  },
}); 