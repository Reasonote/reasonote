export async function generateMetadata() {
    try {
        return {
            title: `A Vision for the Future of Education | Reasonote`,
            description: `A Vision for the Future of Education`,
            openGraph: {
                title: `A Vision for the Future of Education`,
                description: `Reimagining education in the age of information and AI.`,
                images: [
                    {
                        url: `/static/images/vision-for-the-future-of-education-header.jpg`,
                        width: 1200,
                        height: 630,
                        alt: `A Vision for the Future of Education`
                    }
                ],
                type: 'profile',
            },
            twitter: {
                card: 'summary_large_image',
                title: `A Vision for the Future of Education`,
                description: `Reimagining education in the age of information and AI.`,
                images: [
                    {
                        url: `/static/images/vision-for-the-future-of-education-header.jpg`,
                        width: 1200,
                        height: 630,
                        alt: `A Vision for the Future of Education`
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
                description: "The mind is not a vessel to be filled, but a fire to be kindled.",
                images: [
                    {
                        url: `/static/images/vision-for-the-future-of-education-header.jpg`, // Will return fallback image
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