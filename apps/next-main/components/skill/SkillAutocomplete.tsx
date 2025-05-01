import React, {
  useEffect,
  useState,
} from "react";

import {
  GetSimilarSkillsRoute,
} from "@/app/api/skills/get_similar_skills/routeSchema";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  Autocomplete,
  Chip,
  CircularProgress,
  TextField,
} from "@mui/material";
import {useAsyncMemoFancy} from "@reasonote/lib-utils-frontend";

export interface AutocompleteSkill {
    /**
     * If the skill exists in the database, this is the ID of the skill.
     */
    id?: string;
    /**
     * The name of the skill.
     */
    name: string;
}

interface SkillAutocompleteProps {
  onCreateSkill: (skill: AutocompleteSkill) => void;
  onSkillsChange?: (skills: AutocompleteSkill[]) => void;
  initialSkills?: AutocompleteSkill[];
}

const SkillAutocomplete: React.FC<SkillAutocompleteProps> = ({ onCreateSkill, onSkillsChange, initialSkills }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<AutocompleteSkill[]>(initialSkills ?? []);
  const [loading, setLoading] = useState(false);

  const [skillsFilteredBySearch] = useAsyncMemoFancy(async () => {
    if (inputValue && inputValue.trim().length > 0) {
      setLoading(true);
      const res = await GetSimilarSkillsRoute.call({
        skill: {
          type: 'stub',
          name: inputValue
        },
        nameMatchThreshold: 0.5
      });
      setLoading(false);
      if (res.data) {
        return res.data.similarSkills.filter(notEmpty) ?? [];
      }
    } else {
      return [];
    }
  }, [inputValue]);

  const handleCreateSkill = async (newSkillName: string) => {
    if (newSkillName && !skillsFilteredBySearch?.find(skill => skill.name === newSkillName)) {
        const newSkill: AutocompleteSkill = { name: newSkillName };
        onCreateSkill(newSkill);
        setSelectedSkills([...selectedSkills, newSkill]);
        setInputValue('');
    }
  };

  const handleSkillChange = async (event: React.SyntheticEvent, value: (AutocompleteSkill | string)[]) => {
    const asSkills = value
        .map((v) => typeof v === 'string' ? 
            { id: v, name: v.startsWith('+') ? v.slice(2) : v }
            :
            { id: v.id, name: v.name.startsWith('+') ? v.name.slice(2) : v.name }
        )

    const newSkills = asSkills.filter(skill => !selectedSkills.find(s => s.id === skill.id));
    const newSkill = newSkills.length > 0 ? newSkills[0] : null;
    if (newSkill) {
      await handleCreateSkill(newSkill.name);
    }

    setSelectedSkills(asSkills);
  };

  const handleInputChange = (event: React.ChangeEvent<{}>, value: string) => {
    setInputValue(value);
  };

  useEffect(() => {
    onSkillsChange?.(selectedSkills);
  }, [selectedSkills]);

  const noExistingSkill = !skillsFilteredBySearch?.find(skill => skill.name === inputValue);
  const allOptions = noExistingSkill ? 
    [
        ...(inputValue && inputValue.trim().length > 0 ? [{ id: inputValue, name: `+ ${inputValue}` }] : []), 
        ...(skillsFilteredBySearch ?? [])
    ] : skillsFilteredBySearch;

  return (
    <Autocomplete
      multiple
      options={allOptions ?? [] as any[]}
      getOptionLabel={((option: AutocompleteSkill) => option.name) as any}
      value={selectedSkills}
      onChange={handleSkillChange as any}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      freeSolo
      renderTags={(value: AutocompleteSkill[], getTagProps) =>
        value.map((option: AutocompleteSkill, index: number) => (
          <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search or Add a Skill"
          variant="outlined"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id ?? option.name}>
          {option.name}
        </li>
      )}
    />
  );
};

export default SkillAutocomplete;