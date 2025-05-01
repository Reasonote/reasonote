'use client'

export function useSupabaseUrl(){
    const envVarValue = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // If this is localhost, we do something special:
    // We assume that the user wants to use the same protocol + host as the current page,
    // but they want to copy the port from the env var value.
    // Here, we parse 
    if (!envVarValue){
        return {
            data: null,
            loading: false,
            error: new Error("No Supabase URL provided"),
        }
    }

    const urlParsed = new URL(envVarValue);

    if (urlParsed.hostname === "localhost"){
        const currentHost = window.location.host.split(":")[0];
        const currentProtocol = window.location.protocol;

        const newUrl = `${currentProtocol}//${currentHost}:${urlParsed.port}`;

        return {
            data: newUrl,
            loading: false,
            error: null,
        }
    }
    else {
        return {
            data: envVarValue,
            loading: false,
            error: null,
        }
    }
}