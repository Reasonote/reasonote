import {
  useCallback,
  useState,
} from "react";

import {
  AddtoUserBotSetRoute,
} from "@/app/api/bot/add_to_user_bot_set/routeSchema";
import {PersonAdd} from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";

import {useSupabase} from "../../supabase/SupabaseProvider";
import {TxtFieldWithAction} from "../../textFields/TxtFieldWithAction";
import {Txt} from "../../typography/Txt";

export interface CreateCharacterDialogProps {
    onCharacterCreated: (botId: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function CreateCharacterDialogBody(props: {onCancel, onCharacterCreated: (botId: string) => void}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [prompt, setPrompt] = useState('');

    const {sb} = useSupabase();

    const onCreate = useCallback(async () => {
        if (!name){
            return;
        }

        const {data, error} = await sb.from('bot').insert({
            name,
            description,
            prompt 
        }).select('*').single();

        
        if (!data){
            return;
        }
        
        const addUserResp = await AddtoUserBotSetRoute.call({
            addIds: [data.id]
        })

        if (addUserResp.error){
            console.error('Error adding bot to user bot set:', addUserResp.error);
        }

        props.onCharacterCreated(data.id);
    }, [name, description, prompt]);

    return <>
        <Stack width="400px" gap={1} paddingY={"10px"}>
            <TxtFieldWithAction
                label={'Name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                // actionIcon={<AutoAwesome/>}
            />
            <TxtFieldWithAction
                label={'Description'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                // actionIcon={<AutoAwesome/>}
                maxRows={5}
                minRows={2}
            />
            <TxtFieldWithAction
                label={'Prompt'}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                multiline
                maxRows={5}
                minRows={2}
                // actionIcon={<AutoAwesome/>}
            />
        </Stack>
        <DialogActions>
            <Button onClick={() => props.onCancel()}>
                Cancel
            </Button>
            <Button onClick={onCreate} disabled={!name || name.length < 2}>
                Create
            </Button>
        </DialogActions>
    </>
}

export function CreateCharacterDialog(props: CreateCharacterDialogProps) {
    const {open, setOpen} = props;
    
    return (
        <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>
                <Txt variant="h6" startIcon={<PersonAdd/>}>
                    Create Character
                </Txt>
            </DialogTitle>
            <DialogContent>
                <CreateCharacterDialogBody onCancel={() => setOpen(false)} onCharacterCreated={props.onCharacterCreated}/>
            </DialogContent>
        </Dialog>
    )
}