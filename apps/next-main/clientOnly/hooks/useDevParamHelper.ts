import {useHasLicenseType} from "./useHasLicenseType";
import {useSearchParamHelper} from "./useQueryParamHelper";

/**
 * Helper for dev params, will only be used on localhost, or if user is admin.
 * @param name The name of the param
 * @param defaultValue The default value of the param
 * @returns The value of the param
 */
export function useDevParamHelper(name: string, defaultValue?: string) {
    const { value, update } = useSearchParamHelper(name, defaultValue);
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const {data: isAdmin} = useHasLicenseType("Reasonote-Admin");
    const {data: isQA} = useHasLicenseType("Reasonote-QA");

    const isAllowed = isLocalhost || isAdmin || isQA;
    const returnValue = isAllowed ? value : null;

    return { 
        value: returnValue, 
        update: isAllowed ? update : undefined
    };
}
