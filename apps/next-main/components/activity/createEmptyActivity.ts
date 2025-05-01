import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

import {
  ActivityType,
} from "@reasonote/core"
import {
  getActivityTypeDefinition,
} from "./activity-type-definition/getActivityTypeDefinition";

export async function createEmptyActivity(sb: SupabaseClient<Database>, activityType: ActivityType){
    const ActivityKlass = await getActivityTypeDefinition({activityType}); 

    if (!ActivityKlass){
        throw new Error(`Activity type ${activityType} not found`);
    }

    // TODO: create activity
    const newActivity = await sb.from('activity').insert({
        _name: `New ${ActivityKlass.typeHumanName}`,
        _type: activityType,
        type_config: ActivityKlass.createEmptyConfig()
    }).select('*').single();

    const activityId = newActivity.data?.id;

    return {
        id: activityId,
        type: activityType,
    }
}