'use client'

import {useState} from "react";

import _ from "lodash";

import {SearchRsnVecRoute} from "@/app/api/internal/search_rsn_vec/routeSchema";
import FullCenter from "@/components/positioning/FullCenter";
import {SearchBox} from "@/components/search/searchbox";
import {Search} from "@mui/icons-material";
import {
  Box,
  Card,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

export default function Home() {
  const [matches, setMatches] = useState<any[]>([]);
  const [textValue, setTextValue] = useState<string>("");
  const [tableName, setTableName] = useState<string>("");
  const [embeddingType, setEmbeddingType] = useState<'embedding' | 'embedding_openai_text_embedding_3_small'>('embedding');
  const [threshold, setThreshold] = useState<number>(0.6);
  const [useSearchBox, setUseSearchBox] = useState(false);

  useAsyncEffect(async () => {
    if (!textValue.trim()) {
      setMatches([]);
      return;
    }

    // Find the most similar result
    const {data: matchVectorsResult} = await SearchRsnVecRoute.call({
      text: textValue,
      embeddingColumn: embeddingType,
      matchThreshold: threshold,
      tablename: tableName.trim() || undefined,
    });

    const matchVectors = matchVectorsResult?.data;

    console.log({matchVectors, matchVectorsResult});

    if(matchVectors) {
      setMatches(matchVectors.map((v: any) => ({
        id: v.id,
        raw_content: v.raw_content,
        similarity: v.similarity,
        result_tablename: v.result_tablename,
        result_colname: v.result_colname,
      })));
    }
  }, [textValue, embeddingType, threshold, tableName]);

  return (
    <FullCenter>
      <Card sx={{padding: '10px', maxWidth: '800px', width: '100%'}}>
        <Stack gap={1} alignItems={'center'}>
          <Typography variant="h5">Search</Typography>
          
          {/* Search Input Section */}
          <Stack direction="row" gap={1} alignItems={'center'} width="100%">
            <Search/>
            {useSearchBox ? (
              <SearchBox onInputValueChange={(value) => setTextValue(value)}/>
            ) : (
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />
            )}
          </Stack>

          {/* Controls Section */}
          <Stack direction="row" gap={2} alignItems="center" width="100%" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Table name (optional)"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              sx={{ minWidth: '150px' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={useSearchBox}
                  onChange={(e) => setUseSearchBox(e.target.checked)}
                />
              }
              label="Use SearchBox"
            />
            <ToggleButtonGroup
              value={embeddingType}
              exclusive
              onChange={(e, newValue) => {
                if (newValue) setEmbeddingType(newValue);
              }}
              aria-label="embedding type"
              size="small"
            >
              <ToggleButton value="embedding" aria-label="Xenova">
                Xenova
              </ToggleButton>
              <ToggleButton value="embedding_openai_text_embedding_3_small" aria-label="OpenAI">
                OpenAI
              </ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ width: '200px' }}>
              <Typography gutterBottom variant="body2" color="text.secondary">
                Relevance Threshold: {(threshold * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={threshold}
                onChange={(_, value) => setThreshold(value as number)}
                min={0}
                max={1}
                step={0.05}
                aria-label="Relevance threshold"
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </Box>
          </Stack>

          {/* Results Section */}
          <Stack gap={1} width="100%" height="100%" maxHeight="500px" overflow="auto">
            {matches.length > 0 ? (
              matches.map((match) => (
                <Stack key={match.id} gap={1}>
                  <Card sx={{ width: '100%', p: 2, height: 'fit-content' }}>
                    <Typography variant="body2" color="text.secondary">
                      Similarity: {(match.similarity * 100).toFixed(1)}%, Table: {match.result_tablename}, Column: {match.result_colname}
                    </Typography>
                  <Typography variant="body1">
                    {match.raw_content}
                    </Typography>
                  </Card>
                </Stack>
              ))
            ) : textValue ? (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No matches found above the threshold
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Card>
    </FullCenter>
  );
}