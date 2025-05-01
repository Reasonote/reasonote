"use client";

import {
  useEffect,
  useState,
} from "react";

import {format} from "date-fns";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  LocalOffer as TagIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishedIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  useTheme,
} from "@mui/material";

interface BlogPost {
    id: string;
    title: string;
    short_description: string;
    created_date: string;
    updated_date: string;
    slug: string;
    tags: string[];
    content: string;
    cover_image: string | null;
    is_published: boolean;
    created_by: {
        given_name: string | null;
        family_name: string | null;
    } | null;
}

export default function BlogPostPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { supabase } = useSupabase();
    const theme = useTheme();
    const { userStatus, rsnUser } = useRsnUser();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: isAdmin } = await supabase.rpc('is_admin');
            setIsAdmin(isAdmin ?? false);
        };
        checkAdmin();
    }, [supabase]);

    useEffect(() => {
        async function fetchPost() {
            try {
                const query = supabase
                    .from('blog_post')
                    .select(`
                        *,
                        created_by (
                            given_name,
                            family_name
                        )
                    `)
                    .eq('slug', slug);

                // If not admin, only show published posts
                if (!isAdmin) {
                    query.eq('is_published', true);
                }

                const { data, error } = await query.single();

                if (error) throw error;
                // @ts-ignore
                setPost(data);
            } catch (error) {
                console.error('Error fetching blog post:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPost();
    }, [slug, supabase, isAdmin]);

    const handlePublishToggle = async () => {
        if (!post) return;
        
        try {
            const { error } = await supabase
                .from('blog_post')
                .update({ is_published: !post.is_published })
                .eq('id', post.id);

            if (error) throw error;

            // Update local state
            setPost(prev => prev ? { ...prev, is_published: !prev.is_published } : null);
        } catch (error) {
            console.error('Error toggling publish status:', error);
        }
    };

    if (loading) {
        return (
            <Stack spacing={4} sx={{ maxWidth: "48rem", mx: "auto", p: 3, px: 2 }}>
                <Txt>Loading...</Txt>
            </Stack>
        );
    }

    if (!post) {
        return (
            <Stack spacing={2} sx={{ maxWidth: "48rem", mx: "auto", p: 3, px: 2 }}>
                <Txt variant="h4">Post not found</Txt>
                <Txt>Sorry, we couldn't find the blog post you're looking for.</Txt>
            </Stack>
        );
    }

    return (
        <Stack spacing={1} sx={{ maxWidth: "48rem", mx: "auto", py: 3, px: 2 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/app/blog')}
                sx={{ alignSelf: 'flex-start', mb: 1 }}
            >
                View All Posts
            </Button>
            <Paper
                elevation={0}
                sx={{
                    p: 1,
                    borderRadius: 2,
                }}
            >
                <Stack spacing={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Stack spacing={1}>
                            <Txt variant="h4" fontWeight="bold">
                                {post.title}
                            </Txt>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Txt variant="body2" color="text.secondary">
                                    By {post.created_by ? `${post.created_by.given_name} ${post.created_by.family_name}` : 'Anonymous'} on {format(new Date(post.created_date), 'MMMM d, yyyy')}
                                </Txt>
                            </Stack>
                            <Txt color="text.secondary">
                                {post.short_description}
                            </Txt>
                        </Stack>
                        {userStatus === "logged_in" && isAdmin && (
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="contained"
                                    startIcon={post.is_published ? <UnpublishedIcon /> : <PublishIcon />}
                                    onClick={handlePublishToggle}
                                    color={post.is_published ? "warning" : "success"}
                                >
                                    {post.is_published ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={() => router.push(`/app/admin/blog/${post.slug}/edit`)}
                                >
                                    Edit
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: 1,
                    borderRadius: 2,
                }}
            >
                <MuiMarkdownDefault>{post.content}</MuiMarkdownDefault>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: 1,
                    borderRadius: 2,
                }}
            >
                {post.tags.length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <TagIcon color="action" />
                        <Txt variant="body2" color="text.secondary">Tags:</Txt>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {post.tags.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                    color: 'text.secondary',
                                }}
                            />
                        ))}
                        </Box>
                    </Stack>
                )}
            </Paper>
        </Stack>
    );
} 