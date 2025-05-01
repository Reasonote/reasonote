"use client";

import {
  useCallback,
  useState,
} from "react";

// import {createWorker} from "tesseract.js";
import wiki from "wikipedia";

import FullCenter from "@/components/positioning/FullCenter";
import AutoAvatar from "@/components/users/profile/AutoAvatar";
import CroppedAvatar from "@/components/users/profile/CroppedAvatar";
import {
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function Page() {
  const [searchRes, setSearchRes] = useState<any>(null);
  const [foundText, setFoundText] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [committedName, setCommittedName] = useState<string | null>(null);

  const getImage = useCallback(async () => {
    // Clear existing
    setSrc(null);
    setCommittedName(name);

    // Search wikipedia
    const res = await wiki.search(name);
    const json = await res.results[0];
    setSearchRes(json);

    if (json) {
      const resAgain = await wiki.summary(json.title);

      const src = resAgain?.thumbnail?.source;

      if (src) {
        setSrc(src);

        (async () => {
          // const worker = await createWorker('eng');
          // const ret = await worker.recognize(src);
          // console.log(ret.data.text);
          // setFoundText(ret.data.text);
          // await worker.terminate();
        })();
      }
    }
  }, [name]);
  

  return (
    <FullCenter>
      <Paper elevation={3} sx={{ padding: "10px" }}>
        <Stack>
          <TextField onChange={(e) => setName(e.target.value)} value={name} />
          <Button onClick={getImage}>Get Image</Button>

          <Stack width={'400px'}>
            {src && <img src={src} /> }
            {foundText && <Typography>{foundText}</Typography>}
          </Stack>
          

          <AutoAvatar name={committedName} />

          <AutoAvatar name={"Barack Obama"} />
          <AutoAvatar name={"Mother Theresa"} />
          <AutoAvatar name={"Donald Trump"} />
          <CroppedAvatar
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/320px-President_Barack_Obama.jpg"
            box={{
              xMin: 0,
              width: 256,
              yMin: 0,
              height: 256,
            }}
          />
          <CroppedAvatar
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Mother_Teresa_1.jpg/320px-Mother_Teresa_1.jpg"
            box={{
              xMin: 0,
              width: 256,
              yMin: 0,
              height: 256,
            }}
          />
        </Stack>
      </Paper>
    </FullCenter>
  );
}
