'use client'
import {useState} from "react";

import {useRouter} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  Bookmark,
  BookmarkAdd,
  History,
} from "@mui/icons-material";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  ActivityFlatFragFragment,
  GetActivityResultsDeepDocument,
  GetActivitySetWithActivitiesDocument,
  VariablesOf,
} from "@reasonote/lib-sdk-apollo-client";

import {ActivityTypeIndicator} from "../activity/ActivityTypeIndicator";
import {
  ActivitySourceIndicator,
} from "../activity/components/ActivitySourceIndicator";
import {
  AddToUserActivityLibraryButton,
} from "../activity/components/AddToUserActivityLibraryButton";
import {Txt} from "../typography/Txt";
import {ACSBDefaultInfiniteScroll} from "./ACSBDefaultInfiniteScroll";

interface UserActivityListEntryProps {
    activity: ActivityFlatFragFragment;
}


export function UserActivityListEntry({activity}: UserActivityListEntryProps) {
    const router = useRouter();

    return <ListItem key={activity.id}
      secondaryAction={<AddToUserActivityLibraryButton activityId={activity.id} disableUserAvatarBadge/>}
      disablePadding
    >
        <ListItemButton 
          role={undefined}
          
          onClick={() => {
              router.push(`/app/activities/${activity.id}`)
          }}
        >
            <ListItemText 
                primary={activity.name}
                secondary={<Stack>
                  <ActivityTypeIndicator activityType={activity.type}/>
                  <div><ActivitySourceIndicator activityId={activity.id}/></div>
                </Stack>}
            />
            
        </ListItemButton>
    </ListItem>
}

export interface UserActivityListProps {
  queryVars?: VariablesOf<typeof GetActivityResultsDeepDocument>;
  filterNodes?: (node: any) => boolean;
}

export const UserActivityList: React.FC<UserActivityListProps> = ({queryVars, filterNodes}) => {
    const { rsnUserId } = useRsnUser();

    const [tab, setTab] = useState<'library' | 'previously-seen' | 'all'>('library');
  
    return (
      <Stack height={"700px"}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab icon={<Bookmark/>} label="Your Library" value="library"/>
          <Tab icon={<History/>} label="Previously Seen" value="previously-seen"/>
          {/* <Tab icon={<Explore/>} label="All" value="all"/> */}
        </Tabs>

        <List style={{overflowY: 'auto', height: '100%'}}>
          {
            tab === 'previously-seen' &&
              <ACSBDefaultInfiniteScroll
                getCollection={(data) => data.userActivityResultCollection}
                getNodes={(collection) => collection.edges.map(edge => edge.node)}
                queryOpts={{
                  query: GetActivityResultsDeepDocument,
                  variables: {
                    ...queryVars,
                    filter: {
                      createdBy: {
                        eq: rsnUserId,
                      },
                      ...queryVars?.filter,
                    },
                    first: 5,
                  },
                  fetchPolicy: "network-only" as const, // Used for first execution
                  // nextFetchPolicy: "cache-first" as const, // Used for subsequent executions
                }}
                // TODO: build fails here without any, but should be inferrable fine?
                getChild={(node: any) => {
                  console.log({node})
                    if (filterNodes && !filterNodes(node)) {
                        return null;
                    }

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

          }
          {
            tab === 'library' &&
              <ACSBDefaultInfiniteScroll
                getCollection={(data) => data.activitySetCollection?.edges[0]?.node.activitySetActivityCollection}
                getNodes={(collection) => collection.edges.map(edge => edge.node)}
                queryOpts={{
                  query: GetActivitySetWithActivitiesDocument,
                  variables: {
                    ...queryVars?.filter,
                    filter: {
                      forUser: {
                        eq: rsnUserId,
                      },
                      ...queryVars?.filter,
                    },
                    first: 5,
                  },
                  fetchPolicy: "network-only" as const, // Used for first execution
                  // nextFetchPolicy: "cache-first" as const, // Used for subsequent executions
                }}
                // TODO: build fails here without any, but should be inferrable fine?
                getChild={(node: any) => {
                    if (filterNodes && !filterNodes(node)) {
                        return null;
                    }

                    const {activity} = node;
                    return activity && <UserActivityListEntry key={activity?.id} activity={activity} />
                }}
                emptyListComponent={<Stack width={'100%'} alignItems={'center'} justifyContent={'center'} padding={'10px'}>
                    <span>No activities in your library yet.</span>
                    <br/>
                    <Typography variant={'body1'}>Add activities to your library using the <BookmarkAdd/> icon to see them here.</Typography>
                </Stack>}
              /> 
          }
          
        </List>
      </Stack>
    );
};