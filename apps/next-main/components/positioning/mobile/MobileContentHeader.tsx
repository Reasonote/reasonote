import _ from "lodash";

import NextBreadcrumb from "@/app/app/breadcrumbs/NextBreadcrumbs";

export interface MobileContentHeaderProps {
    disableBreadcrumb?: boolean;
    currentPageBreadcrumb?: {
        name: string | React.ReactNode,
    }
    children: React.ReactNode[] | React.ReactNode;
}


export default function MobileContentHeader({children, currentPageBreadcrumb, disableBreadcrumb}: MobileContentHeaderProps){
    return <div>
        {disableBreadcrumb ?
            null 
            : 
            <NextBreadcrumb
                showCurrentPage={currentPageBreadcrumb ? true : false}
                currentPageBreadcrumb={currentPageBreadcrumb}
            />}
        {..._.isArray(children) ? children : [children]}
    </div>
}