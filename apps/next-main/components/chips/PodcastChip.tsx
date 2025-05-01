import {
  Chip,
  Skeleton,
} from "@mui/material";
import {usePodcastFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {SimpleSkillChipWithAutoEmoji} from "./SkillChip/SkillChipWithAutoEmoji";

export function PodcastChip({ podcastId }: { podcastId: string }) {
    const { data: podcast, loading } = usePodcastFlatFragLoader(podcastId);

    if (!podcast && !loading) {
        return null;
    }
    if (loading || !podcast?.title) {
        return <Skeleton variant="rounded" width={100} height={30}>
            <Chip label={'Loading...'} />
        </Skeleton>
    }

    return <SimpleSkillChipWithAutoEmoji skillName={podcast?.title} />
}