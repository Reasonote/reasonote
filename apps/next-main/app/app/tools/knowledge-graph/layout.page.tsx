import {Metadata} from "next";

import KnowledgeGraphPage from "./page.page";

export async function generateMetadata(args: any): Promise<Metadata> {
  const title = "Knowledge Graph Explorer | Reasonote";
  const description = "Visualize and explore knowledge graphs for any topic";

  console.log("Generating metadata for Knowledge Graph Explorer");
  console.log(args);
  // Base OG image URL without any skillId
  const ogImageUrl = `/api/og/tools/knowledge-graph`;
  
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

export default function Page({ searchParams }: { searchParams: { skillId?: string } }) {
  return <KnowledgeGraphPage />;
} 