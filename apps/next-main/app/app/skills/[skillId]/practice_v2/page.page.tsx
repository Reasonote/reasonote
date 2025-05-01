"use client";

import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {PracticeV2Main} from "@/components/practice_v2/PracticeV2Main";
import {Stack} from "@mui/material";

export default function PracticeV2Page({ params }: { params: { skillId: string } }) {
    const { value: allowedActivityTypes } = useSearchParamHelper('allowedActivityTypes');


    return (
        <Stack sx={{ height: '100%', overflow: 'hidden', alignItems: 'center' }}>
            <PracticeV2Main skillId={params.skillId} allowedActivityTypes={allowedActivityTypes || ''} />
        </Stack>
    );
}
