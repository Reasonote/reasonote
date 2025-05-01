import {
  useEffect,
  useState,
} from "react";

import {aib} from "@/clientOnly/ai/aib";
import {
  Add as AddIcon,
  EditNote,
  Info,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  Stack,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  ChooseTheBlankActivityConfig,
  ChooseTheBlankResult,
} from "@reasonote/activity-definitions";
import {
  ActivityRenderArgs,
  staticValidateActivityTypeClient,
} from "@reasonote/core/src/interfaces/ActivityTypeClient";

import {
  ChooseTheBlankActivity,
  WordChoice,
} from "../render";

export function getHiddenWords(data: ChooseTheBlankActivityConfig): string[] {  
    const text = data.text;

    // Use regex to find span elements with an id of "hidden-word-<index>"
    // Also should grab until the last </span> tag.
    const matches = text.matchAll(/<span id="hidden-word-(\d+)">(.*?)<\/span>/g);

    return Array.from(matches).map((match) => match[2]);
}

export function validateAndUpdateWordChoices(hiddenWords: string[], wordChoices: string[]): {isValid: boolean, newWordChoices: string[]} {

    let isValid = true;
    // Count required occurrences of each hidden word
    const requiredCounts = hiddenWords.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Count current occurrences in word choices
    const currentCounts = wordChoices.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Create new word choices array starting with original choices
    const newWordChoices = [...wordChoices];

    // Add missing occurrences of each hidden word
    Object.entries(requiredCounts).forEach(([word, requiredCount]) => {
        const currentCount = currentCounts[word] || 0;
        const missing = requiredCount - currentCount;
        if (missing > 0) {
            isValid = false;
            // Add the word the required number of times
            for (let i = 0; i < missing; i++) {
                newWordChoices.push(word);
            }
        }
    });

    return {
        isValid,
        newWordChoices
    };
}


interface EditableWordChipProps {
    wordChoice: WordChoice;
    onDelete: () => void;
    onEdit: (newWord: string) => void;
    startEditing?: boolean;
}

function EditableWordChip({ wordChoice, onDelete, onEdit, startEditing = false }: EditableWordChipProps) {
    const [isEditing, setIsEditing] = useState(startEditing);
    const [editValue, setEditValue] = useState(wordChoice.word);

    useEffect(() => {
        if (startEditing) {
            setIsEditing(true);
        }
    }, [startEditing]);

    return isEditing ? (
        <TextField
            size="small"
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
                if (editValue.trim()) {
                    onEdit(editValue.trim());
                } else {
                    onDelete();
                }
                setIsEditing(false);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    if (editValue.trim()) {
                        onEdit(editValue.trim());
                    } else {
                        onDelete();
                    }
                    setIsEditing(false);
                }
            }}
            sx={{ maxWidth: '150px' }}
        />
    ) : (
        <Chip
            label={wordChoice.word}
            onClick={() => setIsEditing(true)}
            onDelete={onDelete}
        />
    );
}

interface EditorProps {
    config: ChooseTheBlankActivityConfig;
    setConfig: (config: ChooseTheBlankActivityConfig) => void;
}

