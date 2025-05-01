import _ from "lodash";

export interface MobileContentMainProps {
    children: React.ReactNode[] | React.ReactNode;
}

export default function MobileContentMain({children}: MobileContentMainProps){
    return <div style={{flex: 1, overflow: 'auto'}}>
        {..._.isArray(children) ? children : [children]}
    </div>
}