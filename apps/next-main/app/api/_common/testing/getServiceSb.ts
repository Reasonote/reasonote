import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

import {getApiEnv} from "../../helpers/apiEnv";

export async function getServiceSb(){
    const apiEnv = getApiEnv();
    const serviceSb = new SupabaseClient<Database>(
      apiEnv.NEXT_PUBLIC_SUPABASE_URL,
      apiEnv.SUPABASE_SERVICE_KEY
    );
  
    return {
      serviceSb,
    }
}
  