import {
  FormEvent,
  FormEventHandler,
  useCallback,
  useState,
} from "react";

import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {useToken} from "@/clientOnly/hooks/useToken";
import {useApolloClient} from "@apollo/client";
import {jwtBearerify} from "@lukebechtel/lab-ts-utils";
import {AddCircle} from "@mui/icons-material";
import {
  Autocomplete,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface CreateSkillAutocompleteProps{
    initSelectedSkills?: string[];
    onSetSelectedSkills?: (a: (oldskills: string[]) => string[]) => any;
    onInput?: FormEventHandler<HTMLInputElement>;
    onSaveStart?: (skills: string[]) => any;
    onSaveComplete?: (skills: string[]) => any;
}

export function CreateSkillAutocomplete({
    initSelectedSkills,
    onSetSelectedSkills,
    onInput,
    onSaveStart,
    onSaveComplete,
    ...props
}: CreateSkillAutocompleteProps){
    const [selectedSkills, setSelectedSkills] = useState<string[]>(initSelectedSkills ?? [])
    const [inputValue, setInputValue] = useState<string>("")
    const [saving, setSaving] = useState<boolean>(false);
    const ac = useApolloClient();
    const {token} = useToken();

    const _onSetSelectedSkills = useCallback((a: (oldskills: string[]) => string[]) => {
        setInputValue("")
        const newSkills = a(selectedSkills)
        setSelectedSkills(newSkills)
        onSetSelectedSkills?.(a)
    }, [selectedSkills, onSetSelectedSkills])

    const _onInput = useCallback((ev: FormEvent<HTMLInputElement>) => {
        //@ts-ignore
        const value = ev.target.value;
        setInputValue(value)
        onInput?.(ev)
    }, [onInput])

    const [refreshCount, setRefreshCount] = useState(0);

    const onSave = useCallback(async () => {
        const newSelectedSkills = [...selectedSkills, inputValue].filter((s) => s.trim().length > 0)

        if (newSelectedSkills.length === 0) return;

        _onSetSelectedSkills((skills) => newSelectedSkills)
        setRefreshCount(refreshCount + 1)
        setSaving(true);

        onSaveStart?.(newSelectedSkills)

        // Save to user skill set
        await AddtoUserSkillSetRoute.call({
            addSkills: newSelectedSkills.map((sk) => ({
                name: sk
            }))
        },
        {
            headers: {
                Authorization: jwtBearerify(token ?? '') ?? '',
            },
        })

        await ac.refetchQueries({
            include: ['getSkillSetWithSkills']
        })

        setSaving(false);
        setSelectedSkills([]);
        onSaveComplete?.(newSelectedSkills)

        onSetSelectedSkills?.((skills) => newSelectedSkills)
    }, [inputValue, onSetSelectedSkills, selectedSkills, token, ac, onSaveStart, onSaveComplete, _onSetSelectedSkills])

    

    return <Grid container direction={"row"} alignItems={'center'} justifyContent={'space-between'}>
        <Grid item xs={11}>
            <CreateSkillAutocompleteDumb 
                key={refreshCount}
                selectedSkills={selectedSkills}
                setSelectedSkills={_onSetSelectedSkills}
                onInput={_onInput}
            />
        </Grid>
        <Grid item xs={1}>
            {
            saving ? 
                <>
                    <CircularProgress />
                </>
                :
                <Stack alignItems={'center'} justifyItems={'center'}>
                    <IconButton 
                        disabled={selectedSkills.length === 0}
                        onClick={() => {
                            onSave()
                        }}
                        color={selectedSkills.length > 0 ? "primary" : "gray"}
                    >
                        <AddCircle />
                    </IconButton>
                    {
                        selectedSkills.length > 0 && 
                            <Typography variant={'caption'} color={'primary'}>
                                Add
                            </Typography>
                    }
                </Stack>
            }
        </Grid>
    </Grid>
}


interface CreateSkillAutocompleteDumbProps {
    selectedSkills: string[];
    setSelectedSkills?: (a: (oldskills: string[]) => string[]) => any;
    onInput?: FormEventHandler<HTMLInputElement>
}

export function CreateSkillAutocompleteDumb({
    selectedSkills,
    setSelectedSkills,
    onInput
}: CreateSkillAutocompleteDumbProps) {
    return <Stack>
        <Autocomplete
            multiple
            id="tags-filled"
            options={[]}
            defaultValue={[]}
            value={selectedSkills}
            freeSolo
            renderTags={(value: readonly string[], getTagProps) =>
                value.map((option: string, index: number) => (
                    <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                    />
                ))
            }
            onChange={(event: any, newValue: string[] | null) => {
                console.log("ON CHANGE")
                setSelectedSkills?.((skills) => (newValue ? newValue : skills));
            }}
            onInput={onInput}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="filled"
                    label="Add Skills"
                    placeholder="My New Skill"
                />
            )}
        />
    </Stack>
}