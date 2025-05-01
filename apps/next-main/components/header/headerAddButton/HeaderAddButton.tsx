import {
  useCallback,
  useState,
} from "react";

import {PodcastIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import validator from "validator";

import {ActionCard} from "@/app/app/activities/new/page.page";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {
  CreateActivitiesModalBody,
} from "@/components/activity/components/CreateActivitiesModal/CreateActivitiesModalBody";
import {IconBtn} from "@/components/buttons/IconBtn";
import {
  CreateCharacterDialogBody,
} from "@/components/characters/CreateCharacterDialog/CreateCharacterDialog";
import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {CharacterIcon} from "@/components/icons/CharacterIcon";
import {LessonIcon} from "@/components/icons/LessonIcon";
import {SnipIcon} from "@/components/icons/SnipIcon";
import CreateLessonModalBody from "@/components/lesson/CreateLessonModalBody";
import {Txt} from "@/components/typography/Txt";

import {
  useApolloClient,
  useMutation,
} from "@apollo/client";
import {
  AddCircle,
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createSnipFlatMutDoc,
  ExtractionState,
} from "@reasonote/lib-sdk-apollo-client";

export function HeaderAddChooseTypeCard({icon, title, description, onClick}: {icon: React.ReactNode, title: string, description: string, onClick: () => void}){
    return <ActionCard onClick={onClick}>
        <Stack direction="row" gap={2} justifyContent={'space-between'} alignItems={'center'}>
            <Stack direction="row" gap={2}>
                {icon}
                <Stack>
                    <Typography>{title}</Typography>
                    <Typography variant="caption">{description}</Typography>
                </Stack>
            </Stack>
            <ArrowForwardIos/>
        </Stack>
    </ActionCard>
}


export function HeaderAddChooseType({onTypeChosen}: {onTypeChosen: (type: 'snip' | 'character' | 'lesson' | 'activity' | 'skill' | 'chat' | 'podcast') => void}){
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [loadingIcon, setLoadingIcon] = useState<React.ReactNode | null>(null);

    const handleTypeChosen = async (type: 'snip' | 'character' | 'lesson' | 'activity' | 'skill' | 'chat' | 'podcast') => {
        setIsLoading(true);
        let text = '';
        let icon: React.ReactNode | null = null;
        
        switch (type) {
            case 'podcast':
                text = 'Preparing your AI podcast...';
                icon = <PodcastIcon />;
                break;
            // Add cases for other types if needed
        }
        
        setLoadingText(text);
        setLoadingIcon(icon);
        
        // Simulate a delay before calling onTypeChosen
        await new Promise(resolve => setTimeout(resolve, 1000));
        onTypeChosen(type);
    };

    return (
        <Stack gap={2}>
            {isLoading ? (
                <Card>
                    <Stack width="100%" maxWidth={400} padding={2}>
                        <Stack direction="row" gap={1} alignItems="center">
                            {loadingIcon}
                            <Stack>
                                <Txt variant="body1" gutterBottom>
                                    {loadingText}
                                </Txt>
                                <Txt variant="body2" gutterBottom color="text.secondary">
                                    This should only take a few seconds...
                                </Txt>
                            </Stack>
                        </Stack>
                        <LinearProgress />
                    </Stack>
                </Card>
            ) : (
                <>
                    <HeaderAddChooseTypeCard
                        icon={<PodcastIcon />}
                        title="Create Podcast"
                        description="Create a new podcast episode."
                        onClick={() => {
                            handleTypeChosen('podcast');
                        }}
                    />
                    {/* Add other HeaderAddChooseTypeCard components here if needed */}
                </>
            )}
        </Stack>
    );
}

export function CreateCharacterBody({onCancel, onComplete}: {onCancel, onComplete?: (args: {botId: string}) => void}){
    const router = useRouter();
    
    return <CreateCharacterDialogBody
        onCancel={onCancel} 
        onCharacterCreated={(botId: string) => {
            if (onComplete){
                onComplete({
                    botId
                })
            }
        }}
    />
}

export function HeaderAddSnipCreateModalContent({onComplete}: {onComplete?: (args: {snipId: string}) => void}){
    const rsnUserId = useRsnUserId();
    const [createSnip] = useMutation(createSnipFlatMutDoc);
    const [createdSnipId, setCreatedSnipId] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string>('');
    const router = useRouter(); 

    return <Stack spacing={2}>
        <Typography>
            Paste, Type, or Upload Something (URL, Text, etc.)
        </Typography>
        
        <TextField 
            label="Text Content"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={textContent}
            onChange={(ev) => {
                setTextContent(ev.target.value);
            }}
        />

        <Button onClick={async () => {

            // Check if it seems like it's a url
            const isUrl = validator.isURL(textContent);

            const snipResult = await createSnip({
                variables: {
                    objects: [
                        {
                            type: isUrl ? 'url' : 'text',
                            textContent: isUrl ? null : textContent,
                            sourceUrl: isUrl ? textContent : null,
                            owner: rsnUserId,
                            extractionState: isUrl ? ExtractionState.Pending : ExtractionState.Unnecessary
                        }
                    ]
                }
            });

            const snipId = snipResult.data?.insertIntoSnipCollection?.records?.[0]?.id;

            if (snipId && onComplete){
                onComplete({
                    snipId
                })
            }
        }}>
            Create Snip
        </Button>
    </Stack>
}


export function HeaderAddContentTypeChosen({type, onBack, onComplete}: {type: 'snip' | 'character' | 'lesson' | 'activity' | 'skill', onBack: () => void, onComplete?: (args: {type: 'snip' | 'character' | 'lesson' | 'activity' | 'skill', ids: string[]}) => void}){
    const isSmallDevice = useIsSmallDevice();    


    return <Stack gap={2}>
        <Stack gap={2} direction="row" alignItems={'center'}>
            <IconBtn onClick={onBack}>
                <ArrowBackIos/>
            </IconBtn>
            <Txt startIcon={
                type === 'snip' ? <SnipIcon /> : type === 'character' ? <CharacterIcon /> : type === 'lesson' ? <LessonIcon /> : type === 'activity' ? <ActivityIcon /> : null
            } variant="h6">
                {type === 'snip' ? 'Create a Snip' : type === 'character' ? 'Create a Character' : type === 'lesson' ? 'Create a Lesson' : type === 'activity' ? 'Create Activities' : 'Create a Skill'}
            </Txt>
        </Stack>
        {
            type === 'snip' ?
                <HeaderAddSnipCreateModalContent
                    onComplete={(args) => {
                        if (onComplete){
                            onComplete({
                                type: 'snip',
                                ids: [args.snipId]
                            })
                        }
                    }}
                />
            :
            type === 'character' ?
                <CreateCharacterBody onComplete={(args) => {
                    if (onComplete){
                        onComplete({
                            type: 'character',
                            ids: [args.botId]
                        })
                    }
                }} onCancel={() => {
                    onBack();
                }}/>
            :
            type === 'lesson' ? 
                <CreateLessonModalBody 
                    stackProps={{gap: 2, width: '100%'}}
                    onCreate={(args) => {
                        if (onComplete){
                            onComplete({
                                type: 'lesson',
                                ids: [args.lessonId]
                            })
                        }
                    }}
                />
            :
            type === 'activity' ?
                    <CreateActivitiesModalBody
                        stackProps={{ gap: 2, width: '100%'}}
                        onCreated={(args) => {
                            if (onComplete) {
                                onComplete({
                                    type: 'activity',
                                    ids: args.activityIds
                                });
                            }
                        }}
                        onCancel={function (): void {
                            throw new Error("Function not implemented.");
                        }}
                    />
            :
            null
        }
    </Stack>
}


export function HeaderAddButton(){
    const rsnUserId = useRsnUserId();
    const [showingModal, setShowingModal] = useState(false)
    const [createSnip] = useMutation(createSnipFlatMutDoc);
    const [createdSnipId, setCreatedSnipId] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const {token} = useToken();
    const ac = useApolloClient();
    const router = useRouter();
    const [creatingType, setCreatingType] = useState<'snip' | 'character' | 'lesson' | 'activity' | 'skill' | null>(null);

    const isSmallDevice = useIsSmallDevice();

    const onCloseModal = useCallback(() => {
        setShowingModal(false);
        setCreatingType(null);
    }, [setShowingModal, setCreatingType])

    return <>
        <IconButton size="small" aria-label="menu" onClick={() => {
            setShowingModal(true)
        }}>
            <AddCircle />
        </IconButton>
        <Dialog open={showingModal} onClose={() => setShowingModal(false)} fullWidth={isSmallDevice ? true : false} maxWidth="md">
            <DialogContent>
                {
                    creatingType === null ?
                        <HeaderAddChooseType onTypeChosen={(type) => {
                            if (type === 'podcast'){
                                setShowingModal(false);
                                router.push('/app/podcast/new');
                                return;
                            }
                            // Comment out or remove other type checks
                            /*
                            else {
                                setCreatingType(type);
                            }
                            */
                        }}/>
                        :
                        null // Remove or modify this part if needed
                }
            </DialogContent>
        </Dialog>
    </>
}
