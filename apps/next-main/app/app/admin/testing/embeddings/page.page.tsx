'use client'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {cosineSimilarity} from "ai";

import {
  LinearProgressWithLabel,
} from "@/components/progress/LinearProgressWithLabel";
import {
  Stack,
  Typography,
} from "@mui/material";
import {
  EmbeddingProvider,
  useEmbedding,
  useEmbeddingFunc,
} from "@reasonote/transformers-js-react-helpers";

/**
 * A list of completely random terms, that we will embed and use for testing our embeddings search
 */
const ListOfTerms = [
    '😀 Grinning Face',
    '😃 Smiling Face with Open Mouth',
    '😄 Smiling Face with Open Mouth and Smiling Eyes',
    '😁 Beaming Face with Smiling Eyes',
    '😆 Grinning Squinting Face',
    '😅 Grinning Face with Sweat',
    '😂 Face with Tears of Joy',
    '😍 Smiling Face with Heart-Eyes',
    '😎 Smiling Face with Sunglasses',
    '😏 Smirking Face',
    '🤔 Thinking Face',
    '😐 Neutral Face',
    '😑 Expressionless Face',
    '😔 Pensive Face',
    '😕 Confused Face',
    '😖 Confounded Face',
    '😗 Kissing Face',
    '😘 Face Blowing a Kiss',
    '😙 Kissing Face with Smiling Eyes',
    '😚 Kissing Face with Closed Eyes',
    '😜 Winking Face with Tongue',
    '😝 Squinting Face with Tongue',
    '😞 Disappointed Face',
    '😟 Worried Face',
    '😠 Angry Face',
    '😡 Pouting Face',
    '😢 Crying Face',
    '😣 Persevering Face',
    '😤 Face with Steam From Nose',
    '😥 Sad but Relieved Face',
    '🥰 Smiling Face with Hearts',
    '🤩 Star-Struck',
    '🤗 Hugging Face',
    '🤭 Face with Hand Over Mouth',
    '🤫 Shushing Face',
    '🤥 Lying Face',
    '😶 Face Without Mouth',
    '😬 Grimacing Face',
    '🙄 Face with Rolling Eyes',
    '😯 Hushed Face',
    '😦 Frowning Face with Open Mouth',
    '😧 Anguished Face',
    '😮 Face with Open Mouth',
    '😲 Astonished Face',
    '😴 Sleeping Face',
    '🤤 Drooling Face',
    '😪 Sleepy Face',
    '😵 Dizzy Face',
    '🤐 Zipper-Mouth Face',
    '🤢 Nauseated Face',
    '🤧 Sneezing Face',
    '🥵 Hot Face',
    '🥶 Cold Face',
    '😵‍💫 Dizzy Face',
    '🤯 Exploding Head',
    '🤠 Cowboy Hat Face',
    '🤑 Money-Mouth Face',
    '🤕 Face with Head-Bandage',
    '🤒 Face with Thermometer',
    '😷 Face with Medical Mask',
]

function MainContent() {
  const [inputText, setInputText] = useState('');
  const { data: embeddingData } = useEmbedding(inputText);
  const { embedText } = useEmbeddingFunc();
  const [embeddedTerms, setEmbeddedTerms] = useState<{term: string, embedding: number[]}[]>([]);
  const haveEmbeddedTermsRef = useRef<boolean>(false);
  const handleManualEmbedding = async () => {
    const result = await embedText?.(inputText);
    console.log('Manual embedding result:', result);
  };

  console.log({embeddingData})

  useEffect(() => {
    // Wait until model is loaded
    if (embeddingData && !haveEmbeddedTermsRef.current) {
        haveEmbeddedTermsRef.current = true;
        // Embed all of our terms
        const promises = ListOfTerms.map(async (term) => {
          console.log(`embedding term: ${term}`)
            const embedding = await embedText?.(term);
            console.log(embedding)
            return { term, embedding: embedding ?? [] };
        });
        Promise.all(promises).then((terms) => setEmbeddedTerms(terms ?? []));
    }
  }, [embeddingData, embedText])

  // Whenever the embeddingData changes, we should create a list of the search indexes with useMemo,
  // Ranked by cosine similarity to the input text
  const searchIndexes = useMemo(() => {
    if (!embeddingData || !embeddedTerms.length) {
      return [];
    }

    const inputEmbedding = embeddingData;
    const rankedTerms = embeddedTerms.map(({ term, embedding }) => ({
      term,
      similarity: cosineSimilarity(inputEmbedding, embedding),
    }));

    const sortedRankedTerms = rankedTerms.sort((a, b) => b.similarity - a.similarity);

    return sortedRankedTerms;
  }, [embeddedTerms, embeddingData]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h1 className="text-5xl font-bold mb-2 text-center">Transformers.js</h1>
      <h2 className="text-2xl mb-4 text-center">Next.js template (client-side)</h2>
      <input
        type="text"
        className="w-full max-w-xs p-2 border border-gray-300 rounded mb-4 text-black"
        placeholder="Enter text here"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button onClick={handleManualEmbedding} className="mb-4">Manual Embed</button>
      <pre className="bg-gray-100 p-2 rounded text-black w-full">
        {!!embeddingData ? <LinearProgressWithLabel lpProps={{variant: embeddingData ? 'determinate': "indeterminate"}} labelPos='above' label={!!embeddingData ? '✅ Embeddings loaded' : `Loading Embeddings 25%`} /> : null}
        {/* {embeddingData ? JSON.stringify(embeddingData, null, 2) : null} */}
      </pre>
      <div className="flex flex-col gap-2">
        {searchIndexes.map(({ term, similarity }, idx) => (
          <div key={idx}>
            <LinearProgressWithLabel lpProps={{variant: "determinate", value: similarity * 100}} labelPos='above' label={
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{term}</Typography>
                    <Typography variant="body2">{(similarity * 100).toFixed(1)}%</Typography>
                </Stack>
            } />
        </div>
        ))}
      </div>
    </main>
  );
}

export default function Home() {
  return (
      <EmbeddingProvider>
        <MainContent />
      </EmbeddingProvider>
  );
}