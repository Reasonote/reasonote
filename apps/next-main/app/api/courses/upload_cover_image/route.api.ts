import "core-js";

import {NextResponse} from "next/server";
import {v4 as uuidv4} from "uuid";

import {makeServerApiHandlerV3} from "@/app/api/helpers/serverApiHandlerV3";

import {UploadCourseCoverImageRoute} from "./routeSchema";

// Define allowed image types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const {POST} = makeServerApiHandlerV3({
  route: UploadCourseCoverImageRoute,
  handler: async (ctx) => {
    const {parsedReq, formData, supabase, SUPERUSER_supabase, user} = ctx;

    if (!parsedReq.courseId) {
      return NextResponse.json({error: "No course ID provided."}, {status: 400});
    }

    const rsnUserId = user?.rsnUserId;
    if (!rsnUserId) {
      return NextResponse.json({error: "No user found."}, {status: 400});
    }

    try {
      // Check if user is admin
      const {data: isAdmin} = await supabase.rpc('is_admin');

      // Check if the user has permission to update the course
      const {data: courseData} = await supabase
        .from('vw_course_memauth')
        .select('*')
        .eq('course_id', parsedReq.courseId)
        .eq('principal_id', rsnUserId)
        .single();

      // Verify permission - user can only update course they have edit access to
      if (!isAdmin && (!courseData || !courseData.permissions?.includes('course.UPDATE'))) {
        return NextResponse.json({error: "Unauthorized. You must have edit access to the course to update the cover image."}, {status: 403});
      }

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(parsedReq.fileType)) {
        return NextResponse.json({error: "Invalid file type. Only images are allowed."}, {status: 400});
      }

      // Validate file size
      if (parsedReq.fileData.length > MAX_FILE_SIZE) {
        return NextResponse.json({error: "File size exceeds 5MB limit"}, {status: 400});
      }

      // Decode base64 data to Buffer
      const base64Data = parsedReq.fileData.split(';base64,').pop();
      if (!base64Data) {
        return NextResponse.json({error: "Invalid file data format"}, {status: 400});
      }
      const fileBuffer = Buffer.from(base64Data, 'base64');

      // Check if the bucket exists, if not create it
      const {data: buckets} = await SUPERUSER_supabase.storage.listBuckets();
      const courseCoverImageBucket = buckets?.find(bucket => bucket.name === 'course-cover-image');
      
      if (!courseCoverImageBucket) {
        const {error: createBucketError} = await SUPERUSER_supabase.storage.createBucket('course-cover-image', {
          public: true
        });
        if (createBucketError) {
          throw new Error(`Failed to create course-cover-image bucket: ${createBucketError.message}`);
        }
      }

      // Generate unique filename
      const fileExtension = parsedReq.fileType.split('/')[1];
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;

      // Upload file to storage with buffer instead of raw fileData
      const {data: uploadData, error: uploadError} = await supabase.storage
        .from('course-cover-image')
        .upload(uniqueFileName, fileBuffer, {
          contentType: parsedReq.fileType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return NextResponse.json({error: `Failed to upload file: ${uploadError.message}`}, {status: 400});
      }

      // Get the public URL
      const {data: {publicUrl}} = supabase.storage
        .from('course-cover-image')
        .getPublicUrl(uploadData.path);

      // Update the course with the new cover image URL
      const {error: updateError} = await supabase
        .from('course')
        .update({cover_image_url: publicUrl})
        .eq('id', parsedReq.courseId);

      if (updateError) {
        return NextResponse.json({error: `Failed to update course: ${updateError.message}`}, {status: 400});
      }

      return {image_url: publicUrl};

    } catch (error: any) {
      console.error(error);
      return NextResponse.json({error: error.message}, {status: 500});
    }
  },
}); 