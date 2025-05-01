"use client";
import {useState} from "react";

import _ from "lodash";

import {trimLines} from "@lukebechtel/lab-ts-utils";
import {
  Button,
  Card,
  LinearProgress,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import {SupabaseClient} from "@supabase/supabase-js";

import {useSupabase} from "../../components/supabase/SupabaseProvider";
import {genesisText} from "./genesis";

const textDocuments = [
  {
    id: "DOCUMENT-1",
    title: "Document 1",
    text: trimLines(`
        Hello, this is a document.
        It has some text in it.
        It's not very interesting.

        But here, we talk about elephants.

        And that's key.

        Whenever we talk about something with a trunk, we're talking about elephants.


        This is a new paragraph. This is an unrelated paragraph.

        What about talking about something with tusks?
    `),
  },
  {
    id: "DOCUMENT-2",
    title: "Genesis",
    text: genesisText,
  },
];

// async function getMatchingChunks(
//   sb: SupabaseClient,
//   targetText: string,
//   docId?: string
// ): Promise<{ raw_content: string; id: string; similarity: number }[]> {
//   const generateEmbedding = await pipeline(
//     "feature-extraction",
//     "Supabase/gte-small"
//   );

//   // Generate an embedding for the random line
//   const randomLineEmbeddingResult = await generateEmbedding(targetText, {
//     pooling: "mean",
//     normalize: true,
//   });
//   const randomLineEmbedding = Array.from(randomLineEmbeddingResult.data);

//   // Find the most similar result
//   const { error: matchError, data: matchVectors } = await sb.rpc(
//     "match_rsn_vec",
//     {
//       match_embedding: randomLineEmbedding,
//       match_threshold: 0.6,
//       match_count: 10,
//       min_content_length: 5,
//     }
//   );

//   console.log({ matchError, matchVectors })

//   if (!matchVectors) {
//     console.error("Failed to get match vectors", matchError);
//     return [];
//   }

//   return matchVectors.map((v: any) => ({
//     id: v.id,
//     raw_content: v.raw_content,
//     similarity: v.similarity,
//   }));
// }

async function addNewDocument(
  sb: SupabaseClient,
  doc: { doc_name: string; doc_body: string },
  opts: {
    chunkSize?: number;
    processingCallback?: (chunkIndex: number, chunkCount: number) => void;
  }
) {
  // const generateEmbedding = await pipeline(
  //   "feature-extraction",
  //   "Supabase/gte-small"
  // );

  const { chunkSize = 10, processingCallback = () => {} } = opts;

  // Store the document in Postgres
  const { data: textDocData } = await sb
    .from("rsn_page")
    .insert({
      _name: doc.doc_name,
      body: doc.doc_body,
    })
    .select();

  console.log("textDocData", textDocData);

  if (!textDocData) {
    throw new Error("Failed to insert text document into Postgres");
  }

  const theId = (textDocData[0] as any).id;

  console.log("theId", theId);

  // Split the doc by lines.
  const docByLines = doc.doc_body
    .split("\n")
    .map((l, idx) => ({ line_idx: idx, text: l }));

  // Split the doc by chunks.
  const chunks = _.chunk(docByLines, chunkSize);

  const maxChunksAtOnce = 10;
  const processingChunks = _.chunk(chunks, maxChunksAtOnce);
  var idx = 0;

  for (const procChnk of processingChunks) {
    console.log(
      `Handling chunks ${idx * maxChunksAtOnce} to ${
        idx * maxChunksAtOnce + procChnk.length
      }`
    );
    idx += 1;
    processingCallback && processingCallback(idx, processingChunks.length);
    // For each chunk, generate an embedding.
    await Promise.all(
      procChnk.map(async (chunk, index) => {
        const firstLine = chunk.reduce((acc, c) => {
          if (acc === undefined) {
            return c.line_idx;
          } else {
            return Math.min(acc, c.line_idx);
          }
        }, undefined as number | undefined);

        const chunkText = chunk.map((c) => c.text).join("\n");

        // Store the embedding in Postgres
        // Generate a vector using Transformers.js
        // const output = await generateEmbedding(chunkText, {
        //   pooling: "mean",
        //   normalize: true,
        // });

        // Extract the embedding output
        // const embedding = Array.from(output.data);
        // const { data: rsnPageVector } = await sb
        //   .from("rsn_page_vector")
        //   .insert({
        //     rsn_page_id: (textDocData[0] as any).id,
        //     // TODO: the offset should probably be Character-Level, not Line-Level
        //     rsn_page_offset: firstLine,
        //     embedding: embedding,
        //     raw_content: chunkText,
        //   })
        //   .select();
      })
    );
  }

  return theId;
}

export default function DocumentsPage() {
  // const { rsnUserId, licenseTypes, rsnUserSysdata } = useRsnUser();
  // const isSmallDevice = useIsSmallDevice()
  const { supabase } = useSupabase();
  const [doc, setDoc] = useState(textDocuments[0].text);
  const [searchFieldContent, setSearchFieldContent] = useState("elephant");
  const [matches, setMatches] = useState([] as any[]);
  const [docId, setDocId] = useState(undefined);
  const [docLoadingPerc, setDocLoadingPerc] = useState<number | undefined>(
    undefined
  );

  const updateChunks = async () => {
    // const chunks = await getMatchingChunks(supabase, searchFieldContent, docId);

    // setMatches(chunks);
  };

  return (
    <div style={{ height: "100dvh", width: "100vw", padding: "10px" }}>
      <Grid container gap={1} gridAutoFlow={"row"} direction={"column"}>
        <Button onClick={() => setDoc(textDocuments[0].text)}>
          Load Document 1
        </Button>
        <Button onClick={() => setDoc(textDocuments[1].text)}>
          Load Genesis
        </Button>
        <TextField
          multiline
          value={doc}
          onChange={(ev) => setDoc(ev.target.value)}
          maxRows={10}
        />
        <Button
          onClick={async () => {
            const resId = await addNewDocument(
              supabase,
              {
                doc_name: "anything",
                doc_body: doc,
              },
              {
                chunkSize: 10,
                processingCallback: (idx, total) => {
                  setDocLoadingPerc((idx / total) * 100);
                },
              }
            );

            setDocId(resId);
          }}
        >
          Update Document
        </Button>
        <LinearProgress variant="determinate" value={docLoadingPerc ?? 0} />
        <TextField
          multiline
          value={searchFieldContent}
          onChange={(ev) => setSearchFieldContent(ev.target.value)}
        />
        <Button onClick={updateChunks}>Search</Button>

        <Grid container gap={1} gridAutoFlow={"row"} direction={"column"}>
          {matches.map((m, idx) => (
            <div key={idx}>
              <Card>
                <div>
                  {idx} (Similarity: {_.round(m.similarity, 2)})
                </div>
                <div key={m.id} style={{ whiteSpace: "pre-line" }}>
                  {m.raw_content}
                </div>
              </Card>
            </div>
          ))}
        </Grid>
      </Grid>
    </div>
  );
}
