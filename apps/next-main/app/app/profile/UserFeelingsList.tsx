import {
  useCallback,
  useState,
} from "react";

import {TxtField} from "@/components/textFields/TxtField";
import {Txt} from "@/components/typography/Txt";
import {typedUuidV4} from "@lukebechtel/lab-ts-utils";
import {Delete} from "@mui/icons-material";
import AlbumIcon from "@mui/icons-material/Album";
import BookIcon from "@mui/icons-material/Book";
import BrushIcon from "@mui/icons-material/Brush"; // For 'artist'
import EmojiPeopleIcon
  from "@mui/icons-material/EmojiPeople"; // For 'character'
import ExtensionIcon
  from "@mui/icons-material/Extension"; // Creative choice for 'board game'
import SeasonsIcon
  from "@mui/icons-material/FilterVintage"; // Creative choice for 'season'
import MovieIcon from "@mui/icons-material/Movie";
import MusicNoteIcon from "@mui/icons-material/MusicNote"; // For 'song'
import EpisodeIcon
  from "@mui/icons-material/OndemandVideo"; // Assuming 'episode'
import PersonIcon from "@mui/icons-material/Person"; // For 'author'
import PodcastsIcon
  from "@mui/icons-material/Podcasts"; // Assuming available for 'podcast'
import StarIcon from "@mui/icons-material/Star";
import SeriesIcon from "@mui/icons-material/Theaters"; // For 'series'
import TvIcon from "@mui/icons-material/Tv";
import VideogameAssetIcon
  from "@mui/icons-material/VideogameAsset"; // For 'video game'
import {
  Autocomplete,
  Button,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import {useUserFeelings} from "./useUserFeelings";

const subjectTypeOptions: { name: string; icon: React.ReactNode }[] = [
  { name: 'movie', icon: <MovieIcon /> },
  { name: 'book', icon: <BookIcon /> },
  { name: 'character', icon: <EmojiPeopleIcon /> },
  { name: 'star', icon: <StarIcon /> },
  { name: 'author', icon: <PersonIcon /> },
  { name: 'song', icon: <MusicNoteIcon /> },
  { name: 'album', icon: <AlbumIcon /> },
  { name: 'artist', icon: <BrushIcon /> },
  { name: 'tv show', icon: <TvIcon /> },
  { name: 'episode', icon: <EpisodeIcon /> },
  { name: 'season', icon: <SeasonsIcon /> },
  { name: 'series', icon: <SeriesIcon /> },
  { name: 'video game', icon: <VideogameAssetIcon /> },
  { name: 'board game', icon: <ExtensionIcon /> },
  { name: 'podcast', icon: <PodcastsIcon /> },
];

interface UserFeeling {
    id: string;
    subject_name: string;
    subject_type: string;
    feeling: string;
}


function UserFeeling({feeling, onChange, onDelete}: {feeling: UserFeeling, onChange: (newFeeling: UserFeeling) => any, onDelete: () => any}){
    
    return <Grid container direction={'row'} gap={1} alignItems={'center'}>
        <Grid item xs={5}>
            <TxtField
                fullWidth
                size="small"
                value={feeling.subject_name} onChange={(e) => {
                    onChange({...feeling, subject_name: e.target.value});
                }}
            />
        </Grid>
        
        {/* Selector between movie, book, character, star, ... */}
        <Grid item xs={4}>
            <Select 
                size="small"
                value={feeling.subject_type}
                onChange={(e) => {
                    onChange({
                        ...feeling,
                        subject_type: e.target.value
                    });
                }}
            >
                {subjectTypeOptions.map((option) => {
                    return <MenuItem value={option.name}>
                        <Stack direction={'row'} gap={1}>
                            {option.icon}
                            <Txt>{option.name}</Txt>
                        </Stack>
                    </MenuItem>
                })}
            </Select> 
        </Grid>
        <Grid item xs={2}>
            <IconButton size="small" onClick={() => {
                onDelete();
            }}>
                <Delete />
            </IconButton>
        </Grid>
    </Grid>
}



export function UserFeelingsListOld(){
    const {data: feelings, updater: setFeelings} = useUserFeelings();

    return <div>
        {feelings?.map((feeling) => {
            return <UserFeeling 
              key={feeling.id}
              feeling={feeling}
              onChange={(newFeeling) => {
                setFeelings(feelings.map((f) => {
                    if(f.id === newFeeling.id){
                        return newFeeling;
                    }
                    return f;
                }));
              }}
              onDelete={() => {
                setFeelings(feelings.filter((f) => f.id !== feeling.id));
              }}
            />
        })}
        <Button onClick={() => {
            setFeelings([
                    ...(feelings ?? []), 
                    {
                        id: typedUuidV4('subject'),
                        subject_name: '',
                        subject_type: '',
                        feeling: 'like'
                    }
            ]);
        }}>
            Add Feeling
        </Button>
    </div>
}


const UserFeelingsControl = ({ onAddFeeling }) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedType, setSelectedType] = useState('');
  
    const handleAddFeeling = () => {
      if (!inputValue.trim() || !selectedType) return;
  
      onAddFeeling({
        id: typedUuidV4('feeling'), // Ensure a unique ID for each feeling
        subject_name: inputValue,
        subject_type: selectedType,
        feeling: 'like' // Default feeling; adjust as necessary
      });
  
      // Reset for next input
      setInputValue('');
      setSelectedType('');
    };
  
    return (
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={8}>
          <Autocomplete
            size="small"
            freeSolo
            value={inputValue}
            onChange={(event, newValue) => {
              setInputValue(newValue ?? '');
            }}
            options={[]}
            renderInput={(params) => <TextField {...params} label="Add Interest" />}
            onKeyPress={(ev) => {
              if (ev.key === 'Enter') {
                handleAddFeeling();
                ev.preventDefault();
              }
            }}
          />
        </Grid>
        <Grid item xs={4}>
          <Select
            size="small"
            fullWidth
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            displayEmpty
            inputProps={{ 'aria-label': 'Without label' }}
          >
            <MenuItem disabled value="">
              <em>Type</em>
            </MenuItem>
            {subjectTypeOptions.map((option) => (
              <MenuItem key={option.name} value={option.name}>{option.name}</MenuItem>
            ))}
          </Select>
        </Grid>
      </Grid>
    );
  };

