import {type NextRequest} from "next/server";

import {createClient} from "@supabase/supabase-js";
import {ImageResponse} from "@vercel/og";

export const runtime = 'edge';

function stripMarkdown(markdown: string): string {
    return markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]+)\]\([^)]+\)/g, '')
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/#{1,6}\s+/g, '')
        .replace(/>\s+/g, '')
        .replace(/(?:^|\n)(?:[-*_]){3,}(?:\n|$)/g, '\n')
        .replace(/^[\s*-+]+ /gm, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function getUserProfile(username: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('username', username)
        .single();

    if (error) throw error;
    if (!data) throw new Error('User profile not found');
    return data;
}

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
    // Remove @ and ANY image extension from username
    const cleanedUsername = params?.username?.replace('@', '')?.replace(/\.[^.]+$/, '');

    try {
        const profile = await getUserProfile(cleanedUsername);
        const plainBio = profile.bio ? stripMarkdown(profile.bio) : '';

        console.debug(`Successfully fetched profile for ${cleanedUsername} (${JSON.stringify({profile, plainBio})})`);
        
        return new ImageResponse(
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: 'url(https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//Reasonote-Icon-BG-Compressed.png)',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundColor: '#4F46E5',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '40px',
                        left: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <img
                        src="https://reasonote.com/favicon.ico"
                        alt="Reasonote"
                        style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.8)',
                        }}
                    />
                    <span style={{
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold',
                    }}>
                        Reasonote
                    </span>
                </div>
                
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '24px',
                        position: 'relative',
                    }}
                >
                    <img
                        src={profile.profile_image_url ?? 'https://reasonote.com/favicon.ico'}
                        alt={cleanedUsername}
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '60px',
                            border: '4px solid white',
                            marginBottom: '8px',
                        }}
                    />
                    
                    <h1
                        style={{
                            fontSize: '85px',
                            fontWeight: 'bold',
                            color: 'white',
                            lineHeight: 1.1,
                            textAlign: 'center',
                            margin: 0,
                        }}
                    >
                        {profile.display_name || cleanedUsername}
                    </h1>
                    <h2 style={{
                        fontSize: '40px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textAlign: 'center',
                        margin: 0,
                    }}>
                        {`@${cleanedUsername}`}
                    </h2>

                    {profile.bio && (
                        <p
                            style={{
                                fontSize: '32px',
                                color: 'rgba(255, 255, 255, 0.9)',
                                textAlign: 'center',
                                margin: 0,
                                maxWidth: '800px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {plainBio}
                        </p>
                    )}
                </div>
            </div>,
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error(`Error generating OG image for ${cleanedUsername}:`, error);
        return new ImageResponse(
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: 'url(https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//Reasonote-Icon-BG-Compressed.png)',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundColor: '#4F46E5',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '40px',
                        left: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <img
                        src="https://reasonote.com/favicon.ico"
                        alt="Reasonote"
                        style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.8)',
                        }}
                    />
                    <span style={{
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold',
                    }}>
                        Reasonote
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '24px',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '85px',
                            fontWeight: 'bold',
                            color: 'white',
                            lineHeight: 1.1,
                            textAlign: 'center',
                            margin: 0,
                        }}
                    >
                        Reasonote
                    </h1>
                    <p
                        style={{
                            fontSize: '32px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            textAlign: 'center',
                            margin: 0,
                        }}
                    >
                        Learn anything.
                    </p>
                </div>
            </div>,
            {
                width: 1200,
                height: 630,
            }
        );
    }
} 