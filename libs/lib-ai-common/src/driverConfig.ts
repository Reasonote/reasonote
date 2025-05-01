export function driverConfigToRegistryString(driverConfig: {type: string, config: {model: string}}): string{
    return `${driverConfig.type}:${driverConfig.config.model}`;
}