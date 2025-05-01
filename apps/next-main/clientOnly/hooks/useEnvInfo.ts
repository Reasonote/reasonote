'use client'

export function useEnvInfo() {
  const hostname = window.location.hostname;

  return {
    hostname,
    isLocal: hostname === "localhost",
    isDev: hostname === "dev.reasonote.com",
    isProd: hostname === "reasonote.com",
  }
}