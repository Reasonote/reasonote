// import {
//     useCallback,
//     useState,
//   } from "react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import EmojiPicker from "emoji-picker-react";

import {useApolloClient} from "@apollo/client";
import {
  Description,
  Label,
  Lock,
  MoreHoriz,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Popover,
  Skeleton,
  Stack,
} from "@mui/material";
import {updateBotFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useBotFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {TxtField} from "../textFields/TxtField";
import {Txt} from "../typography/Txt";

//   import {
//     AddtoUserBotSetRoute,
//   } from "@/app/api/bot/add_to_user_bot_set/routeSchema";
//   import {PersonAdd} from "@mui/icons-material";
//   import {
//     Button,
//     Dialog,
//     DialogActions,
//     DialogContent,
//     DialogTitle,
//     Stack,
//   } from "@mui/material";
  
//   import {useSupabase} from "../supabase/SupabaseProvider";
//   import {TxtFieldWithAction} from "../textFields/TxtFieldWithAction";
//   import {Txt} from "../typography/Txt";
  
//   export interface CreateCharacterDialogProps {
//       onCharacterCreated: (botId: string) => void;
//       open: boolean;
//       setOpen: (open: boolean) => void;
//   }
  
//   export function CreateCharacterDialog(props: CreateCharacterDialogProps) {
//       const {open, setOpen} = props;
//       const [name, setName] = useState('');
//       const [description, setDescription] = useState('');
//       const [prompt, setPrompt] = useState('');
  
//       const {sb} = useSupabase();
  
//       const onCreate = useCallback(async () => {
//           if (!name){
//               return;
//           }
  
//           const {data, error} = await sb.from('bot').insert({
//               name,
//               description,
//               prompt 
//           }).select('*').single();
  
          
//           if (!data){
//               return;
//           }
          
//           const addUserResp = await AddtoUserBotSetRoute.call({
//               addIds: [data.id]
//           })
  
//           if (addUserResp.error){
//               console.error('Error adding bot to user bot set:', addUserResp.error);
//           }
  
//           props.onCharacterCreated(data.id);
//           setOpen(false);
//       }, [name, description, prompt]);
  
//       return (
//           <Dialog open={open} onClose={() => setOpen(false)}>
//               <DialogTitle>
//                   <Txt variant="h6" startIcon={<PersonAdd/>}>
//                       Create Character
//                   </Txt>
//               </DialogTitle>
//               <DialogContent>
//                   <Stack width="400px" gap={1} paddingY={"10px"}>
//                       <TxtFieldWithAction
//                           label={'Name'}
//                           value={name}
//                           onChange={(e) => setName(e.target.value)}
//                           // actionIcon={<AutoAwesome/>}
//                       />
//                       <TxtFieldWithAction
//                           label={'Description'}
//                           value={description}
//                           onChange={(e) => setDescription(e.target.value)}
//                           // actionIcon={<AutoAwesome/>}
//                           maxRows={5}
//                           minRows={2}
//                       />
//                       <TxtFieldWithAction
//                           label={'Prompt'}
//                           value={prompt}
//                           onChange={(e) => setPrompt(e.target.value)}
//                           multiline
//                           maxRows={5}
//                           minRows={2}
//                           // actionIcon={<AutoAwesome/>}
//                       />
//                   </Stack>
//               </DialogContent>
//               <DialogActions>
//                   <Button onClick={() => setOpen(false)}>
//                       Cancel
//                   </Button>
//                   <Button onClick={onCreate} disabled={!name || name.length < 2}>
//                       Create
//                   </Button>
//               </DialogActions>
//           </Dialog>
//     )
// }
// }

function OurEmojiPicker({emoji, onEmojiPicked}: {emoji: string | undefined | null, onEmojiPicked: (emoji: string) => void}){
    const [show, setShow] = useState(false);
    // return <Tooltip open={show} title={<EmojiPicker/>} onClick={(orig) => setShow(!orig)}>
    //     <Avatar onClick={() => setShow(!show)}>
    //         {emoji}
    //     </Avatar>
    // </Tooltip>
    // TODO: same thing but with a popover and a ref
    const ref = useRef<HTMLDivElement>(null);

    return <>
        <Avatar onClick={() => setShow(!show)} ref={ref}
            sx={{'&:hover': {cursor: 'pointer'}}}
        >
            {emoji}
        </Avatar>
        <Popover
            open={show}
            anchorEl={ref.current}
            onClose={() => setShow(false)}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
        >
            <EmojiPicker onEmojiClick={(e) => {
                onEmojiPicked?.(e.emoji);
            }}/>
        </Popover>
    </>

}


export function EditCharacter({botId}: {botId: string}){
    const botRes = useBotFlatFragLoader(botId);
    const ac = useApolloClient();
    const [emoji, setEmoji] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [prompt, setPrompt] = useState('');
    const [hasLoaded, setHasLoaded] = useState(false);
    const [showingEmojiPicker, setShowingEmojiPicker] = useState(false);

    const canEdit = botId !== 'bot_01010101-0101-0101-0101-010134501073';

    useEffect(() => {
        const bot = botRes.data;
        if (!botRes.loading && bot && !hasLoaded){
            setHasLoaded(true);
            
            setEmoji(bot.avatarEmoji ?? '');
            setName(bot.name ?? '');
            setDescription(bot.description ?? '');
            setPrompt(bot.prompt ?? '');
        }
    }, [botRes]);

    const emojiHasChanged = hasLoaded && emoji !== botRes.data?.avatarEmoji;
    const nameHasChanged = hasLoaded && name !== botRes.data?.name;
    const descriptionHasChanged = hasLoaded && description !== botRes.data?.description;
    const promptHasChanged = hasLoaded && prompt !== botRes.data?.prompt;

    const canSave = emojiHasChanged || nameHasChanged || descriptionHasChanged || promptHasChanged;

    return botRes.loading ?
        <Skeleton variant="rectangular" width="100%" height="100%"/>
        :
        botRes.data ? 
            <Stack gap={2} paddingY={'5px'}>
                {
                    !canEdit ? 
                    <Txt startIcon={<Lock/>} variant={'body1'}>This Character is Read Only</Txt>
                    :
                    null
                }
                <Stack gap={2} direction={'row'} alignItems={'center'}>
                    <OurEmojiPicker emoji={emoji} onEmojiPicked={(e) => setEmoji(e)}/>
                    <TxtField 
                        disabled={!canEdit}
                        fullWidth
                        startIcon={<Label
                            color={nameHasChanged ? 'warning' : undefined}
                        />}
                        label="Name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                    />
                </Stack>
                <TxtField
                    disabled={!canEdit}
                    startIcon={<MoreHoriz
                        color={descriptionHasChanged ? 'warning' : undefined}
                    />}
                    multiline
                    minRows={1}
                    maxRows={5}
                    label="Description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                />
                <TxtField
                    disabled={!canEdit}
                    startIcon={<Description
                        color={promptHasChanged ? 'warning' : undefined}
                    />}
                    multiline
                    maxRows={10}
                    minRows={3}
                    label="Prompt" 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <Button 
                    onClick={() => {
                        ac.mutate({
                            mutation: updateBotFlatMutDoc,
                            variables: {
                                set: {
                                    avatarEmoji: emoji,
                                    name,
                                    description,
                                    prompt
                                },
                                filter: {
                                    id: {
                                        eq: botId
                                    }
                                },
                                atMost: 1
                            }
                        })
                    }}
                    disabled={!canSave || !canEdit}
                >
                    Save
                </Button>
            </Stack>
            :
            <Txt>Bot not found</Txt>
}
