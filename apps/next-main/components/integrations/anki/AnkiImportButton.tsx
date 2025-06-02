import React, {useState} from "react";

import {ActionCard} from "@/app/app/activities/new/page.page";
import {
  LinearProgressWithLabel,
} from "@/components/progress/LinearProgressWithLabel";
import {Txt} from "@/components/typography/Txt";
import {Publish} from "@mui/icons-material";
import {Stack} from "@mui/material";

export interface AnkiImportButtonProps {
    onImport({decks}: {decks: {id: string, name: string, cards: {id: string, front: string, back: string}[]}[]}): void;
}

export function AnkiImportButton({onImport}: AnkiImportButtonProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [resp, setResp] = useState<any>(null);

    const fileInput = React.createRef<HTMLInputElement>();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (!file) return;

        const formData = new FormData();
        formData.append('apkgFile', file);

        setLoading(true);
        try {
            const response = await fetch('/api/integrations/anki/ingest', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setResp(data.decks);

            if (!data.decks) return;

            onImport({decks: data.decks.filter((deck: any) => deck.cards.length > 0)});
        } catch (error) {
            console.error('Error:', error);
            setResp(null);
        } finally {
            setLoading(false);
        }
    };

    return <Stack>
        <input 
            type="file" 
            accept=".apkg" 
            ref={fileInput}
            style={{
                display: 'none'
            }}
            onChange={handleFileUpload}
        />
        {
            loading ? 
                <Stack width="100%" minWidth={'300px'} padding={'20px'}>
                    <LinearProgressWithLabel label={'Uploading and processing...'} labelPos='above' />
                </Stack>
                :
                <ActionCard 
                    onClick={() => {
                        fileInput.current?.click();
                    }} 
                    cardActionAreaProps={{sx: {padding: '50px'}}}
                >
                    <Txt variant="h6" startIcon={<Publish/>}>Import Activities (.apkg)</Txt>
                    <Txt>Import activities from an Anki .apkg file</Txt>
                </ActionCard>
        }
    </Stack>
}