'use client'
import {
  ActivityLoadingComponent,
} from "@/components/activity/components/ActivityLoadingComponent";
import FullCenter from "@/components/positioning/FullCenter";
import {Card} from "@mui/material";

export default function LoadingTestPage(){
    return <FullCenter>
        <Card>
            <ActivityLoadingComponent/>
        </Card>
    </FullCenter>
}