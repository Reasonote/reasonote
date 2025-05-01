import _ from "lodash";
import {z} from "zod";

import {__RsnClientModel__} from "./__RsnClientModel__";

export class UserClientModel extends __RsnClientModel__ {
    async userHasActivePaidLicense() {
        const {data, error} = await this.client.sb.rpc('get_user_stripe_subs_short')

        if (error){
            return {data: false, error}
        }

        const typesRet = z
          .array(z.string())
          .safeParse(data?.map((d: any) => d.stripe_product_lookup_key));

        return {
            data: typesRet.success && typesRet.data.includes('Reasonote-Basic'),
            error: typesRet.success ? null : typesRet.error
        }
    }
}