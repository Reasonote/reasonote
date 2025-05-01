import {
  useEffect,
  useState,
} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {ValidActivityTypeDefinition} from "@reasonote/core";
import {
  ValidActivityTypeClient,
} from "@reasonote/core/src/interfaces/ActivityTypeClient";

import {
  getActivityTypeDefinition,
} from "../activity-type-definition/getActivityTypeDefinition";
import {getActivityTypeClient} from "./getActivityTypeClient";

// This is a way of copying properties from a source object, to a target.
// It will smoothly handle static classes, which we currently use for our activity types, to save time.
function copyProperties(source: any, target: any) {
    const properties: any[] = (Object.getOwnPropertyNames(source) as any[])
      .concat(Object.getOwnPropertySymbols(source)); // Include symbol properties
  
    properties.forEach(prop => {
      const descriptor = Object.getOwnPropertyDescriptor(source, prop);
      if (descriptor){
        Object.defineProperty(target, prop, descriptor);
      }
    });

    return target;
}
  

export function useActivityTypeClient({activityType}: {activityType: string | null | undefined}) {
    const {sb} = useSupabase();

    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState<ValidActivityTypeClient<any, any> | null>(null);
    const [definition, setDefinition] = useState<ValidActivityTypeDefinition<any, any> | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        getActivityTypeClient({activityType, sb}).then((newClient) => {
            if (!newClient) {
                setError(new Error(`No client found for activity type ${activityType}`));
            }
            else {
                setClient(newClient ? copyProperties(newClient, {}) : null);
                setLoading(false);
            }
        });

        getActivityTypeDefinition({activityType}).then((newDefinition) => {
            if (!newDefinition) {
                setError(new Error(`No definition found for activity type ${activityType}`));
            }
            else {
                setDefinition(newDefinition ? copyProperties(newDefinition, {}) : null);
                setLoading(false);
            }
        });

    }, [activityType]);

    return {
        data: {
            client,
            definition
        },
        loading,
        error
    }
}