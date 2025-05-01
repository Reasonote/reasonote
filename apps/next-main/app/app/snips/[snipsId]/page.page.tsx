'use client'
import React, {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import useThrottledCallback from "beautiful-react-hooks/useThrottledCallback";
import _ from "lodash";
import {useRouter} from "next/navigation";
import {z} from "zod";

import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useToken} from "@/clientOnly/hooks/useToken";
import {
  IntegrationSourceChip,
} from "@/components/integrations/IntegrationSourceChip";
import {NotFoundPage} from "@/components/navigation/NotFound";
import MobileContent from "@/components/positioning/mobile/MobileContent";
import MobileContentHeader
  from "@/components/positioning/mobile/MobileContentHeader";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import MobileContentMainTabPanel
  from "@/components/positioning/mobile/MobileContentMainTabPanel";
import MobileContentTabFooter
  from "@/components/positioning/mobile/MobileContentTabFooter";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {useMutation} from "@apollo/client";
import {jwtBearerify} from "@lukebechtel/lab-ts-utils";
import {
  Book,
  Info,
  OpenInNew,
} from "@mui/icons-material";
import {
  Chip,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {updateSnipFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useSnipFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {SnipsIdTabOverview} from "./_tabs/overview";
import {SnipsIdTabRead} from "./_tabs/read";
import {SnipAddToAutocomplete} from "./SnipAddToAutocomplete";

export const UserSnipIntentSchema = z.object({
    version: z.literal('0.0.0').optional().default('0.0.0'),
    intentCategories: z.array(
        z.union([
            z.literal('learn_this'),
            z.literal('explore_this'),
            z.literal('read_this'),
        ])
    ),
    intentFreeform: z.string().optional().default(''),
})
export interface UserSnipIntent extends z.infer<typeof UserSnipIntentSchema> {}

export default function Page(o: any) {
    const {sb} = useSupabase();
    const router = useRouter();
    const rsnUserId = useRsnUserId();
    const snipId = useRouteParams(o.params, 'snipsId');
    const {data: snip, error, loading, refetch} = useSnipFlatFragLoader(snipId);
    const [updateSnip] = useMutation(updateSnipFlatMutDoc);

    const {token} = useToken();

    const snipMetadata = useMemo(() => {
        if (snip) {
            return JSONSafeParse(snip.metadata)?.data;
        }
    }, [snip]);

    const userSnipIntent = useMemo(() => {
        if (snipMetadata) {
            const res = UserSnipIntentSchema.safeParse(snipMetadata.userSnipIntent);

            if (res.success) {
                return res.data;
            }
            
        }
        return null;
    }, [snipMetadata]);

    const updateUserSnipIntent = useCallback((newIntent: UserSnipIntent) => {
        if (snipId && rsnUserId) {
            updateSnip({
                variables: {
                    set: {
                        metadata: JSON.stringify({
                            userSnipIntent: newIntent,
                        }),
                    },
                    filter: {
                        id: {
                            eq: snipId,
                        }
                    },
                    atMost: 1,
                }
            });
        }
    }, [snipId, rsnUserId]);

    // If this snip exists, and its owner is null, set it to us.
    useEffect(() => {
        if (rsnUserId && snip && !snip.owner && snip.id) {
            updateSnip({
                variables: {
                    set: {
                        owner: rsnUserId,
                    },
                    filter: {
                        id: {
                            eq: snip.id,
                        }
                    },
                    atMost: 1,
                }
            });
        }
    }, [rsnUserId, snip]);

    const updateNameThrottled = useThrottledCallback((newName: string) => {
        if (snipId) {
            updateSnip({
                variables: {
                    set: {
                        name: newName,
                    },
                    filter: {
                        id: {
                            eq: snipId,
                        }
                    },
                    atMost: 1,
                }
            });
        }
    }, [snipId], 5000);

    useEffect(() => {
        // Subscribe to this snip using supabase realtime
        sb.channel('table-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'snip',
                    filter: `id=eq.${snipId}`,
                },
                (payload) => {
                    console.debug('snip change detected!', payload);
                    refetch();
                }
            )
            .subscribe((msg) => {
                console.debug('snip sub result', msg);
            })
    }, [rsnUserId, snipId]);

    return snipId ? <MobileContent>
        <MobileContentHeader currentPageBreadcrumb={snip ? {name: _.truncate(snip.name, {length: 25})} : undefined}>
            {
                snip ? 
                    <Stack alignContent={'center'} alignItems={'center'} gap={1}>
                        <Typography variant="h4" suppressContentEditableWarning={true} contentEditable={true}
                            width={'100%'}
                            onInput={(o) => {
                                updateNameThrottled(o.currentTarget.textContent ?? '');
                            }}
                        >
                            {snip?.name}
                        </Typography>

                        <Stack direction={'column'} gap={1} alignItems={'center'}>
                            {
                                snip?.sourceUrl && (
                                    <Link href={snip?.sourceUrl}>
                                        <Txt variant={'body1'} endIcon={<OpenInNew fontSize="small"/>}>
                                            Visit Source
                                        </Txt>
                                    </Link>
                                )
                            }
                            <div style={{zoom: '75%'}}>
                                {snip.sourceIntegration ? <IntegrationSourceChip integrationId={snip.sourceIntegration}/> : null}
                            </div>
                        </Stack>

                        <Stack gap={1} width={'100%'}>
                            <SnipAddToAutocomplete snipId={snipId} autocompleteProps={{fullWidth: true}}/>
                            <Stack direction={'row'} gap={1} justifyContent={'end'} alignContent={'center'} alignItems={'center'}>
                                {/* <Chip
                                    label={"Learn This"}
                                    icon={
                                        userSnipIntent?.intentCategories?.includes('learn_this') ?  <CheckCircle/> : <AddCircle/>
                                    }
                                    variant={userSnipIntent?.intentCategories?.includes('learn_this') ? 'filled' : 'outlined'}
                                    onClick={() => {
                                        updateUserSnipIntent({
                                            version: '0.0.0',
                                            ...userSnipIntent,
                                            intentCategories: userSnipIntent?.intentCategories.find((cat) => cat === 'learn_this') ?
                                                userSnipIntent?.intentCategories.filter((cat) => cat !== 'learn_this') :
                                                [...(userSnipIntent?.intentCategories ?? []), 'learn_this'],

                                            intentFreeform: '',
                                            
                                        });
                                    }}
                                /> */}

                                <Chip
                                    label={"Practice This"}
                                    icon={
                                        <OpenInNew fontSize="small"/>
                                    }
                                    variant={'outlined'}
                                    onClick={async () => {
                                        // Go to the fyp page for the skill corresponding to this snip.
                                        if (snip.rootSkill){
                                            const addResult = await AddtoUserSkillSetRoute.call({
                                                addIds: [snip.rootSkill],
                                            },{
                                                headers: {
                                                    Authorization: token ? jwtBearerify(token) : undefined,
                                                }
                                            })
                                            if (!addResult.success) {
                                                console.warn("Failed to add skill to user skill set", addResult.error)
                                            }

                                            router.push(`/app/skills/${snip.rootSkill}?tab=learn`);
                                        }
                                    }}
                                />
                            </Stack> 
                        </Stack>
                    </Stack>
                    :
                    <Skeleton variant="rectangular" width="100%" height={100} />
            }
        </MobileContentHeader>
        <MobileContentMain>
            <MobileContentMainTabPanel tabValue="overview">
                <SnipsIdTabOverview snipId={snipId} />
            </MobileContentMainTabPanel>
            <MobileContentMainTabPanel tabValue="read">
                <SnipsIdTabRead snipId={snipId} />
            </MobileContentMainTabPanel>
        </MobileContentMain>
        <MobileContentTabFooter  
            defaultTab="overview"
            tabs={[
                {
                    value: 'overview',
                    label: 'Overview',
                    icon: <Info/>
                },
                {
                    value: 'read',
                    label: 'Read',
                    icon: <Book/>
                },
                // {
                //     value: 'intent',
                //     label: 'Intent',
                //     icon: <CheckCircle/>
                // }
            ]}
        />
    </MobileContent>
    :
    <NotFoundPage/>
}