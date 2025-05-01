import { Database } from "@reasonote/lib-sdk";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

export async function generateMetadataForCourses(courseId: string) {
    const supabase = createBrowserSupabaseClient<Database>({ supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY });

    // Fetch podcast data
    const { data, error } = await supabase.from('course')
        .select('_name, _description, cover_image_url').eq('id', courseId).single();

    console.log(data);
    if (error) {
        return {
            title: 'Reasonote Course',
            description: 'Learn anything.',
            openGraph: {
                title: 'Reasonote Course',
                description: 'Learn anything.',
            },
        }
    }

    // Fallback values if course data is not available
    const title = data?._name || 'Reasonote Course';
    const description = data?._description || 'Learn anything, with AI-Generated Courses.';
    const imageUrl = data?.cover_image_url || '/static/images/Reasonote-Icon-1.png';

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