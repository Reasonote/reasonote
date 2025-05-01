"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {Stack} from "@mui/material";

import {BlogPostForm} from "../../components/BlogPostForm";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<{
    title: string;
    description: string | null;
    content: string;
    tags: string[];
  } | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data, error } = await supabase
          .from('blog_post')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        
        setInitialData({
          title: data.title,
          description: data.short_description,
          content: data.content,
          tags: data.tags || [],
        });
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug, supabase]);

  const handleSubmit = async (data: {
    title: string;
    description: string | null;
    content: string;
    tags: string[];
  }) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("blog_post")
        .update({
          title: data.title,
          short_description: data.description,
          content: data.content,
          tags: data.tags,
        })
        .eq('slug', slug);

      if (error) throw error;
      router.push(`/app/blog/${slug}`);
    } catch (error) {
      console.error("Error updating blog post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={4} sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
        <Txt>Loading...</Txt>
      </Stack>
    );
  }

  return (
    <Stack spacing={4} sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
      <Stack spacing={1}>
        <Txt variant="h3" fontWeight="bold">
          Edit Blog Post
        </Txt>
        <Txt color="text.secondary">
          Update the details below to edit your blog post
        </Txt>
      </Stack>

      {initialData && (
        <BlogPostForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitButtonText="Save Changes"
          isSubmitting={isSubmitting}
          onCancel={() => router.push("/app/blog")}
        />
      )}
    </Stack>
  );
} 