import {Metadata} from "next";

export async function generateMetadata({ params }: { params: { skillId: string } }): Promise<Metadata> {
  const { skillId } = params;
  
  const title = "Knowledge Graph Explorer | Reasonote";
  const description = "Visualize and explore knowledge graphs for any topic";
  
  // Use path parameter format for OG image URL
  const ogImageUrl = `/api/og/tools/knowledge-graph/${skillId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Knowledge Graph Explorer",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function KnowledgeGraphSkillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 