export function isRunningInNode(): boolean {
    //We ignore this line because otherwise in server environments we will get a ts warning.
    //@ts-ignore
    return typeof window === 'undefined';
}

export function isRunningInFrontend(): boolean {
    //We ignore this line because otherwise in server environments we will get a ts warning.
    //@ts-ignore
    return typeof window !== 'undefined';
}

function envVarNotSetErorMessage(name: string): string {
    return `${name} is a required environment variable. If you are in a development envrionment, ensure you have correctly followed the instructions in the project root to setup your environment.`
}

/**
 * Requires an environment variable to be set, and returns the set environment variable,
 * OR throws an error if the environment variable was not fount.
 * @param envVarName The name of the environment variable.
 * @returns The environment variable that was parsed
 */
export function requireEnvVar(envVarName: string): string {
    const dotenv = require('dotenv');
    dotenv.config()
    const ret = process.env[envVarName];

    if (ret) {
        return ret;
    }
    else {
        throw new Error(envVarNotSetErorMessage(envVarName))
    }
}