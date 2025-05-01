import {PostHog} from "posthog-node";

export function getPosthogBackend() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_TOKEN) {
    // console.warn("NEXT_PUBLIC_POSTHOG_TOKEN is not set, returning null.");
    return null;
  }

  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_TOKEN, {
    host: "https://us.i.posthog.com",
  });
}
