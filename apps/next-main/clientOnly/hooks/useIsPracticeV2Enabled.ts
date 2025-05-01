import {useRsnUserSettings} from "./useRsnUserSettings";

export function useIsPracticeV2Enabled() {
    const { data: userSettings } = useRsnUserSettings();
    return JSON.parse(userSettings?.metadata || "{}").enable_practice_v2 ?? true;
}
