import React from "react";

import _ from "lodash";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSkillScores} from "@/clientOnly/hooks/useSkillScores";
import {
  useUserActivityCountForSkill,
} from "@/clientOnly/hooks/useUserActivitiesForSkill";
import {Activity} from "@/components/activity/Activity";
import {ActivityIcon} from "@/components/icons/ActivityIcon";
import {
  ACSBDefaultInfiniteScroll,
} from "@/components/lists/ACSBDefaultInfiniteScroll";
import {UserActivityListEntry} from "@/components/lists/UserActivityList";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {
  Card,
  Stack,
  Typography,
} from "@mui/material";
import {
  GetActivitySkillWithResultsDocument,
} from "@reasonote/lib-sdk-apollo-client";

export interface SkillIdActivityTabContentProps {
    skillId: string;
}

export function SkillIdActivityTabContent(props: SkillIdActivityTabContentProps) {
    const {skillId} = props;
    const [activityGeneratedIds, setActivityGeneratedIds] = React.useState<string[]>([]);
    const {rsnUserId} = useRsnUser();
    const [otherSkillIds, setOtherSkillIds] = React.useState<string[]>([]);
    const {sb} = useSupabase();

    const {data: skillTree} = useSkillScores({topicOrId: skillId});
    
    // Get the Activities associated with this skill
    const activities = useUserActivityCountForSkill({skillId});

    return <Stack height={'75vh'} gap={1} width="100%">
        {/* This should stay locked at the top. */}
        <Stack flexShrink={0}>
            <Txt startIcon={<ActivityIcon/>} variant={'h5'}>{activities.data} Activities</Txt>
            {/* <CreateActivityTypeButtonGroup
                onActivityTypeCreate={async (activityType) => {
                    const actGenRes = await ActivityGenerateRoute.call({
                        activityTypes: [activityType],
                        from: {
                            skill: {
                                id: skillId
                            }
                        }
                    })

                    if (actGenRes.success) {
                        setActivityGeneratedIds((existing) => {
                            return [...existing, ...actGenRes.data.activityIds];
                        })
                    }
                }}
            /> */}
            {/* <Button onClick={() => {}}>
                Create Activities For This Skill
            </Button> */}
        </Stack>
        {/* This should scroll if content gets too big. */}
        <Stack sx={{flexGrow: 1}}>
            {
                activityGeneratedIds.map((activityId) => {
                    return <Stack>
                        <Card elevation={5}>
                            <Activity activityId={activityId} onActivityComplete={() => {}} onDelete={() => {
                                setActivityGeneratedIds((existing) => {
                                    return existing.filter((id) => id !== activityId);
                                })
                            }}/>
                        </Card>
                    </Stack>
                })
            }
            <ACSBDefaultInfiniteScroll
                getCollection={(data) => data.activitySkillCollection}
                getNodes={(collection) => collection.edges.map(edge => edge.node)}
                queryOpts={{
                  query: GetActivitySkillWithResultsDocument,
                  variables: {
                    filter: {
                      createdBy: {
                        eq: rsnUserId,
                      },
                      skill: {
                        in: _.uniq([skillId, ...(skillTree?.map((s) => s.skill_id) ?? [])]),
                      },
                    },
                    first: 5,
                  },
                  fetchPolicy: "network-only" as const, // Used for first execution
                  // nextFetchPolicy: "cache-first" as const, // Used for subsequent executions
                }}
                // TODO: build fails here without any, but should be inferrable fine?
                getChild={(node: any) => {
                    const {activity} = node;

                    return activity ? <UserActivityListEntry key={activity.id} activity={activity} /> : null
                }}
                emptyListComponent={
                  <Stack width={'100%'} alignItems={'center'} justifyContent={'center'} padding={'10px'}>
                      <Txt startIcon={"🤔"}>No Activities seen yet.</Txt>
                      <br/>
                      <Typography variant={'body1'}>Practice Some Activities to see them here.</Typography>
                  </Stack>
                }
              />
        </Stack>
        
    </Stack>
}