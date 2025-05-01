"use client"
import {UserActivityList} from "@/components/lists/UserActivityList";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {Typography} from "@mui/material";

export default function ActivitiesPage(){
    return <CenterPaperStack>
        <Typography variant="h4">Activities</Typography>
        <UserActivityList/>
    </CenterPaperStack> 
}