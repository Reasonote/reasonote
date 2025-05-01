import {useState} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Chip,
  InputBase,
  Paper,
  Stack,
} from "@mui/material";

import {AccessLevelSelect} from "./AccessLevelSelect";
import {ShareRole} from "./ShareEntityModal";

interface ShareEmailInputProps {
  selectedEmails: string[];
  onEmailsChange: (emails: string[]) => void;
  selectedRole: ShareRole;
  onRoleChange: (role: ShareRole) => void;
}

export function ShareEmailInput({ 
  selectedEmails, 
  onEmailsChange,
  selectedRole,
  onRoleChange
}: ShareEmailInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && inputValue) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(inputValue)) {
        onEmailsChange([...selectedEmails, inputValue]);
        setInputValue('');
      }
    }
  };

  const handleDelete = (emailToDelete: string) => {
    onEmailsChange(selectedEmails.filter(email => email !== emailToDelete));
  };

  const isSmallDevice = useIsSmallDevice();

  return (
    <Stack direction={isSmallDevice ? 'column' : 'row'} spacing={1} alignItems="center" width="100%">
      <Paper
        data-testid="share-email-input-container"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          flexGrow: 1,
          p: 0.5,
          gap: 0.5,
          border: '1px solid',
          borderColor: 'divider',
          width: isSmallDevice ? '100%' : undefined,
        }}
      >
        {selectedEmails.map((email) => (
          <Chip
            key={email}
            data-testid={`share-email-chip-${email}`}
            label={email}
            onDelete={() => handleDelete(email)}
            size="small"
          />
        ))}
        <InputBase
          inputProps={{
            'data-testid': 'share-email-input'
          }}
          sx={{ ml: 1, flex: 1 }}
          placeholder="Add people by email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </Paper>
      <AccessLevelSelect
        data-testid="share-email-role-select"
        value={selectedRole}
        onChange={onRoleChange}
      />
    </Stack>
  );
} 