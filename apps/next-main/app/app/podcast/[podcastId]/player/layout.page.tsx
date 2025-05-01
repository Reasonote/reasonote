import {
  Metadata,
  ResolvingMetadata,
} from "next";

import {
  generateMetadataForPodcasts,
} from "@/utils/nextjs/generateMetadataForPodcasts";

type Props = {
    params: { podcastId: string}
}

export async function generateMetadata(
{ params }: Props,
parent: ResolvingMetadata
): Promise<Metadata> {
    const podcastId = params.podcastId;

    return generateMetadataForPodcasts(podcastId);
}

export default function AIPodcastPlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
