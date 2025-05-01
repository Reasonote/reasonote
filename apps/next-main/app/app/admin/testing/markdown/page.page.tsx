
'use client'
import "katex/dist/katex.min.css";

import React, {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import FullCenter from "@/components/positioning/FullCenter";
import {useApolloClient} from "@apollo/client";
import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Button,
  Card,
  Checkbox,
  Divider,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const textSamples = {
    "full": trimLines(`
    # H1
    ## H2
    ### H3
    #### H4
    ##### H5
    ###### H6

    Text

    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.

    These<br/>Should<br/>All<br/>Be<br/>Newlines<br/><br/>This Should Have Double Newlines Around It<br/><br/>

    *Italics*


    **Bold**

    ***Bold Italics***

    <strike>Strikethrough</strike>

    # Latex
    ## Latex With \`$$\` delimiter
    $$
    \\\\sqrt{a^2 + b^2}
    \\\\sqrt{a^2}
    $$
    
    ## Latex No Newline
    <latex>
        \\\\sqrt{a^2 + b^2}
        \\\\sqrt{a^2}
    </latex>

    ## Latex Extra Newline
    <latex>
        \\\\sqrt{a^2 + b^2}

        \\\\sqrt{a^2}
    </latex>

    ## Not rendered in code block
    \`\`\`text
    <latex>
        \\\\sqrt{a^2 + b^2}
        \\\\sqrt{a^2}
    </latex>
    \`\`\`

    # Lists
    ## Unordered
    - list-item
    - list-item
    - list-item

    ## Ordered
    1. list-item
    2. list-item
    3. list-item

    ## Nested
    - list-item
        - list-item
            - list-item

    # Code
    ## Python
    \`\`\`python
    def asdf():
        print("asdf")
    \`\`\`

    ## Typescript
    \`\`\`typescript
    const asdf = () => {
        console.log("asdf")
    }
    \`\`\`


    ## Mermaid
    \`\`\`mermaid
    graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
    \`\`\`

    ## Mermaid Alternate
    \`\`\`mermaid
    graph TD;
    A-->Z;
    A-->Y;
    B-->Y;
    C-->Y;
    \`\`\`
    `),
    "3-ul": trimLines(`
    - list-item
    - list-item
    - list-item
    `),
    "3-ol": trimLines(` 
    1. list-item
    2. list-item
    3. list-item
    `),
    "3-bold-items": trimLines(`
    **bold**
    **bold**
    **bold**
    `),
}




export default function MarkdownTestingPage() {
    const [rawText, setRawText] = useState<string>(textSamples.full);
    const [predefinedSample, setPredefinedSample] = useState<keyof typeof textSamples | 'custom'>('full');


    const [fakeTyping, setFakeTyping] = useState<boolean>(true);
    const ac = useApolloClient();
    const router = useRouter();

    const [isTypingComplete, setIsTypingComplete] = useState<boolean>(false);
    const [displayText, setDisplayText] = useState('');
    const [index, setIndex] = useState(0);

    const resetTyping = () => {
        setDisplayText('');
        setIndex(0);
        setIsTypingComplete(false);
    }

    useEffect(() => {
        if (!fakeTyping) {
            setDisplayText(rawText);
            setIsTypingComplete(true);
            return;
        }

        const timeout = setTimeout(() => {
            const CHUNK_SIZE = 10;
            if (index < rawText.length) {
                setDisplayText(rawText.slice(0, index + CHUNK_SIZE));
                setIndex(index + CHUNK_SIZE);
            } else {
                setIsTypingComplete(true);
                clearTimeout(timeout);
            }
        }, 100);

        return () => {
            clearTimeout(timeout);
            setIsTypingComplete(false);
        };
    }, [index, rawText, fakeTyping]);


    const handlePredefinedSampleChange = (sample: keyof typeof textSamples | 'custom') => {
        setPredefinedSample(sample);
        if (sample === 'custom') {
            return;
        }

        setRawText(textSamples[sample]);
        resetTyping();
    }

    const handleCustomTextChange = (text: string) => {
        setPredefinedSample('custom');
        setRawText(text);
        resetTyping();
    }

    return <FullCenter>
        <Card sx={{padding: '10px', width: '700px'}}>
            <Stack gap={2}>
                <TextField 
                    value={rawText} 
                    onChange={(e) => {
                        handleCustomTextChange(e.target.value)
                    }}
                    multiline
                    maxRows={10}
                />
                <Select
                    value={predefinedSample}
                    onChange={(e) => {
                        handlePredefinedSampleChange(e.target.value as keyof typeof textSamples | 'custom')
                    }}
                >
                    {Object.keys(textSamples).map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
                    <MenuItem value={'custom'}>Custom</MenuItem>
                </Select>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography>Fake Typing:</Typography>
                    <Checkbox
                        checked={fakeTyping}
                        onChange={(e) => {
                            setFakeTyping(e.target.checked)
                            resetTyping()
                        }}
                    />
                    {isTypingComplete && <Button onClick={resetTyping}>Reset</Button>}
                </Stack>
                <Divider/>
                <Stack >
                    <Typography variant={'h5'}>
                        MuiMarkdownDefault
                    </Typography>
                    <Card sx={{padding: '10px', overflow: 'scroll', maxHeight: '300px'}} elevation={10}>
                        <MuiMarkdownDefault animateTyping animateTypingSpeed={1000}>
                            {displayText}
                        </MuiMarkdownDefault>
                    </Card>

                    {/* <BotMessage i={1} msg={{
                        content: displayText,
                    }}/> */}
                </Stack>
                
            </Stack>
        </Card>
    </FullCenter>
}