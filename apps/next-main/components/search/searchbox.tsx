import React, {
  useEffect,
  useState,
} from "react";

import {SearchRsnVecRoute} from "@/app/api/internal/search_rsn_vec/routeSchema";
import {DocumentScanner} from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  debounce,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import {
  useRsnPageFlatFragLoader,
  useSkillFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

import {SkillIcon} from "../icons/SkillIcon";

const autocompleteService = { current: null };

interface MainTextMatchedSubstrings {
    offset: number;
    length: number;
}
interface StructuredFormatting {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: readonly MainTextMatchedSubstrings[];
}
interface ResultType {
    description: string;
    // structured_formatting: StructuredFormatting;
    _ref_id: string;
    _raw_content: string;
    tablename: string;
    colname: string;
    colpath?: string[] | null;
}

export function SearchBoxResultRsnPage({result}: {result: ResultType & {tablename: 'rsn_page'}}) {
    // Load the page
    const {data: page, loading, error} = useRsnPageFlatFragLoader(result._ref_id);

    const shortString = (s: string) => {
        if(s.length > 50) {
            return s.slice(0, 50) + '...';
        }
        return s;
    }

    return <Grid container alignItems="center">
        <Grid item sx={{ display: 'flex', width: 44 }}>
            <DocumentScanner sx={{ color: 'text.secondary' }} />
        </Grid>
        <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
            {
                page ?
                    <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                        <Box
                            component="span"
                            sx={{ fontWeight: 'regular' }}
                          >
                            {page.name}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {shortString(result._raw_content)}
                        </Typography>
                    </Grid>
                    :
                    <Typography variant="body2" color="text.secondary">
                        Loading...
                    </Typography> 
            }
            {/* <Box
                component="span"
                sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
            >
                {part.text}
            </Box>
            <Typography variant="body2" color="text.secondary">
                {option.structured_formatting.secondary_text}
            </Typography> */}
        </Grid>
    </Grid>
}

export function SearchBoxResultSkill({result}: {result: ResultType & {tablename: 'skill'}}) {
    // Load the page
    const {data: skill, loading, error} = useSkillFlatFragLoader(result._ref_id);

    const shortString = (s: string) => {
        if(s.length > 50) {
            return s.slice(0, 50) + '...';
        }
        return s;
    }

    return <Grid container alignItems="center">
        <Grid item sx={{ display: 'flex', width: 44 }}>
            <SkillIcon sx={{ color: 'text.secondary' }} />
        </Grid>
        <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
            {
                skill ?
                    <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                        <Box
                            component="span"
                            sx={{ fontWeight: 'regular' }}
                          >
                            {skill?.name}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {shortString(result._raw_content)}
                        </Typography>
                    </Grid>
                    :
                    <Typography variant="body2" color="text.secondary">
                        Loading...
                    </Typography> 
            }
            {/* <Box
                component="span"
                sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
            >
                {part.text}
            </Box>
            <Typography variant="body2" color="text.secondary">
                {option.structured_formatting.secondary_text}
            </Typography> */}
        </Grid>
    </Grid>
}

const SearchBoxResultMap: {[key: string] : any} = {
    rsn_page: SearchBoxResultRsnPage,
    skill: SearchBoxResultSkill,
}


export function SearchBoxResultComp(props: {result: ResultType}) {

    const ResultComp = SearchBoxResultMap[props.result.tablename];

    if(!ResultComp) {
        // console.error("No result comp for tablename", props.result.tablename);
        return null;
    }

    return <ResultComp {...props} />
}

export function SearchBox({embeddingType, onInputValueChange}: {embeddingType?: 'embedding' | 'embedding_openai_text_embedding_3_small', onInputValueChange?: (value: string) => void}){
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<readonly ResultType[]>([]);

    useEffect(() => {
        if(onInputValueChange) {
            onInputValueChange(inputValue);
        }
    }, [inputValue]);

    const fetch = React.useMemo(
        () =>
          debounce(
            async (
              request: { input: string },
              callback: (results?: readonly ResultType[]) => void,
            ) => {
                const result = await SearchRsnVecRoute.call({
                    text: request.input,
                    embeddingColumn: embeddingType || 'embedding',
                    matchThreshold: 0.8
                })

                const dataArray = result?.data?.data;

                if (!dataArray) {
                    console.error("Failed to get match vectors", result);
                    return;
                }

                callback(dataArray.map((v) => ({
                    description: v.id,
                    _ref_id: v._ref_id,
                    _raw_content: v.raw_content,
                    tablename: v.result_tablename,
                    colname: v.result_colname,
                    colpath: v.result_colpath,
                    // structured_formatting: {
                    //     main_text: v.raw_content,
                    //     secondary_text: v.raw_content,
                    // }
                })))
            },
            400,
          ),
        [],
      );
    
    React.useEffect(() => {
        let active = true;

        if (inputValue === '') {
          //setOptions(value ? [value] : []);
          return undefined;
        }
    
        fetch(
            { input: inputValue },
            (results?: readonly ResultType[]) => {
                if (active) {
                    let newOptions: readonly ResultType[] = [];
            
                    // if (value) {
                    // newOptions = [value];
                    // }
            
                    if (results) {
                    newOptions = [...newOptions, ...results];
                    }
            
                    setOptions(newOptions);
                }
            }
        );
        
        return () => {active = false;};
    }, [inputValue, fetch]);


    return (
        <Autocomplete
            id="rsn-searchbox"
            freeSolo
            sx={{ width: 300 }}
            getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.description
            }
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            // We never select a value here -- we only ever use an "onchange" to trigger going to that page,
            value={null}
            noOptionsText="No Results"
            renderInput={(params) => <TextField {...params} label="" />}
            // @ts-ignore
            onChange={(event: any, newValue: ResultType | null) => {
                console.log({newValue})
                setOptions(newValue ? [newValue, ...options] : options);
            }}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            renderOption={(props, option) => {
                // const matches =
                //   option.structured_formatting.main_text_matched_substrings || [];
        
                // const parts = parse(
                //   option.structured_formatting.main_text,
                //   matches.map((match: any) => [match.offset, match.offset + match.length]),
                // );
        
                return (
                  <li {...props}>
                    <SearchBoxResultComp result={option} />

                    {/* <Grid container alignItems="center">
                      <Grid item sx={{ display: 'flex', width: 44 }}>
                        <LocationOn sx={{ color: 'text.secondary' }} />
                      </Grid>
                      <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                        {parts.map((part, index) => (
                          <Box
                            key={index}
                            component="span"
                            sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
                          >
                            {part.text}
                          </Box>
                        ))}
                        <Typography variant="body2" color="text.secondary">
                          {option.structured_formatting.secondary_text}
                        </Typography>
                      </Grid>
                    </Grid> */}
                  </li>
                );
              }}
        
        />
    )
}