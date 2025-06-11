import {
  useCallback,
  useRef,
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
  ImportApkgFile,
} from "@/components/activity/components/CreateActivitiesModal/_modes/ImportApkgFile";
import {
  CreateActivitiesModalBody,
} from "@/components/activity/components/CreateActivitiesModal/CreateActivitiesModalBody";
import {
  AnkiDeck,
} from "@/components/activity/components/CreateActivitiesModal/interfaces";
import {IconBtn} from "@/components/buttons/IconBtn";
import {
  CreateCharacterDialogBody,
} from "@/components/characters/CreateCharacterDialog/CreateCharacterDialog";
import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {CharacterIcon} from "@/components/icons/CharacterIcon";
import {LessonIcon} from "@/components/icons/LessonIcon";
import {SnipIcon} from "@/components/icons/SnipIcon";
import CreateLessonModalBody from "@/components/lesson/CreateLessonModalBody";
import {
  LinearProgressWithLabel,
} from "@/components/progress/LinearProgressWithLabel";
import {Txt} from "@/components/typography/Txt";
import {
  useApolloClient,
  useMutation,
} from "@apollo/client";
import {
  AddCircle,
  ArrowBackIos,
  ArrowForwardIos,
  ImportExport,
  Publish,
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

export type HeaderAddType = 'snip' | 'character' | 'lesson' | 'activity' | 'skill' | 'chat' | 'podcast' | 'anki';


export function HeaderAddChooseType({onTypeChosen}: {onTypeChosen: (type: HeaderAddType) => void}){
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [loadingIcon, setLoadingIcon] = useState<React.ReactNode | null>(null);

    const handleTypeChosen = async (type: HeaderAddType) => {
        setIsLoading(true);
        let text = '';
        let icon: React.ReactNode | null = null;
        
        switch (type) {
            case 'podcast':
                text = 'Preparing your AI podcast...';
                icon = <PodcastIcon />;
                break;
            case 'anki':
                text = 'Importing your Anki decks...';
                icon = <ImportExport />;
                break;
        }
        
        setLoadingText(text);
        setLoadingIcon(icon);
        
        // Simulate a delay before calling onTypeChosen
        await new Promise(resolve => setTimeout(resolve, 100));
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
                    <HeaderAddChooseTypeCard
                        icon={<ImportExport />}
                        title="Import Anki Decks"
                        description="Import your Anki decks."
                        onClick={() => {
                            handleTypeChosen('anki');
                        }}
                    />
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

export function AnkiFileUploadStep({onDecksLoaded, onBack}: {onDecksLoaded: (decks: AnkiDeck[]) => void, onBack: () => void}) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        const formData = new FormData();
        formData.append('apkgFile', selectedFile);

        setLoading(true);
        try {
            const response = await fetch('/api/integrations/anki/ingest', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            
            if (data.error) {
                setError(data.error);
                return;
            }

            if (data.decks) {
                const filteredDecks = data.decks.filter((deck: AnkiDeck) => deck.cards.length > 0);
                onDecksLoaded(filteredDecks);
            } else {
                setError('No decks found in the response');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error processing Anki file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack gap={2}>
            <Stack gap={2} direction="row" alignItems={'center'}>
                <IconBtn onClick={onBack}>
                    <ArrowBackIos/>
                </IconBtn>
                <Txt startIcon={<ImportExport />} variant="h6">
                    Import Anki Decks
                </Txt>
            </Stack>

            {loading ? (
                <Stack width="100%" minWidth={'300px'} padding={'20px'}>
                    <LinearProgressWithLabel label={'Uploading and processing...'} labelPos='above' />
                </Stack>
            ) : (
                <Stack gap={2}>
                    <input 
                        type="file" 
                        accept=".apkg" 
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                    
                    <ActionCard 
                        onClick={() => {
                            fileInputRef.current?.click();
                        }} 
                        cardActionAreaProps={{sx: {padding: '50px'}}}
                    >
                        <Txt variant="h6" startIcon={<Publish/>}>Import Activities (.apkg)</Txt>
                        <Txt>Import activities from an Anki .apkg file</Txt>
                    </ActionCard>
                    
                    {error && (
                        <Card sx={{ p: 2, backgroundColor: 'error.light' }}>
                            <Typography color="error">{error}</Typography>
                        </Card>
                    )}
                </Stack>
            )}
        </Stack>
    );
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
    const [creatingType, setCreatingType] = useState<HeaderAddType | null>(null);
    const [ankiDecks, setAnkiDecks] = useState<AnkiDeck[]>([]);
    const [ankiStep, setAnkiStep] = useState<'upload' | 'import'>('upload');

    const isSmallDevice = useIsSmallDevice();

    const onCloseModal = useCallback(() => {
        setShowingModal(false);
        setCreatingType(null);
        setAnkiDecks([]);
        setAnkiStep('upload');
    }, [setShowingModal, setCreatingType])

    const handleBackToChooseType = useCallback(() => {
        setCreatingType(null);
        setAnkiDecks([]);
        setAnkiStep('upload');
    }, []);

    const handleAnkiDecksLoaded = useCallback((decks: AnkiDeck[]) => {
        setAnkiDecks(decks);
        setAnkiStep('import');
    }, []);

    const handleBackToUpload = useCallback(() => {
        setAnkiStep('upload');
        setAnkiDecks([]);
    }, []);

    return <>
        <IconButton size="small" aria-label="menu" onClick={() => {
            setShowingModal(true)
        }}>
            <AddCircle />
        </IconButton>
        <Dialog 
            open={showingModal} 
            onClose={() => setShowingModal(false)} 
            fullWidth={isSmallDevice ? true : false} 
            maxWidth={creatingType === 'anki' ? 'lg' : 'md'}
        >
            <DialogContent>
                {
                    creatingType === null ?
                        <HeaderAddChooseType onTypeChosen={(type) => {
                            if (type === 'podcast'){
                                setShowingModal(false);
                                router.push('/app/podcast/new');
                                return;
                            }
                            if (type === 'anki'){
                                setCreatingType('anki');
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
                    creatingType === 'anki' ?
                        ankiStep === 'upload' ?
                            <AnkiFileUploadStep 
                                onDecksLoaded={handleAnkiDecksLoaded}
                                onBack={handleBackToChooseType}
                            />
                        :
                            <Stack gap={2}>
                                <Stack gap={2} direction="row" alignItems={'center'}>
                                    <IconBtn onClick={handleBackToUpload}>
                                        <ArrowBackIos/>
                                    </IconBtn>
                                    <Txt startIcon={<ImportExport />} variant="h6">
                                        Import Anki Decks
                                    </Txt>
                                </Stack>
                                <ImportApkgFile decks={ankiDecks} />
                            </Stack>
                    :
                    null
                }
            </DialogContent>
        </Dialog>
    </>
}
