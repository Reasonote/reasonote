import {useCallback} from "react";

import {
  AddtoUserBotSetRoute,
} from "@/app/api/bot/add_to_user_bot_set/routeSchema";
import {
  RemoveFromUserBotSetRoute,
} from "@/app/api/bot/remove_from_user_bot_set/routeSchema";
import {useUserBots} from "@/clientOnly/hooks/useUserBots";
import {
  BookmarkAdded,
  BookmarkAddOutlined,
} from "@mui/icons-material";
import {
  IconButton,
  IconButtonProps,
  SvgIconProps,
  Tooltip,
} from "@mui/material";

export function PersonaSaveButton({
    bot,
    botId,
    iconBtnProps,
    iconProps,
}: {
    botId?: string,
    bot?: {
        id?: string,
        name: string,
        description?: string,
        prompt?: string,
    },
    iconBtnProps?: IconButtonProps,
    iconProps?: SvgIconProps,
}) {
    const userBotsRes = useUserBots();

    const theBotId = botId ?? bot?.id;
    
    // TODO: should probably be actually based on a *personality*, not the raw prompt....
    const isInUserLibrary = userBotsRes?.data.some((userBot) => (userBot.id === theBotId) || (userBot.name === bot?.name && userBot.prompt === bot?.prompt));

    const onAddToLibrary = useCallback(async () => {
        if (!botId) {
            return;
        }

        const result = await AddtoUserBotSetRoute.call({
            addIds: [botId],
        })

        userBotsRes.refetch();
    }, [botId, bot]);

    const onRemoveFromLibrary = useCallback(async () => {
        if (!botId) {
            return;
        }
        
        const result = await RemoveFromUserBotSetRoute.call({
            removeBotIds: [botId],
        })

        userBotsRes.refetch();
    }, [botId, bot]);

    
    return userBotsRes.loading ? null : (
        isInUserLibrary ?
            <Tooltip title="Remove from Library">
                <IconButton
                    {...iconBtnProps}
                    onClick={onRemoveFromLibrary}
                >
                    <BookmarkAdded
                        {...iconProps}
                        color="primary"
                    />
                </IconButton>
            </Tooltip>
            :
            <Tooltip title="Add to Library">
                    <IconButton 
                        {...iconBtnProps}
                        onClick={onAddToLibrary}
                    >    
                        <BookmarkAddOutlined 
                            {...iconProps}
                        />
                    </IconButton>
            </Tooltip>
    );
}