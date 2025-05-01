import {useQuery} from "@apollo/client";
import {
  GetBotFlatDocument,
  GetBotSetWithBotsDocument,
} from "@reasonote/lib-sdk-apollo-client";

import {useRsnUser} from "./useRsnUser";

export interface UseUserBotsArgs {
    disableDefault?: boolean;
}

export function useUserBots({disableDefault}: UseUserBotsArgs = {}) {
    const { rsnUserId } = useRsnUser();
    
    const userBotsRes = useQuery(GetBotSetWithBotsDocument, {
        variables: {
          filter: {
            forUser: {
              eq: rsnUserId,
            },
          },
    }});

    // Also get the default bot, unless disabled
    const defaultBot = useQuery(GetBotFlatDocument, {
        variables: {
          filter: {
            id: {eq: 'bot_01010101-0101-0101-0101-010134501073'}
          },
    }});

    const bots = userBotsRes.data?.botSetCollection?.edges?.[0]?.node?.botSetBotCollection?.edges.map(
        edge => ({
            ...edge.node.bot,
        }),
    ) ?? [];
    
    return {
        data: [
            ...bots,
            ...(disableDefault ? [] : defaultBot.data?.botCollection?.edges.map(
                edge => ({
                    ...edge.node,
                }),
            ) ?? []),
        ],
        loading: userBotsRes.loading,
        error: userBotsRes.error,
        refetch: userBotsRes.refetch,
    };
}