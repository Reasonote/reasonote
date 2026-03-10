"use client";
import "../../styles/semiglobal.module.css";
import "../../styles/global.css";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {UserInteractionProvider} from "contexts/UserInteractionContext";
import type PostHogType from "posthog-js";

import {AIBrowserProvider} from "@/clientOnly/ai/AIBrowserProvider";
import {BreadcrumbProvider} from "@/clientOnly/context/BreadcrumbContext";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useRsnUserSettings} from "@/clientOnly/hooks/useRsnUserSettings";
import {useSupabaseUrl} from "@/clientOnly/hooks/useSupabaseUrl";
import {RsnClientProvider} from "@/clientOnly/sdk/RsnClientContext";
import {ThemeVariablesProvider} from "@/styles/ThemeVariablesProvider";
import {
  ApolloProvider,
  useApolloClient,
} from "@apollo/client";
import {
  CssBaseline,
  ThemeProvider,
  useTheme,
} from "@mui/material";
import {
  createReasonoteApolloClient,
  getUserSettingFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncMemo} from "@reasonote/lib-utils-frontend";
import {Analytics} from "@vercel/analytics/react";

import {
  atkinson_hyperlegible,
  createReasonoteTheme,
} from "../../styles/theme";
import ClientOnly from "../ClientOnly";
import {DowntimeFullPage} from "../downtime/DowntimeFullPage";
import SupabaseProvider, {useSupabase} from "../supabase/SupabaseProvider";

class RootErrorBoundary extends React.Component {
  state = { hasError: false };
  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // componentDidCatch(error, errorInfo) {
  //   // You can also log the error to an error reporting service
  //   logErrorToMyService(error, errorInfo);
  // }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          style={{
            height: "100dvh",
            width: "100vw",
            display: "flex",
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            justifyItems: "center",
          }}
        >
          <h1>Something went wrong.</h1>
        </div>
      );
    }

    //@ts-ignore
    return this.props.children;
  }
}

function AppProviderWrapper({ children }: React.PropsWithChildren<{}>) {
  const theme = useTheme();
  const { data: sbUrl } = useSupabaseUrl();
  const { supabase } = useSupabase();

  if (!sbUrl) throw new Error("No Supabase URL provided");

  const apolloClient = useAsyncMemo(async () => {
    return createReasonoteApolloClient({
      uri: `${sbUrl}/graphql/v1`,
      async getApiKey() {
        return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      },
      async getToken() {
        // TODO: This should be the user's token, if they are logged in.
        return (await supabase.auth.getSession()).data.session?.access_token;
      },
    });
  }, [sbUrl]);

  if (!apolloClient) {
    // Show a lightweight loading state instead of null to avoid blank screen
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.palette.background.default,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: `4px solid ${theme.palette.divider}`,
            borderTopColor: theme.palette.primary.main,
            borderRadius: "50%",
            animation: "rsn-spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes rsn-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    //@ts-ignore - ApolloProvider react component is not typed correctly.
    <ApolloProvider client={apolloClient}>
      {/* Sets up Vercel Analytics */}
      <Analytics />
      <RsnClientProvider>
        {children}
      </RsnClientProvider>
    </ApolloProvider>
  );
}

export function UserHandling({ children }: any) {
  // This will now handle all the login logic internally
  useRsnUser();
  
  return <>{children}</>;
}

// Lazily loaded posthog instance - loaded after initial render to avoid blocking
let _posthogInstance: typeof PostHogType | null = null;
function getPosthog(): typeof PostHogType | null {
  return _posthogInstance;
}

export function PosthogProvider({ children }: any) {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

    if (!token) {
      console.warn("No Posthog token found, skipping init");
      return;
    }

    // only if on reasonote.com do we do this, not on dev.reasonote.com or localhost, or anything else.
    if (window.location.hostname === 'reasonote.com' || window.location.hostname === 'www.reasonote.com') {
      // Lazy-load posthog to keep it off the critical rendering path
      import("posthog-js").then(({ default: posthog }) => {
        _posthogInstance = posthog;
        posthog.init(token, {
          api_host: '/posthog/ingest',
          person_profiles: 'identified_only',
          session_recording: {
            maskAllInputs: false,
            maskInputOptions: {
              password: true,
            }
          }
        });
      });
    }
    else {
      console.warn("Not on reasonote.com or www.reasonote.com, skipping Posthog init");
    }
  }, [])

  // Identify the user with posthog.
  const rsnUserResult = useRsnUser();
  const rsnUserId = rsnUserResult.rsnUserId;
  const rsnUser = rsnUserResult.rsnUser;
  const email = rsnUser?.data?.authEmail;
  const name = (rsnUser?.data?.familyName ?? "") + " " + (rsnUser?.data?.givenName ?? "");

  useEffect(() => {
    const posthog = getPosthog();
    if (!posthog) return;
    if (rsnUserId) {
      posthog.identify(rsnUserId, {
        email: email,
        name: name,
        rsnUserId: rsnUserId,
      });
    }
    else {
      posthog.reset();
    }
  }, [rsnUserId, email, name]);


  return <>{children}</>
}


