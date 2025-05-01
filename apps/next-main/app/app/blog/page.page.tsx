"use client";

import {
  useEffect,
  useState,
} from "react";

import {format} from "date-fns";
import {useRouter} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Add as AddIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishedIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Stack,
  Tooltip,
} from "@mui/material";

interface BlogPost {
    id: string;
    title: string;
    short_description: string;
    created_date: string;
    slug: string;
    tags: string[];
    is_published: boolean;
    created_by: {
        given_name: string | null;
        family_name: string | null;
    } | null;
}

export default function BlogPage() {
    const router = useRouter();
    const { supabase } = useSupabase();
    const { userStatus, rsnUser } = useRsnUser();
    const [posts, setPosts] = useState<BlogPost[]>([]);
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
        async function fetchPosts() {
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
                    .order('created_date', { ascending: false });

                // If not admin, only show published posts
                if (!isAdmin) {
                    query.eq('is_published', true);
                }

                const { data, error } = await query;
                if (error) throw error;
                // @ts-ignore
                setPosts(data || []);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [supabase, isAdmin]);

    if (loading) {
        return (
            <Stack spacing={4} sx={{ maxWidth: "48rem", mx: "auto", py: 3, px: 2 }}>
                <Txt>Loading...</Txt>
            </Stack>
        );
    }

    return (
        <Stack spacing={4} sx={{ maxWidth: "48rem", mx: "auto", py: 3, px: 2 }}>
            <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Stack spacing={1}>
                        <Txt variant="h3" fontWeight="bold">
                            Blog
                        </Txt>
                        <Txt color="text.secondary">
                            Insights, Learnings, and Deep Dives from the Reasonote Team
                        </Txt>
                    </Stack>
                    {userStatus === "logged_in" && isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => router.push('/app/admin/blog/new')}
                        >
                            New Post
                        </Button>
                    )}
                </Box>
            </Stack>

            <Divider />

            <Stack spacing={1}>
                {posts.map((post) => (
                    <Box
                        key={post.id}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            position: 'relative',
                        }}
                    >
                        {userStatus === "logged_in" && isAdmin && (
                            <Box sx={{ position: 'absolute', right: 0, top: 0 }}>
                                <Tooltip title="Go to blog post page to publish/unpublish">
                                    <Chip
                                        icon={post.is_published ? <PublishIcon /> : <UnpublishedIcon />}
                                        label={post.is_published ? "Published" : "Draft"}
                                        color={post.is_published ? "success" : "warning"}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Tooltip>
                            </Box>
                        )}
                        <Link href={`/app/blog/${post.slug}`}>
                            <Txt
                                variant="h5"
                                component="h2"
                                fontWeight="bold"
                                sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    }
                                }}
                            >
                                {post.title}
                            </Txt>
                        </Link>
                        <Txt variant="body2" color="text.secondary">
                            <b>{format(new Date(post.created_date), 'MMMM yyyy')}</b> {post.short_description ? `• ${post.short_description}` : ''}
                        </Txt>
                        <Txt variant="caption" color="text.secondary">
                            By {post.created_by ? `${post.created_by.given_name} ${post.created_by.family_name}` : 'Anonymous'}
                        </Txt>
                    </Box>
                ))}
            </Stack>
        </Stack>
    );
}
