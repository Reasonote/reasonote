import React, {useState} from "react";

import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Popover,
  TextField,
} from "@mui/material";

import {SkillEmojiAvatar} from "../../skill/SkillEmojiAvatar";
import {
  SkillChip,
  SkillChipProps,
} from "./SkillChip";

type SkillChipSkillSelectorProps = Omit<SkillChipProps, 'onSimpleClick'> & {
  onSelectSkill: (skillId: string) => void;
  searchPlaceholder?: string;
};

export function SkillChipSkillSelector({ 
  onSelectSkill, 
  searchPlaceholder = "Search or select a skill",
  ...rest 
}: SkillChipSkillSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { skills } = useUserSkills();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm("");
  };

  const handleSelectSkill = (skillId: string) => {
    onSelectSkill(skillId);
    handleClose();
  };

  const filteredSkills = skills?.filter(skill =>
    skill.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Box>
      <SkillChip
        {...rest}
        onSimpleClick={handleClick}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1.5, width: 250 }}>
          <TextField
            autoFocus
            margin="dense"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          />
          <List sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
            {filteredSkills.map((skill) => (
              <ListItem
                key={skill.id}
                onClick={() => skill.id && handleSelectSkill(skill.id)}
                button
                dense
                sx={{ py: 0.5 }}
              >
                <SkillEmojiAvatar 
                  skillId={skill.id ?? ''} 
                  size={24} 
                  emojiSizeRatio={0.5} // Adjust this value to make the emoji smaller
                  sx={{ mr: 1 }} 
                />
                <ListItemText 
                  primary={skill.name} 
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    sx: { fontSize: '0.8rem' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Box>
  );
}