function ReasonoteThemeProvider({ children }: any) {
  const { data: userSettings, loading, error } = useRsnUserSettings();
  const ac = useApolloClient();

  // Add state to track system theme
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  );

  // Add effect to listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
      ac.refetchQueries({
        include: [getUserSettingFlatQueryDoc]
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = useMemo(() => {
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;

    let themeMode: 'light' | 'dark';

    if (userSettings?.uiTheme) {
      themeMode = userSettings.uiTheme === 'system' ? systemTheme : userSettings.uiTheme as 'light' | 'dark';
      localStorage.setItem('theme', userSettings.uiTheme);
    } else if (storedTheme) {
      themeMode = storedTheme === 'system' ? systemTheme : storedTheme as 'light' | 'dark';
    } else {
      themeMode = systemTheme;
      localStorage.setItem('theme', 'system');
    }

    return createReasonoteTheme(themeMode);
  }, [userSettings, loading, error, systemTheme]); // Add systemTheme to dependencies

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeVariablesProvider>
        {children}
      </ThemeVariablesProvider>
    </ThemeProvider>
  );
}

export function AnonUserUpgrader({ children }: any) {
  const rsnUserResult = useRsnUser();
  const { supabase } = useSupabase();

  useEffect(() => {
    // If user is anonymous, store their ID
    if (rsnUserResult.userStatus === 'anonymous' && rsnUserResult.rsnUserId) {
      localStorage.setItem('fromAnonymousUser', rsnUserResult.rsnUserId);
    }
    // If user is logged in and we have a stored anonymous ID, link them
    else if (rsnUserResult.userStatus === 'logged_in' && rsnUserResult.rsnUserId) {
      const storedAnonId = localStorage.getItem('fromAnonymousUser');
      if (storedAnonId) {
        console.debug("Linking anon user to user", storedAnonId, rsnUserResult.rsnUserId);
        supabase.rpc('link_anon_user_to_user', {
          p_anon_user_id: storedAnonId,
          p_user_id: rsnUserResult.rsnUserId
        }).then(() => {
          console.debug("Linked anon user to user, clearing storage");
          localStorage.removeItem('fromAnonymousUser');
        });
      }
    }
  }, [rsnUserResult.userStatus, rsnUserResult.rsnUserId]);

  return <>{children}</>;
}

export function RSNTAppLayout({ children }: any) {
  const theme = useTheme();

  return (
    <div
      id="RSNT-APP"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        background: theme.palette.background.default,
      }}
      className={atkinson_hyperlegible.className}
    >
      <RootErrorBoundary>

        {/* We run our app client-only, because it requires such */}
        <ClientOnly>
          <UserInteractionProvider>
            {/* We i Fnject our other providers. */}
            <SupabaseProvider>
              <AppProviderWrapper>
                <UserHandling>
                  <AIBrowserProvider hostUrl="">
                    <AnonUserUpgrader>
                      <PosthogProvider>
                        <ReasonoteThemeProvider>
                          <BreadcrumbProvider>
                            <div
                              id={"RSNT-APP-INNER"}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100vw",
                                height: "100dvh",
                              }}
                            >
                              <DowntimeProvider>
                                {children}
                              </DowntimeProvider>
                            </div>
                          </BreadcrumbProvider>
                        </ReasonoteThemeProvider>
                      </PosthogProvider>
                    </AnonUserUpgrader>
                  </AIBrowserProvider>
                </UserHandling>
              </AppProviderWrapper>
            </SupabaseProvider>
          </UserInteractionProvider>
        </ClientOnly>
      </RootErrorBoundary>
    </div>
  );
}

export function DowntimeProvider({ children }: any) {
  const showDowntime = ["true", "1"].includes(process.env.NEXT_PUBLIC_SHOW_DOWNTIME ?? "");

  if (showDowntime) {
    return <DowntimeFullPage />;
  }

  return <>{children}</>;
}

export function RootLayout({ children }: any) {
  const theme = useTheme();

  // The entire app is wrapped in a very simple error boundary.
  return (
    <html lang="en">
      <body
        id="BODY"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          background: theme.palette.background.default,
        }}
      >
        <RSNTAppLayout>
          {children}
        </RSNTAppLayout>
      </body>
    </html>
  );
}

// do not cache this layout
export const revalidate = 0;
