import {useEffect} from "react";

import {useSearchParams} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useUpdateSearchParams} from "@/clientOnly/hooks/useUpdateSearchParams";
import {useMutation} from "@apollo/client";
import {
  Tab,
  TabProps,
  Tabs,
  useTheme,
} from "@mui/material";
import {updateSkillFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

{/* <Tab
value="overview" 
icon={<SkillIcon/>}   
label="Overview"
/>
<Tab
value="skill-tree" 
label="Skill Tree"
icon={<AccountTree/>}
/>
<Tab 
value="activities"
label="Activities"
icon={<ActivityIcon/>}
/>
<Tab
value="resources"
label="Resources"
/> */}

export interface MobileContentTabFooterProps {
    tabs: TabProps[];
    defaultTab: string;
    currentTabOverride?: string;
    onChangeTab?: (newTab: string) => void;
    disableDefaultChangeTabHandler?: boolean;
    tabsProps?: React.ComponentProps<typeof Tabs>;
}

export default function MobileContentTabFooter({tabs, tabsProps, defaultTab, currentTabOverride, onChangeTab, disableDefaultChangeTabHandler}: MobileContentTabFooterProps){
    const updateSearchParams = useUpdateSearchParams();
    const searchParams = useSearchParams()
    const currentTab = searchParams?.get('tab')
    const isSmallDevice = useIsSmallDevice();
    const {
      mixins: { toolbar },
    } = useTheme();
    const [updateSkill] = useMutation(updateSkillFlatMutDoc);
    
    useEffect(() => {
        if (!currentTab) {
            updateSearchParams('tab', defaultTab);
        }
    }, [currentTab]);

    const _onChangeTab = (newTab: string) => {
        if (!disableDefaultChangeTabHandler) {
            updateSearchParams('tab', newTab);
        }
        onChangeTab?.(newTab);
    }

    return <Tabs
        value={currentTab}
        {...tabsProps}
        onChange={(e: any, newValue: any) => {
            _onChangeTab(newValue)
        }}
        centered
        style={{
            marginTop: 'auto',
            ...tabsProps?.style,
        }}
        variant={isSmallDevice ? 'fullWidth' : 'standard'}
    >
        {tabs.map(tabProps => <Tab
            {...tabProps}
            sx={{
                ...tabProps.sx,
                minWidth: '1px'
            }}
        />)}
    </Tabs>
}