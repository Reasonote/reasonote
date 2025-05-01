'use client'
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {Settings} from "lucide-react";

import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useUserSkillData} from "@/clientOnly/hooks/useUserSkillData";
import {SkillChipWithLoading} from "@/components/chips/SkillChip/SkillChip";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  EmojiObjects,
  MilitaryTech,
  Psychology,
  School,
  WorkspacePremium,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const LEVEL_OPTIONS = ['NOVICE', 'BEGINNER', 'ADEPT', 'PRO', 'EXPERT'];

const LEVEL_DESCRIPTIONS = {
  NOVICE: "Just starting out with little to no experience",
  BEGINNER: "Basic understanding but limited practical experience",
  ADEPT: "Competent with some practical experience",
  PRO: "Advanced skills with significant experience",
  EXPERT: "Mastery level with deep knowledge and extensive experience",
};

const LEVEL_ICONS = {
  NOVICE: School,
  BEGINNER: EmojiObjects,
  ADEPT: Psychology,
  PRO: WorkspacePremium,
  EXPERT: MilitaryTech,
};

// Helper function to capitalize the first letter
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export default function SkillSettingsPage() {
  const { skillId } = useRouteParamsSingle(['skillId']);
  const {supabase} = useSupabase();
  const rsnUserId = useRsnUserId();

  const {refetch} = useUserSkillData(skillId ?? '')

  const [interestReasons, setInterestReasons] = useState<string[]>([]);
  const [newReason, setNewReason] = useState('');
  const [selfAssignedLevel, setSelfAssignedLevel] = useState('');
  const [initialInterestReasons, setInitialInterestReasons] = useState<string[]>([]);
  const [initialSelfAssignedLevel, setInitialSelfAssignedLevel] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  useEffect(() => {
    if (skillId) {
      fetchUserSkillData();
    }
  }, [skillId]);

  const fetchUserSkillData = useCallback(async () => {
    if (!skillId || !rsnUserId) {
      return;
    }

    const { data, error } = await supabase
      .from('user_skill')
      .select('interest_reasons, self_assigned_level')
      .eq('skill', skillId)
      .eq('rsn_user', rsnUserId)
      .single();
    
    refetch()

    if (error) {
      console.error('Error fetching user skill data:', error);
    } else if (data) {
      setInterestReasons(data.interest_reasons || []);
      setSelfAssignedLevel(data.self_assigned_level || '');
      setInitialInterestReasons(data.interest_reasons || []);
      setInitialSelfAssignedLevel(data.self_assigned_level || '');
    }
  }, [skillId, supabase, rsnUserId, refetch]);

  const handleAddReason = useCallback(() => {
    if (newReason && !interestReasons.includes(newReason)) {
      setInterestReasons([...interestReasons, newReason]);
      setNewReason('');
    }
  }, [newReason, interestReasons]);

  const handleRemoveReason = useCallback((reason: string) => {
    setInterestReasons(interestReasons.filter(r => r !== reason));
  }, [interestReasons]);

  const handleSave = useCallback(async () => {
    if (!skillId) {
      return;
    }

    const { error } = await supabase
      .from('user_skill')
      .upsert({
        skill: skillId,
        rsn_user: rsnUserId || '',
        interest_reasons: interestReasons,
        self_assigned_level: selfAssignedLevel,
      }, {
        onConflict: 'rsn_user,skill'
      });
    
    refetch()

    if (error) {
      console.error('Error saving user skill data:', error);
    } else {
      setIsToastOpen(true);
      setInitialInterestReasons(interestReasons);
      setInitialSelfAssignedLevel(selfAssignedLevel);
    }
  }, [skillId, rsnUserId, interestReasons, selfAssignedLevel, supabase]);

  const hasChanges = useCallback(() => {
    return (
      JSON.stringify(interestReasons) !== JSON.stringify(initialInterestReasons) ||
      selfAssignedLevel !== initialSelfAssignedLevel
    );
  }, [interestReasons, selfAssignedLevel, initialInterestReasons, initialSelfAssignedLevel]);

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      handleAddReason();
    }
  };

  return (
    <Stack height={'100%'} width={'100%'} alignItems={'center'}>
      <Stack gap={3} p={2} maxWidth={'600px'} width={'100%'} alignContent={'center'}>
        <Stack direction={'row'} justifyContent={'start'} gap={2}>
          <Txt startIcon={<Settings/>} variant="h5" textAlign={'center'}>Settings For</Txt>
          <SkillChipWithLoading topicOrId={skillId}  disableAddDelete disableModal disableLevelIndicator/>
        </Stack>

        <Box>
          <Typography variant="h6" gutterBottom>Self-Assigned Level</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            How would you rate your current skill level in this area?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Self-Assigned Level</InputLabel>
            <Select
              value={selfAssignedLevel}
              onChange={(e) => setSelfAssignedLevel(e.target.value)}
              label="Self-Assigned Level"
            >
              {LEVEL_OPTIONS.map((level) => {
                const Icon = LEVEL_ICONS[level];
                return (
                  <MenuItem key={level} value={level}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Icon />
                      <Stack>
                        <Typography variant="body1">{capitalizeFirstLetter(level)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {LEVEL_DESCRIPTIONS[level]}
                        </Typography>
                      </Stack>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>Reasons for Interest</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Why are you interested in learning this skill? Add your reasons below.
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
            {interestReasons.map((reason) => (
              <Chip
                key={reason}
                label={reason}
                onDelete={() => handleRemoveReason(reason)}
              />
            ))}
          </Stack>
          <Stack direction="row" gap={1}>
            <TextField
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a reason"
              fullWidth
            />
            <Button onClick={handleAddReason} variant="contained">Add</Button>
          </Stack>
        </Box>

        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!hasChanges()}
        >
          Save Settings
        </Button>

        <Snackbar
          open={isToastOpen}
          autoHideDuration={6000}
          onClose={() => setIsToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setIsToastOpen(false)} severity="success" sx={{ width: '100%' }}>
            Settings saved successfully!
          </Alert>
        </Snackbar>
      </Stack>
    </Stack>
  );
}
