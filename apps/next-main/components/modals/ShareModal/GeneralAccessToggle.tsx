import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import {
  Stack,
  Switch,
  Typography,
} from "@mui/material";

interface GeneralAccessToggleProps {
  isPublic: boolean;
  onChange: (value: boolean) => void;
}

export function GeneralAccessToggle({ isPublic, onChange }: GeneralAccessToggleProps) {
  return (
    <Stack 
      direction="row" 
      spacing={2} 
      alignItems="center"
      sx={{ 
        p: 2, 
        borderRadius: 1 
      }}
    >
      {isPublic ? <PublicIcon /> : <LockIcon />}
      <Stack flexGrow={1}>
        <Typography variant="subtitle2">
          {isPublic ? 'Anyone with the link' : 'Restricted'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isPublic 
            ? 'Anyone on the internet with the link can view' 
            : 'Only people with access can open with the link'}
        </Typography>
      </Stack>
      <Switch
        inputProps={{
          // @ts-ignore
          'data-testid': 'share-public-toggle'
        }}
        checked={isPublic}
        onChange={(e) => onChange(e.target.checked)}
      />
    </Stack>
  );
} 