export function UserFeelingsListNew(){
    const {data: feelings, updater: setFeelings} = useUserFeelings();

    return <UserFeelingListDumbNew
        feelings={feelings} 
        onChange={(newFeeling) => {
            setFeelings(feelings.map((f) => {
                if(f.id === newFeeling.id){
                    return newFeeling;
                }
                return f;
            }))
        }}
        onDelete={(deletedFeeling) => {
            setFeelings(feelings.filter((f) => f.id !== deletedFeeling.id));
        }}
    />
}


// UserFeelingsDisplay Component
const UserFeelingsDisplay = ({ feelings, onDeleteFeeling }) => (
    <Grid container gap={1}>
      {feelings?.map((feeling) => (
        <Chip
          key={feeling.id}
          label={`${feeling.subject_name} (${feeling.subject_type})`}
          onDelete={() => onDeleteFeeling(feeling.id)}
          style={{ margin: 2 }}
        />
      ))}
    </Grid>
);

function UserFeelingListDumbNew({ feelings, onChange, onDelete }: 
  { feelings: UserFeeling[], onChange: (newFeeling: UserFeeling) => any, onDelete: (deletedFeeling: UserFeeling) => any }) {

  const handleDelete = (chipToDelete: any) => () => {
    onDelete(chipToDelete);
  };

  return (
    <Grid container direction={'column'}>
      {feelings.map((feeling, index) => (
        <>
          <Grid item xs={5}>
            <Autocomplete
              fullWidth
              size="small"
              value={feeling.subject_name}
              options={subjectTypeOptions.map((option) => option.name)}
              renderInput={(params) => <TextField {...params} />}
              onChange={(event, newValue) => {
                onChange({ ...feeling, subject_name: newValue ?? '' });
              }}
            />
          </Grid>

          {/* Selector between movie, book, character, star, ... */}
          <Grid item xs={4}>
            {/* {feeling.subject_type.map((name) =>
              <Chip
                key={name}
                label={name}
                onDelete={handleDelete(name)}
              />
            )} */}
          </Grid>
        </>
      ))}
    </Grid>
  )
}


// Main Component to Use Them Together
export const UserFeelingsList = () => {
    const {data: feelings, updater: setFeelings} = useUserFeelings();
  
    const addFeeling = useCallback((feeling) => {
      setFeelings([...feelings, feeling]);
    }, [feelings]);
  
    const deleteFeeling = useCallback((id) => {
      setFeelings(feelings.filter((feeling) => feeling.id !== id));
    }, [feelings]);
  
    return (
      <Stack gap={1}>
        <UserFeelingsControl onAddFeeling={addFeeling} />
        <UserFeelingsDisplay feelings={feelings} onDeleteFeeling={deleteFeeling} />
      </Stack>
    );
  };

