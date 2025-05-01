"use client"
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import _ from "lodash";

import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {
  GetSimilarSkillsRoute,
} from "@/app/api/skills/get_similar_skills/routeSchema";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";

import {useApolloClient} from "@apollo/client";
import {
  notEmpty,
  typedUuidV4,
} from "@lukebechtel/lab-ts-utils";
import {
  Divider,
  Fade,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {getSkillFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";
import {useAsyncMemoFancy} from "@reasonote/lib-utils-frontend";
import {useEmbedding} from "@reasonote/transformers-js-react-helpers";

import {FYPIntent} from "../FYPTypes";
import {FYPChooseIntentAddSkillsCard} from "./FYPChooseIntentAddSkillsCard";
import {FYPChooseIntentScreenCard} from "./FYPChooseIntentScreenCard";
import {FYPChooseIntentScreenSkillCard} from "./FYPChooseIntentScreenSkillCard";

interface FYPChooseIntentSkillScreenProps {
    onIntentChosen: (intent: FYPIntent) => void;
}

export default function FYPChooseIntentSkillScreen({onIntentChosen}: FYPChooseIntentSkillScreenProps){
    const theme = useTheme();
    const userSkills = useUserSkills();

    const [searchValue, setSearchValue] = useState<string | null>('');

    const {data: embeddedSearchValue} = useEmbedding(searchValue ?? '');

    const searchIsActive = !!searchValue && searchValue.trim().length > 0;

    const [skillsFilteredBySearch] = useAsyncMemoFancy(async () => {
        if (searchValue && searchValue.trim().length > 0) {
            const res = await GetSimilarSkillsRoute.call({
                skill: {
                    type: 'stub',
                    name: searchValue,
                    nameEmbedding: embeddedSearchValue
                },
                nameMatchThreshold: 0.5
            })

            if (res.data){
                return res.data.similarSkills.filter(notEmpty) ?? [];
            }
        }
        else {
            return [];
        }
    }, [searchValue], {wait: 500})
    const ac = useApolloClient();

    const [idsFiltered] = useAsyncMemoFancy(async () => {
        // console.log('useAsyncMemoFancy calling function with: ', {
        //     skillsFilteredBySearch,
        //     searchIsActive,
        //     userSkills
        // })

        const ret = (searchIsActive ? 
            skillsFilteredBySearch?.map(skill => skill.id).filter(notEmpty)
            :
            userSkills.skills.map(skill => skill.id).filter(notEmpty)
        ) ?? [typedUuidV4('skill')] // Just a mock
        
        // console.log('useAsyncMemoFancy function made RESULT', ret)

        return ret;
    }, [skillsFilteredBySearch, searchIsActive, userSkills], {leading: true, wait: 250})

    // On first load, refetch these
    useEffect(() => {
        userSkills.refetch();
    }, [])


    const queryOpts = useMemo(() => {
        return {
            query: getSkillFlatQueryDoc,
            variables: {
                filter: {
                    id: {
                        in: idsFiltered ?? [typedUuidV4('skill')]
                    }
                },
                first: 6,
            },
        }
    }, [JSON.stringify(idsFiltered)])

    const onAddSkill = async (skillName: string) => {
        // Create the new skill
        const res = await AddtoUserSkillSetRoute.call({
            addSkills: [
                {
                    name: skillName
                }
            ]
        });

        if (res.data){
            const newSkillId = res.data.skillIds[0];
            if (newSkillId){
                onIntentChosen({type: 'review-pinned', pinned: {skillIdPath: [newSkillId]}})
            }
        }
    };

    return <Stack>
        {<Fade in={true} timeout={theme.transitions.duration.short}><Typography variant="h6" color="#FFF" textAlign={'center'}>👋 Welcome Back 😊 </Typography></Fade>}
        {<Fade in={true} timeout={theme.transitions.duration.standard}><Typography color="#FFF" textAlign={'center'}>How do you want to grow today? 🌱 </Typography></Fade>}
        
        <Fade in={true} timeout={theme.transitions.duration.complex}>
            <Stack gap={2}>
            <FYPChooseIntentScreenCard
                title="For You"
                avatar={<CurUserAvatar/>}
                subtitle="Review a customized blend of skills from your library."
                onClick={() => {
                    onIntentChosen({type: 'review-all'})
                }}
                cardProps={{
                    elevation: 20,
                    //@ts-ignore
                    'data-testid': 'fyp-choose-intent-screen-card-for-you',
                    sx: {
                        backgroundColor: theme.palette.gray.dark,
                        '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                        },
                        transition: "background-color 0.5s ease"
                    }
                    // sx: {backgroundColor: theme.palette.primary.main}}
                }}
            />
            
            <Divider />
            <Typography variant="body1" color="#FFF" textAlign={'center'}>🧘 Or choose a specific skill to focus on...</Typography>
            <FYPChooseIntentAddSkillsCard 
                searchValue={searchValue} 
                setSearchValue={setSearchValue} 
                // setSearchValue={()=>{}}
                onCreateSkill={async (skillName: string) => {
                    onAddSkill(skillName);
                }}
                showCreateSuggestion={searchIsActive ?? false}
            />
            <ApolloClientInfiniteScroll
                wrapperElId="fyp-infinite-scroll-component-id"
                overrideWrapperElProps={{
                    className: "overflow-visible scroll firefox-scroll fyp-choose-intent-screen-skill-card-group",
                }}
                overrideInfiniteScrollProps={{
                    loader: <Stack width={'fit-content'} alignSelf={'center'}>
                        <Typography color={theme.palette.text.primary}>Loading</Typography>
                        <LinearProgress/>
                    </Stack>,
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        // maxHeight: "50vh",
                        // overflow: "auto",
                        paddingBottom: '10px',
                        overflow: 'visible'
                    }}
                }
                queryOpts={queryOpts}
                fetchMoreOptions={(qResult) => {
                    return {
                        variables: {
                        after:
                            qResult.data?.skillCollection?.pageInfo.endCursor ||
                            undefined,
                        },
                    } as any;
                }}
                getChildren={(latestQueryResult) => {
                    const skills = latestQueryResult.data?.skillCollection?.edges.map(
                        (edge) => edge.node
                    ).sort((a, b) => {
                        // If we have a search, sort by similarity
                        if (searchIsActive){
                            // console.log('skillsFilteredBySearch', skillsFilteredBySearch, a.id, b.id)
                            const aSim = skillsFilteredBySearch?.find(skill => skill.id === a.id)?.nameSimilarity;
                            const bSim = skillsFilteredBySearch?.find(skill => skill.id === b.id)?.nameSimilarity;

                            // console.log('aSim, bSim', aSim, bSim)

                            if (aSim && bSim){
                                return bSim - aSim;
                            }
                            else {
                                return a.createdDate - b.createdDate;
                            
                            }
                        }
                        else {
                            return a.createdDate - b.createdDate;
                        }
                    });

                    // return <Stack gap={1} 
                    // // className="fyp-choose-intent-screen-skill-card-group"
                    // >
                    return <Grid container gap={1} justifyContent={'center'}>
                        {/* {
                            searchIsActive && <Grid item xs={5.5}>
                                <FYPChooseIntentScreenCard
                                    title={`Create "${searchValue}"`}
                                    avatar={<Badge badgeContent={<AddCircle/>}>
                                        <SkillIcon/>
                                    </Badge>}
                                    onClick={() => {
                                        onAddSkill(searchValue);
                                    }}
                                    cardProps={{
                                        sx: {
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.main,
                                            },
                                        }
                                    }}
                                />
                            </Grid>
                        } */}
                        {skills
                            ? skills.map((skill) => 
                                <Grid item xs={5.5}>
                                    <Fade in={true} timeout={theme.transitions.duration.standard}>
                                        <div>
                                            <FYPChooseIntentScreenSkillCard
                                                key={skill.id}
                                                skill={skill}
                                                onIntentChosen={onIntentChosen}
                                                cardProps={{
                                                    sx: {
                                                        // TODO: A random color
                                                        // backgroundColor: _.sampleSize([
                                                        //     theme.palette.primary.main,
                                                        //     theme.palette.secondary.main,
                                                        //     theme.palette.error.main,
                                                        //     theme.palette.warning.main,
                                                        //     theme.palette.info.main,
                                                        //     theme.palette.success.main,
                                                        // ]),
                                                        '&:hover': {
                                                            backgroundColor: theme.palette.primary.main,
                                                        },
                                                    }
                                                }}
                                            />
                                        </div>
                                    </Fade>
                                </Grid>
                            )
                            : null
                        }
                    </Grid>
                }}
                hasMore={(latestQueryResult) => {
                const ret =
                    latestQueryResult.loading ||
                    latestQueryResult.data?.skillCollection?.pageInfo.hasNextPage;
                return !!ret;
                }}
            />
            {
                !userSkills.loading && userSkills.skills.length > 0 &&
                    userSkills.skills.map(skill => {
                        if (!skill.id || skill.id === undefined || !skill.name) {
                            return null;
                        }

                        return 
                    })
            }
            </Stack>
        </Fade>
    </Stack>
}