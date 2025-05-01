import {Grid} from "@mui/material";

export function ChatHeaderPersonas() {
  <Grid container gap={0.5}>
    {/* {chatMemberIds.map((authorId, i) => {
            const isSelected: boolean = selectedBotId === authorId;
            const isEditing: boolean = editingAuthorId === authorId;
            return (
            <Stack
                key={authorId}
                direction={"row"}
                alignItems={"center"}
            >
                <ChatBotChip
                botId={authorId}
                isSelected={isSelected}
                onSelect={(bid) => setSelectedBotId(bid)}
                onUnselect={(bid) =>
                    setSelectedBotId((stBid) =>
                    stBid !== bid ? stBid : null
                    )
                }
                isEditing={isEditing}
                setEditingBotId={(bid) => setEditingAuthorId(bid)}
                onBotDelete={(bid) =>
                    setChatMemberIds((cur) =>
                    cur.filter((c) => c !== bid)
                    )
                }
                />
            </Stack>
            );
        })} */} 
  </Grid>;
}
