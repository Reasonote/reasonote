"use client"
import React from "react";

// import {
//   convertEmojiEncoding,
// } from "@/components/activity/activities/TeachTheAIActivity/server";
import {TextField} from "@mui/material";
import {Stack} from "@mui/system";

export default function UnicodeTestPage(){
    const [value, setValue] = React.useState('');

    return <Stack>
        <TextField value={value} onChange={(e) => setValue(e.target.value)} />

        <div>
            <p>Value: {value}</p>
            <p>Length: {value.length}</p>
            <p>Converted: {value.split('').map((char) => char.charCodeAt(0)).join(', ')}</p>
            {/* <p>Fully Converted: {convertEmojiEncoding(value)}</p> */}
            <p>JSONParsed: {JSON.parse(`"${value}"`)}</p>
        </div>
    </Stack>
}