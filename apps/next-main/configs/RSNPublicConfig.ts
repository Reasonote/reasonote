/**
 * I tried to use the normal Next.JS config file, but it didn't like "use client" pages... so...
 */
export const RSNPublicConfig = {
  pathsAllowedWithoutAuth: [
    "/app/login",
    "/app/signup",
    "/app/verify-email",
    "/app/reset-password",
    "/app/update-password",
    "/app/verify-res",
    "/app/profile",
    "/app/account",
    "/app/logout",
    "/app/private/wikipedia",
  ],
};
