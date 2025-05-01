import React from "react";

import {
  cookies,
  headers,
} from "next/headers";

import {
  createServerComponentSupabaseClient,
} from "@supabase/auth-helpers-nextjs";

function stripMarkdown(markdown: string): string {
    return markdown
        // Remove links [text](url)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove images ![alt](url)
        .replace(/!\[([^\]]+)\]\([^)]+\)/g, '')
        // Remove bold/italic
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        // Remove code blocks
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        // Remove headers
        .replace(/#{1,6}\s+/g, '')
        // Remove blockquotes
        .replace(/>\s+/g, '')
        // Remove horizontal rules
        .replace(/(?:^|\n)(?:[-*_]){3,}(?:\n|$)/g, '\n')
        // Remove lists
        .replace(/^[\s*-+]+ /gm, '')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

async function getUserProfile(username: string) {
    const supabase = createServerComponentSupabaseClient({
        cookies,
        headers,
    });

    const {data, error} = await supabase
        .from('user_profile')
        .select('*')
        .eq('username', username)
        .single();

    if (error) throw error;
    return data;
}

export async function generateMetadata({ params }: { params: { username: string } }) {
    try {
        const profile = await getUserProfile(params.username);
        const plainBio = profile.bio ? stripMarkdown(profile.bio) : '';

        return {
            title: `${profile.username} (${profile.display_name || profile.username}) | Reasonote`,
            description: plainBio || `${profile.display_name || profile.username} has a profile on Reasonote. Join Reasonote to learn more.`,
            openGraph: {
                title: `${profile.username} (${profile.display_name || profile.username})`,
                description: plainBio || `View ${profile.username}'s profile on Reasonote`,
                images: [
                    {
                        url: `/api/og/u/${params.username}.png`,
                        width: 1200,
                        height: 630,
                        alt: `${profile.username}'s profile on Reasonote`
                    }
                ],
                type: 'profile',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${profile.username} (${profile.display_name || profile.username})`,
                description: plainBio || `View ${profile.username}'s profile on Reasonote`,
                images: [
                    {
                        url: `/api/og/u/${params.username}.png`,
                        width: 1200,
                        height: 630,
                        alt: `${profile.username}'s profile on Reasonote`
                    }
                ]
            }
        };
    } catch (error) {
        return {
            title: 'Reasonote',
            description: 'Learn anything with Reasonote',
            openGraph: {
                title: 'Reasonote',
                description: 'Learn anything with Reasonote',
                images: [
                    {
                        url: `/api/og/u/${params.username}.png`, // Will return fallback image
                        width: 1200,
                        height: 630,
                        alt: 'Reasonote'
                    }
                ],
                type: 'website'
            }
        };
    }
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
} 