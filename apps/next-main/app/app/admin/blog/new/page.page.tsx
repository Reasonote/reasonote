"use client";

import {useState} from "react";

import {useRouter} from "next/navigation";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {Stack} from "@mui/material";

import {BlogPostForm} from "../components/BlogPostForm";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const rsnUserId = useRsnUserId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    description: string | null;
    content: string;
    tags: string[];
  }) => {
    setIsSubmitting(true);

    try {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { error } = await supabase
        .from("blog_post")
        .insert({
          title: data.title,
          short_description: data.description,
          content: data.content,
          tags: data.tags,
          slug,
          created_by: rsnUserId,
        });

      if (error) throw error;
      router.push(`/app/blog/${slug}`);
    } catch (error) {
      console.error("Error creating blog post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={4} sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
      <Stack spacing={1}>
        <Txt variant="h3" fontWeight="bold">
          Create New Blog Post
        </Txt>
        <Txt color="text.secondary">
          Fill in the details below to create a new blog post
        </Txt>
      </Stack>

      <BlogPostForm
        onSubmit={handleSubmit}
        submitButtonText="Create Post"
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/app/blog")}
      />
    </Stack>
  );
} 