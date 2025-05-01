import _ from "lodash";

import {MainMobileLayout} from "../MainMobileLayout";

export interface MobileContentWrapperProps {
    children: React.ReactNode[] | React.ReactNode;
    noHeader?: boolean;
    divProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function MobileContent({children, noHeader, divProps}: MobileContentWrapperProps){
    const maxHeight = noHeader ? '100dvh' : `calc(100dvh - 64px)`;

    return <MainMobileLayout sx={{
        height: maxHeight,
        maxHeight,
        overflow: 'hidden'
    }}>
        <div 
            {...divProps}
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '10px',
                height: '100%',
                ...divProps?.style
            }}
        >
            {..._.isArray(children) ? children : [children]}
        </div>
    </MainMobileLayout>
}