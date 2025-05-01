import _ from "lodash";

import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

export async function getSkillContext(supabase: SupabaseClient<Database>, skillId: string){
    const skillRes = (await supabase.from('skill').select('*').eq('id', skillId).single())?.data
    const snipRes = (await supabase.from('snip').select('*').eq('root_skill', skillId).single())?.data
    const skillResources = _.flatten((await supabase.from('resource').select('*, resource(*, snip(*))').eq('parent_skill_id', skillId))?.data?.map(r => r.resource)).filter(notEmpty);
    const snipsFromResources = skillResources.map(r => r.snip).filter(notEmpty);
    
    return {
        skillRes,
        snipRes,
        skillResourceSnipIds: snipsFromResources.map(r => r.id).filter(notEmpty),
        snipsFromResources
    }
}