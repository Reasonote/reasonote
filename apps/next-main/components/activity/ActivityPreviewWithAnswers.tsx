import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {
  Stack,
  Typography,
} from "@mui/material";
import {
  useActivityFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";
import {JSONSafeParse} from "@reasonote/lib-utils";

import {
  useActivityTypeClient,
} from "./activity-type-clients/useActivityTypeClient";
import {
  ActivityHeaderSimple,
  ActivityHeaderSimpleProps,
} from "./ActivityHeader";

export interface ActivityPreviewWithAnswersProps {
    activityId: string;
    headerOptions?: Partial<ActivityHeaderSimpleProps>;
}

export function ActivityPreviewWithAnswers({activityId, headerOptions}: ActivityPreviewWithAnswersProps){
    const {data: activity} = useActivityFlatFragLoader(activityId);

    const safeTypeConfig = JSONSafeParse(activity?.typeConfig);

    const {data: {
        client,
        definition
    }} = useActivityTypeClient({activityType: activity?.type});

    return <Stack direction="column" spacing={2}>
        {/* Header */}
        <ActivityHeaderSimple 
            {...headerOptions}
            activity={{
                type: activity?.type,
            }}
        />

        {/* Activity */}
        {
            activity && client ? 
                client.renderPreviewWithAnswers ? 
                client.renderPreviewWithAnswers({config: safeTypeConfig.data}) 
                : client.render({config: safeTypeConfig.data, callbacks: {}, ai: {oneShotAI: oneShotAIClient}}) 
                :
                 <Typography>Error: Invalid activity.</Typography>
        }
    </Stack>;
}