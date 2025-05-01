import {usePathname} from "next/navigation";

import {useFeatureFlag} from "./useFeatureFlag";
import {useRsnUser} from "./useRsnUser";

export function useShouldRedirectToOnboarding(){
    // If the user has been accepted into the BETA,
    // And they are logged in,
    // Then we should show the onboarding.
    const {rsnUserSysdata, loading: rsnUserSysdataLoading} = useRsnUser();
    const curPathName = usePathname();

    const enableOldOnboarding = useFeatureFlag("enable-old-onboarding");

    // Exit early if no old onboarding is enabled.
    if (!enableOldOnboarding) return {
        data: false,
        loading: false
    }



    if (rsnUserSysdataLoading){
        return {
            data: false,
            loading: true
        }
    }
    else if (rsnUserSysdata.error){
        return {
            data: false,
            loading: false,
            error: rsnUserSysdata.error
        }
    }

    return {
        data: curPathName !== "/app/onboarding" && enableOldOnboarding,
        loading: false
    }
}