function ChooseTheBlankEditor({ config, setConfig }: EditorProps) {
    const [validationError, setValidationError] = useState<string | null>(null);
    const hiddenWords = getHiddenWords(config);

    const generateId = (word: string) => {
        return `${word}-${Math.random().toString(36).slice(2, 11)}`;
    };

    const [wordChoices, setWordChoices] = useState<WordChoice[]>(() => 
        config.wordChoices.map((word) => ({
            id: generateId(word),
            word
        }))
    );

    useEffect(() => {
        setConfig({
            ...config,
            wordChoices: wordChoices.map(wc => wc.word)
        });
    }, [wordChoices]);

    const checkWordChoices = (newChoices: WordChoice[]) => {
        const {isValid} = validateAndUpdateWordChoices(hiddenWords, newChoices.map(wc => wc.word));
        if (!isValid) {
            setValidationError(`Unable to update word choices. You tried to delete or edit a word that is the answer to one of the blanks.`);
            return false;
        }
        setValidationError(null);
        setWordChoices(newChoices);
        return true;
    };

    const updateWordChoices = (newChoices: WordChoice[]) => {
        const {newWordChoices} = validateAndUpdateWordChoices(hiddenWords, newChoices.map(wc => wc.word));
        setWordChoices(newWordChoices.map((word, index) => {
            const existing = newChoices.find(wc => wc.word === word);
            return existing || {
                id: generateId(word),
                word
            };
        }));
    };

    const addNewWordChoice = () => {
        const tempId = generateId('new');
        const newWordChoice: WordChoice = {
            id: tempId,
            word: ''
        };
        setWordChoices([...wordChoices, newWordChoice]);
    };

    return (
        <Stack spacing={2}>
            <TextField 
                multiline
                label="Question Text"
                value={config.text}
                onChange={(e) => {
                    const newText = e.target.value;
                    setConfig({
                        ...config,
                        text: newText
                    });
                }}
                onBlur={() => {
                    updateWordChoices(wordChoices);
                }}
                maxRows={5}
            />
            <Stack gap={2}>
                <Typography variant="subtitle1">Word Choices:</Typography>
                {validationError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {validationError}
                    </Alert>
                )}
                <Stack direction="row" gap={1} flexWrap="wrap">
                    {wordChoices.map((wordChoice) => (
                        <EditableWordChip
                            key={wordChoice.id}
                            wordChoice={wordChoice}
                            onDelete={() => {
                                if (!wordChoice.word) {
                                    setWordChoices(wordChoices.filter(wc => wc.id !== wordChoice.id));
                                    return;
                                }
                                checkWordChoices(wordChoices.filter(wc => wc.id !== wordChoice.id));
                            }}
                            onEdit={(newWord) => {
                                if (!newWord) {
                                    setWordChoices(wordChoices.filter(wc => wc.id !== wordChoice.id));
                                    return;
                                }
                                checkWordChoices(
                                    wordChoices.map(wc => 
                                        wc.id === wordChoice.id ? { ...wc, word: newWord } : wc
                                    )
                                );
                            }}
                            startEditing={!wordChoice.word}
                        />
                    ))}
                </Stack>
                <Stack direction="row" gap={1}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addNewWordChoice}
                    >
                        Add Word
                    </Button>
                </Stack>
            </Stack>
            <Accordion>
                <AccordionSummary>
                    <Stack direction={'row'} alignItems={'center'} gap={2}>
                        <Info />
                        <Typography>Formatting Tips</Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2">Use <code>{`<span id="hidden-word-1">Hidden Words</span>`}</code> to indicate where the blank should be.</Typography>
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
}

/**
 * A helper class for multiple choice activities.
 * 
 * We prefer static methods, so that we are encouraged to 
 * rely on the backend for state.
 */
export class ChooseTheBlankActivityTypeClient {
    static type: 'choose-the-blank' = 'choose-the-blank';

    /**
     * Render the ChooseTheBlank activity.
     * @param args The arguments to render the activity.
     * @returns The rendered activity.
     */
    static render(args: ActivityRenderArgs<ChooseTheBlankActivityConfig, any>){
        return <ChooseTheBlankActivity 
            {...args}
        /> as any
    }

    static renderEditor(args: {
        config: ChooseTheBlankActivityConfig,
        setConfig: (config: ChooseTheBlankActivityConfig) => void
    }){
        return <ChooseTheBlankEditor {...args} />;
    }

    static renderEditorPreview(args: {
        config: ChooseTheBlankActivityConfig
    }){
        return <ChooseTheBlankActivity
            ai={aib}
            config={args.config}
        />
    }

    static renderTypeIcon(iconProps: SvgIconProps){
        return <EditNote {...iconProps} />
    }

    static async getCompletedTip(result: ChooseTheBlankResult): Promise<string | undefined> {    
        if (result?.feedback?.aboveTheFoldAnswer) {
            return result.feedback.aboveTheFoldAnswer;
        }
        return undefined;
    }
}


staticValidateActivityTypeClient(ChooseTheBlankActivityTypeClient);
