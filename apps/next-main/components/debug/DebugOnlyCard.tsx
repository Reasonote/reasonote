import {
  Card,
  CardProps,
} from "@mui/material";

import {DebugOnly} from "./DebugOnly";

export function DebugOnlyCard({children, cardProps}: {children: React.ReactNode, cardProps?: CardProps}) {
    return <DebugOnly>
        <Card 
            {...cardProps}
            sx={{
                border: '2px solid red',
                ...cardProps?.sx
            }}
        >
            {children}
        </Card>
    </DebugOnly>
}