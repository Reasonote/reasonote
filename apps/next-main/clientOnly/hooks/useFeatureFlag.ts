import _ from "lodash";

import {useHasLicenseType} from "./useHasLicenseType";
import {useSearchParamHelper} from "./useQueryParamHelper";

/**
 * Returns true if the flag value is truthish, defined as:
 * - If string: value must be "1" or "true"
 * - If boolean: value must be true
 * - Otherwise: !!value must be true
 * @param flagValue
 * @returns 
 */
function isTruthish(flagValue: boolean | string | any | undefined | null): boolean {
    // "1" or "true" or 1 or true are all true
    return _.isString(flagValue) ? 
        flagValue === '1' || flagValue === 'true'
        :
        !!flagValue;
}

export function useFeatureFlag(flag: string): boolean | undefined {
    const {data: isAdmin} = useHasLicenseType("Reasonote-Admin");
    const isLocalhost = window.location.hostname === 'localhost';

    const {value: slideComplexitySlider} = useSearchParamHelper('slide_complexity_slider');
    
    const hardcodedFlags = {
        'enable-header-add-button': isAdmin || isLocalhost,
        'enable-header-for-you-button': false,
        'allow-anonymous-users': true,
        'slide_complexity_slider': slideComplexitySlider,
    }

    return isTruthish(hardcodedFlags[flag]);
}