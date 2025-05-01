
// CustomTabPanel currentValue={currentTab ?? 'overview'} value={'overview'} boxProps={{overflow: 'auto'}}>
//           <SkillIdOverviewTabContent skillId={skill.id} switchTab={(newTab) => {
//               updateSearchParams('tab', newTab)
//           }}/>
//         </CustomTabPanel>

import _ from "lodash";
import {useSearchParams} from "next/navigation";

import {CustomTabPanel} from "@/components/tabs/CustomTab";

export interface MobileContentMainTabPanelProps extends Omit<React.ComponentProps<typeof CustomTabPanel>, 'currentValue' | 'value'> {
    tabValue: string;
    children: React.ReactNode[] | React.ReactNode;
}

export default function MobileContentMainTabPanel({tabValue, children, ...rest}: MobileContentMainTabPanelProps){
    // Load the current tab value
    const searchParams = useSearchParams();
    const currentTab = searchParams?.get('tab');

    return <CustomTabPanel {...rest} currentValue={currentTab ?? ''} value={tabValue} >
        {..._.isArray(children) ? children : [children]}
    </CustomTabPanel>
}