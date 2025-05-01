import {
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";

import {ShareRole} from "./ShareEntityModal";

interface AccessLevelSelectProps {
  value: ShareRole;
  onChange: (role: ShareRole) => void;
  'data-testid'?: string;
}

export function AccessLevelSelect({ value, onChange, 'data-testid': testId }: AccessLevelSelectProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as ShareRole);
  };

  return (
    <Select
      data-testid={testId}
      value={value}
      onChange={handleChange}
      size="small"
      sx={{
        minWidth: 120,
        height: 40,
      }}
      renderValue={(selected) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{selected}</Typography>
      )}
    >
      <MenuItem value="Viewer" data-testid="share-role-option-viewer">
        <Stack>
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>Viewer</Typography>
          <Typography variant="caption" color="text.secondary">
            Can view
          </Typography>
        </Stack>
      </MenuItem>
      <MenuItem value="Commenter" data-testid="share-role-option-commenter">
        <Stack>
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>Commenter</Typography>
          <Typography variant="caption" color="text.secondary">
            Can view and comment
          </Typography>
        </Stack>
      </MenuItem>
      <MenuItem value="Editor" data-testid="share-role-option-editor">
        <Stack>
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>Editor</Typography>
          <Typography variant="caption" color="text.secondary">
            Can view, edit, and comment
          </Typography>
        </Stack>
      </MenuItem>
    </Select>
  );
} 