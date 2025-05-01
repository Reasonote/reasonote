import {Rule} from "@mui/icons-material";
import {Chip} from "@mui/material";

interface ScoreChipProps {
  score: number;
  'data-testid'?: string;
}

export function ScoreChip({ score, 'data-testid': testId }: ScoreChipProps) {
  const scoreColor = score > .8 ? 'success' : score > .6 ? 'warning' : 'error';
  const label = `${(score * 100).toFixed(1)}%`;

  return <Chip sx={{width: 'max-content'}} size={'small'} color={scoreColor} avatar={<Rule color={scoreColor as any}/>} label={label} variant="outlined" data-testid={testId}/>
}