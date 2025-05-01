'use client'
import {useRef} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRouteParamsSingle} from "@/clientOnly/hooks/useRouteParams";
import {SkillTreeV2} from "@/components/skill/SkillTreeV2/SkillTreeV2";
import {Stack} from "@mui/material";

export default function SkillIdTreePage(){
    const {skillId} = useRouteParamsSingle(['skillId']);
    const containerRef = useRef<HTMLDivElement>(null);
    
    if (!skillId){
        return null;
    }

    return (
        <Stack 
            width={'100%'}
            height={'100%'}
            ref={containerRef}
            sx={{
                overflow: 'hidden',
            }}
        >
            <SkillTreeV2
                skillId={skillId}
                variant="graph"
                showScore={true}
                containerRef={containerRef}
            />
        </Stack>
    );
}