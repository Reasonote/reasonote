"use client";

/** The base `/app` path. */
export const GET_REASONOTE_APP_PATH = () => `${window.location.origin}/app`;

/** The path to the page used to update the user's password. */
export const GET_REASONOTE_UPDATE_PASSWORD_URL = () =>
  `${GET_REASONOTE_APP_PATH()}/update-password`;
