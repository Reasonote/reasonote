import React, {useCallback} from "react";

import {useApolloClient} from "@apollo/client";
import {
  Check,
  Edit,
  Preview,
  Restore,
  Save,
  DragIndicator,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import {
  ActivityFlatFragFragment,
  updateActivityFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {
  useActivityFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {SimpleHeader} from "../headers/SimpleHeader";
import {CustomTabPanel} from "../tabs/CustomTab";
import {
  useActivityTypeClient,
} from "./activity-type-clients/useActivityTypeClient";
import {ActivityTypeIndicator} from "./ActivityTypeIndicator";
import {ActivityLoadingComponent} from "./components/ActivityLoadingComponent";

export interface ActivityEditorProps {
    activityId: string;
    disableTabIcons?: boolean;
    disableTabLabels?: boolean;
    headerRightContent?: React.ReactNode;
    tabOrder?: string[];
    startingTab?: string;
    dragHandleProps?: any;
}

export function ActivityEditor(props: ActivityEditorProps){
    const {data: activity, loading: activityLoading} = useActivityFlatFragLoader(props.activityId);

    return <Stack gap={2} width={'100%'}>
        <SimpleHeader 
            leftContent={<ActivityTypeIndicator activityType={activity?.type ?? 'unknown'}/>}
            rightContent={props.headerRightContent}
            dragHandleProps={props.dragHandleProps}
        />
        {
            activityLoading ?
                <ActivityLoadingComponent />
                :
                (
                    activity === undefined ?
                        <div>Activity not found</div>
                        :
                        <ActivityEditorLoaded activity={activity} {...props}  
                        />
                )
        }
    </Stack>
}


export function ActivityEditorLoaded({activity, disableTabIcons, disableTabLabels, ...props}: {activity: ActivityFlatFragFragment} & ActivityEditorProps){
    const ac = useApolloClient();
    // TODO: pick correct editor based on activity type
    const {data: {
        client: klass
    }} = useActivityTypeClient({activityType: activity.type});

    const [typeConfig, setTypeConfig] = React.useState(JSONSafeParse(activity.typeConfig)?.data);

    const [activeTab, setActiveTab] = React.useState(props.startingTab ?? 'edit');

    const renderEditorPreview = klass?.renderEditorPreview;
    const renderEditor = klass?.renderEditor;
    const renderPreviewWithAnswers = klass?.renderPreviewWithAnswers;

    const tabOrder = props.tabOrder ?? ['edit', 'preview', 'answers'];

    const onSave = useCallback(async () =>{
        await ac.mutate({
            mutation: updateActivityFlatMutDoc,
            variables: {
                filter: {
                    id: {
                        eq: activity.id
                    }
                },
                set: {
                    typeConfig: JSON.stringify(typeConfig)
                },
                atMost: 1
            }
        })
    }, [typeConfig])

    if (!klass){
        return <div>Unknown activity type</div>
    }

    if (!typeConfig){
        return <div>Activity type config is invalid JSON</div>
    }

    const tabMap = {
        edit: {
            label: 'Edit',
            icon: <Edit fontSize="small"/>
        },
        preview: {
            label: 'Preview',
            icon: <Preview fontSize="small"/>
        },
        answers: {
            label: 'Answers',
            icon: <Check fontSize="small"/>
        },
    }


    const tabHeight = disableTabIcons ? '30px' : '48px';

    return <Stack width={'100%'}>
        <Tabs 
            value={activeTab}
            onChange={(e, newValue) => {
                setActiveTab(newValue);
            }} 
            aria-label="basic tabs example"
            sx={{
                minHeight: tabHeight,
                height: tabHeight,
                width: '100%'
            }}
            centered
        >
            {/* <Tab icon={<Edit fontSize="small"/>} label="Edit" value={'edit'} sx={{height: '40px', minHeight: '40px'}}/>
            <Tab icon={<Preview fontSize="small"/>} label="Preview" value={'preview'} sx={{height: '40px', minHeight: '40px'}}/> */}
            {
                tabOrder.map((tab) => {
                    return tab === 'answers' ? (
                        renderPreviewWithAnswers ?
                            <Tab
                                icon={disableTabIcons ? undefined : tabMap[tab]?.icon}
                                label={disableTabLabels ? undefined : tabMap[tab]?.label}
                                value={tab}
                                sx={{height: tabHeight, minHeight: tabHeight}}
                            />
                            :
                            null
                    ) :
                    <Tab
                        icon={disableTabIcons ? undefined : tabMap[tab]?.icon}
                        label={disableTabLabels ? undefined : tabMap[tab]?.label}
                        value={tab}
                        sx={{height: tabHeight, minHeight: tabHeight}}
                    />
                })
            }
            {/* <Tab
                icon={disableTabIcons ? undefined : <Edit fontSize="small"/>}
                label={disableTabLabels ? undefined : "Edit"}
                value={'edit'}
                sx={{height: tabHeight, minHeight: tabHeight}}
            />
            {
                renderPreviewWithAnswers &&
                <Tab
                    icon={disableTabIcons ? undefined : <Check fontSize="small"/>}
                    label={disableTabLabels ? undefined : "Answers"}
                    value={'answers'}
                    sx={{height: tabHeight, minHeight: tabHeight}}
                />
            }
            <Tab
                icon={disableTabIcons ? undefined : <Preview fontSize="small"/>}
                label={disableTabLabels ? undefined : "Preview"}
                value={'preview'}
                sx={{height: tabHeight, minHeight: tabHeight}}
            /> */}
            {/* {
                isAdmin &&
                    
                        <Tab icon={disableTabIcons ? undefined : <Code fontSize="small"/>}
                            label={
                                <Badge overlap="rectangular" color={'warning'} badgeContent={<Science  fontSize="small"/>} sx={{zIndex: 10000}} anchorOrigin={{vertical: 'top', horizontal: 'right'}}>
                                    Code
                                </Badge>
                            } value={'code'} 
                            sx={{height: tabHeight, minHeight: tabHeight}}
                        />
                    
            } */}
            
        </Tabs>

        <CustomTabPanel currentValue={activeTab} value={'edit'} boxProps={{width: '100%'}}>
            <Card id="activity-editor-panel-card" sx={{width: '100%', maxHeight: '80vh', overflow: 'auto'}}>
                {
                    renderEditor?.({
                        config: typeConfig,
                        setConfig: (newConfig) => {
                            setTypeConfig(newConfig);
                        }
                    }) ?? <div>Activity Editor not implemented for type {typeConfig.type}</div>
                }
            </Card>
        </CustomTabPanel>
        <CustomTabPanel currentValue={activeTab} value={'answers'} boxProps={{width: '100%'}}>
            {
                renderPreviewWithAnswers ?
                    renderPreviewWithAnswers({
                        config: typeConfig
                    })
                    :
                    <div>Answers not available</div>
            }
        </CustomTabPanel>

        <CustomTabPanel currentValue={activeTab} value={'preview'} boxProps={{width: '100%', sx: {width: '100%'}}}>
            {
                renderEditorPreview ?
                    renderEditorPreview({
                        config: typeConfig
                    })
                    :
                    <div>Preview not available</div>
            }
        </CustomTabPanel>

        <CustomTabPanel currentValue={activeTab} value={'code'} boxProps={{overflow: 'scroll', width: '100%'}}>
            <pre>{JSON.stringify(typeConfig, null, 2)}</pre>
        </CustomTabPanel>

        {
            JSON.stringify(typeConfig) !== JSON.stringify(JSONSafeParse(activity.typeConfig)?.data) ?
                <Stack direction="row" gap={2} justifyContent={'center'}>
                    <Button startIcon={<Save/>} onClick={onSave}>Save Changes</Button>
                    <Button 
                        startIcon={<Restore/>}
                        onClick={() => {
                            setTypeConfig(JSONSafeParse(activity.typeConfig)?.data);
                        }}
                    >
                        Reset
                    </Button>
                </Stack>
                :
                null
        }
        
    </Stack>
}