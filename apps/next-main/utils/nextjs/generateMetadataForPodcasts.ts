import {Database} from "@reasonote/lib-sdk";
import {createBrowserSupabaseClient} from "@supabase/auth-helpers-nextjs";

export async function generateMetadataForPodcasts(podcastId: string) {
    const supabase = createBrowserSupabaseClient<Database>({supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY});
  
    // Fetch podcast data
    const podcast = await supabase.from('podcast').select('*').eq('id', podcastId).single();

    if (podcast.error) {
        return {
        title: 'Reasonote Podcast',
        description: 'Learn anything.',
        openGraph: {
            title: 'Reasonote Podcast',
            description: 'Learn anything.',
        },
        }
    }
    
    // Fallback values if podcast data is not available
    const title = podcast?.data?.title || 'Reasonote Podcast';
    const description = 'Learn anything, with AI-Generated Podcasts.';
    const imageUrl = 'https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images/voronoi-bg.png';

    return {
        title: title,
        description: description,
        openGraph: {
        title: title,
        description: description,
        images: [
            {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
            },
        ],
        type: 'website',
        },
        twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [imageUrl],
        },
    }
};