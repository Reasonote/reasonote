import {useRouter} from "next/navigation";

import {
  useActivityTypeClient,
} from "@/components/activity/activity-type-clients/useActivityTypeClient";
import {
  getActivityTypeDescription,
} from "@/components/activity/constants/activityTypeDescriptions";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {Tooltip} from "@mui/material";
import {ActivityTypesPublic} from "@reasonote/core";

import {NewSkillActivityTypeCardProps} from "../NewSkillActivityCard";

function ActivityTypePickerCard({ activityType }: { activityType: string }) {
    const router = useRouter();
    const { supabase: sb } = useSupabase();

    const { data: { client, definition } } = useActivityTypeClient({ activityType });

    const hasActivityEditor = !!client?.renderEditor;
    const description = getActivityTypeDescription(activityType, definition?.typeHumanName);

    if (!hasActivityEditor) return null;

    return (
        <Tooltip
            title={description}
            arrow
            placement="top"
        >
            <div>
                <NewSkillActivityTypeCardProps
                    title={activityType}
                    onClick={async () => {
                        if (!definition) {
                            console.error('No definition found for activity type', activityType);
                            return;
                        }

                        const newActivity = await sb.from('activity').insert({
                            _name: `New ${definition.typeHumanName}`,
                            _type: activityType,
                            type_config: definition.createEmptyConfig()
                        }).select('*').single();

                        const activityId = newActivity.data?.id;

                        if (!activityId) {
                            console.error('Failed to create activity');
                            return;
                        }

                        router.push(`/app/activities/${activityId}/edit`)
                    }}
                />
            </div>
        </Tooltip>
    );
}

export function ActivityTypePicker() {
    const router = useRouter();
    const { supabase: sb } = useSupabase();

    return ActivityTypesPublic.map((activityType) => {
        return <ActivityTypePickerCard key={activityType} activityType={activityType} />
    }).filter(notEmpty)
}