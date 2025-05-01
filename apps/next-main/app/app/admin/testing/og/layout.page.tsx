import {genBase64ImageFromReact2} from "openGraph/generateOgImage";

export async function generateMetadata(args) {
    // For example, use the URL path or slug as the text in your image
    const pathName = Array.isArray(args.params.slug) ? args.params.slug.join('/') : (args.params.slug || 'home');
    const imageUrl = await genBase64ImageFromReact2(
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'url(https://qqlmpugonlnzzzgdhtfj.supabase.co/storage/v1/object/public/public-images//Reasonote-Icon-BG.png)',
                backgroundSize: '100% auto',
                backgroundPosition: 'center',
                backgroundColor: '#4F46E5', // fallback color
                overflow: 'hidden',
            }}
        >
            {/* Add a semi-transparent overlay for better text readability */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    // background: 'linear-gradient(45deg, rgba(79, 70, 229, 0.85), rgba(124, 58, 237, 0.85))',
                }}
            />
            
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    position: 'relative', // to appear above the overlay
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
        </div>
    );
  
    return {
      title: 'Dynamic OG Image Example',
      openGraph: {
        title: 'Dynamic OG Image Example',
        description: 'An example page using a dynamically generated Base64 image.',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Open Graph Dynamic Image'
          }
        ],
        type: 'website'
      }
    };
}

export default function Layout({children}: {children: React.ReactNode}) {
    return children;
}