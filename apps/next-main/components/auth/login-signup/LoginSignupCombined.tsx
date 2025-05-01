"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import posthog from "posthog-js";

import {useFeatureFlag} from "@/clientOnly/hooks/useFeatureFlag";
import {useOauthAvailable} from "@/clientOnly/hooks/useOauthAvailable";
import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {
  useRsnUser,
  useRsnUserId,
} from "@/clientOnly/hooks/useRsnUser";
import VoronoiBackgroundDefault
  from "@/components/backgrounds/VoronoiBackgroundDefault";
import {PodcastChip} from "@/components/chips/PodcastChip";
import {
  SimpleSkillChipWithAutoEmoji,
} from "@/components/chips/SkillChip/SkillChipWithAutoEmoji";
import {ReasonoteBetaIcon} from "@/components/icons/FavIcon";
import {TxtField} from "@/components/textFields/TxtField";
import {Txt} from "@/components/typography/Txt";
import {
  Check,
  Email,
  Key,
  Person,
} from "@mui/icons-material";
import {
  Alert,
  AlertColor,
  Button,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {AuthError} from "@supabase/supabase-js";

import {LinearProgressWithLabel} from "../../progress/LinearProgressWithLabel";
import {useSupabase} from "../../supabase/SupabaseProvider";
import {useSupabaseUser} from "../../supabase/useSupabaseUser";
import {OauthProviderButtons} from "./OauthProviderButtons";

function TrialSignupMessage() {
  return (
    <Txt variant="h6" align="center" color="text.primary" sx={{ mt: 1 }}>
      Sign up to start your free trial
    </Txt>
  );
}

export default function LoginSignupCombined() {
  const theme = useTheme();
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useSupabaseUser();
  const searchParams = useSearchParams();
  const startLearningSubject = searchParams?.get('startLearningSubject');
  const startListeningSubject = searchParams?.get('startListeningSubject');
  const startListeningPodcastId = searchParams?.get('startListeningPodcastId');
  const {value: startTrialString} = useSearchParamHelper('startTrial', 'false');
  const startTrial = startTrialString === 'true' || startTrialString === '1';
  const startLearningSkillId = searchParams?.get('startLearningSkillId');
  const startTab = searchParams?.get('startTab') || 'login';

  const {data: startLearningSkill} = useSkillFlatFragLoader(startLearningSkillId);

  const startLearningTopicName = useMemo(() => {
    if (startLearningSkillId) {
      return startLearningSkill?.name;
    }
    else if (startLearningSubject) {
      return startLearningSubject;
    }
    return null;
  }, [startLearningSkillId, startLearningSkill, startLearningSubject]);

  const rsnUserId = useRsnUserId();

  const {hasLoggedIn} = useRsnUser();

  const {refetch: refetchSubscription} = useReasonoteLicense();
  const allowAnonymousUsers = useFeatureFlag('allow-anonymous-users');

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // const [username, setUsername] = useState("");
  // const [userHasChangedUsername, setUserHasChangedUsername] = useState(false);

  // useEffect(() => {
  //     if (!userHasChangedUsername && (firstName || lastName)) {
  //         setUsername(`${firstName.toLowerCase()}-${lastName.toLowerCase()}`);
  //     }
  // }, [firstName, lastName])

  // useEffect(() => {
  //     if (trimAllLines(username).length < 1) {
  //         setUserHasChangedUsername(false);
  //     }
  // }, [username])

  const [issues, setIssues] = useState<
    {
      msg: string | React.ReactNode;
      severity: AlertColor;
      action?: React.ReactNode;
    }[]
  >([]);
  const oauthIsAvailable = useOauthAvailable();

  const setSelectedTab = useCallback((tab: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('startTab', tab === 0 ? 'login' : 'signup');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const getRedirectUrl = useCallback(() => {
    const redirect = searchParams?.get('redirect');
    const redirectTo = searchParams?.get('redirectTo');
    const startListeningPodcastId = searchParams?.get('startListeningPodcastId');

    var usingRedirect = redirect ? 
      redirect
      :
      redirectTo ?
        redirectTo
      :
      startListeningPodcastId ?
        `/app/podcast/${startListeningPodcastId}/player`
      :
      null;

    if (redirect && redirectTo) {
      console.warn('Both "redirect" and "redirectTo" parameters were specified. Using "redirect".');
    }

    if ((redirect || redirectTo) && startListeningPodcastId) {
      console.warn('Redirect and startListeningPodcastId both specified. Ignoring startListeningPodcastId.');
    }

    return usingRedirect;
  }, [searchParams]);

  const redirectAfterAuth = useCallback(() => {
    const redirectUrl = getRedirectUrl();
    if (redirectUrl) {
      router.push(decodeURIComponent(redirectUrl));
    } else {
      router.push("/app");
    }
  }, [router, getRedirectUrl]);

  const redirectUrl = useMemo(() => getRedirectUrl(), [getRedirectUrl]);

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const redirectUrl = getRedirectUrl();
    if (redirectUrl && rsnUserId && user && !user.is_anonymous) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.push(decodeURIComponent(redirectUrl));
      }, 3000); // 3 seconds delay before redirect
      return () => clearTimeout(timer);
    }
  }, [getRedirectUrl, rsnUserId, user, router]);

  // Handlers
  const handleChangeTab = (event: any, newValue: any) => {
    setIssues([]);
    setSelectedTab(newValue);
  };

  // Login function
  const onPasswordLogin = useCallback(async () => {
    setIssues([]);

    if (hasLoggedIn) {
      console.warn('User is already logged in. Redirecting...');
      redirectAfterAuth();
      return;
    }

    const idBeforeLogin = rsnUserId;

    var signInError: AuthError | null = null;

    if (allowAnonymousUsers) {
      // 3. Sign in to the existing account
      var {
        data: { user: existingUser },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      // Link identities if we have an existing user, which we generally should.
      if (existingUser && idBeforeLogin) {
        // Call function to link identities.
        // This should transfer everything from anonymous_user to the existing user.
        await supabase.rpc('link_anon_user_to_user', {
          p_anon_user_id: idBeforeLogin,
          p_user_id: existingUser.id,
        })
      }
    }
    else {
      // If the user already exists, try to login.
      var { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }


    if (signInError) {
      posthog.capture("signin-error", {
        email,
        error: signInError,
      }, {
        send_instantly: true,
      });

      if (signInError.message === "Invalid login credentials") {
        setIssues([
          {
            msg: `Invalid Login Credentials.`,
            severity: "error",
            action: (
              <Stack>
                <Typography>
                  If you haven't signed up yet,
                </Typography>
                <Button
                  onClick={() => handleChangeTab(null, 1)}
                  variant="contained"
                  size="small"
                >
                  Sign Up
                </Button>
                <Divider/>
              </Stack>
            )
          },
        ]);
        return;
      } else {
        setIssues([
          {
            msg: `An error occurred while signing in: ${signInError.message}`,
            severity: "error",
          },
        ]);
        return;
      }

    }

    posthog.capture("signin", {
      email,
    }, {
      send_instantly: true,
    });

    // Get user details from current session.
    const { data: foundUserData, error: foundUserEror } = await supabase.auth.getUser();

    if (foundUserEror || !foundUserData) {
      setIssues([
        {
          msg: "Incorrect Email or Password. Sign up?",
          severity: "warning",
          action: (
            <Button
              onClick={() => handleChangeTab(null, 1)}
              variant="contained"
              size="small"
            >
              Sign Up
            </Button>
          ),
        },
      ]);
      return;
    }

    // Run login_jwt to sync the users...
    await supabase.rpc('login_jwt', {
      browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })

    // Add this line at the end of the function
    if (!signInError) {
      await refetchSubscription();
      redirectAfterAuth();
    }
  }, [email, password, supabase.auth, redirectAfterAuth, allowAnonymousUsers, hasLoggedIn, refetchSubscription]);

  // Sign Up function
  const onPasswordSignUp = useCallback(async () => {
    setIssues([]);

    if (hasLoggedIn) {
      console.warn('User is already logged in. Redirecting...');
      redirectAfterAuth();
      return;
    }

    const idBeforeSignup = rsnUserId;

    // STEP 1: Sign up using supabase auth.
    const { error, data: signUpData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          given_name: firstName,
          family_name: lastName,
        }
      }
    });

    const newId = signUpData?.user?.id;

    if (error) {
      posthog.capture("signup-error", {
        email,
        firstName,
        lastName,
        error,
      }, {
        send_instantly: true,
      });

      if (error.message === "User already registered") {
        setIssues([
          {
            msg: "User already registered. Login?",
            severity: "warning",
            action: (
              <Button
                onClick={() => handleChangeTab(null, 0)}
                variant="contained"
              >
                Login
              </Button>
            ),
          },
        ]);
      } else {
        console.error("Error Signing Up:", error);
        if (error.message === "Password should be at least 6 characters") {
          setIssues([
            {
              msg: "Password should be at least 6 characters",
              severity: "error",
            },
          ]);
        }
      }
    } else {
      posthog.capture("signup", {
        email,
        firstName,
        lastName,
      }, {
        send_instantly: true,
      });
      // Run login_jwt to sync the users and create the rsn user...
      await supabase.rpc('login_jwt', {
        browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })

      // STEP 2: Get the rsnUserId from the supabase user.
      const { data: fetchedRsnUsrId } = (await supabase.rpc(
        "current_rsn_user_id",
        undefined
      )) as { data: string };

      if (allowAnonymousUsers && idBeforeSignup && newId) {
        // If we're allowing anonymous users,
        // Link the anonymous user to the newly created user.
        await supabase.rpc('link_anon_user_to_user', {
          p_anon_user_id: idBeforeSignup,
          p_user_id: newId,
        })
      }

      await refetchSubscription();
 
      redirectAfterAuth();
    }
  }, [email, password, firstName, lastName, router, supabase.auth, redirectAfterAuth, hasLoggedIn, refetchSubscription]);


  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <VoronoiBackgroundDefault />
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 1
      }}>
        <Stack
          alignItems="center"
          justifyContent="center"
          gap={2}
          sx={{
            borderRadius: "10px",
            padding: "20px",
            minWidth: "300px",
            maxWidth: "360px",
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', // Add a subtle shadow
          }}
        >
          {rsnUserId && user && !user.is_anonymous ? (
            <>
              <Stack direction="row" gap={1} alignItems="center">
                <Check color="success" />
                <Typography variant={"h5"}>You are logged in.</Typography>
              </Stack>
              <Typography>We have you logged in as:</Typography>
              <Paper elevation={10} sx={{ padding: "10px" }}>
                <Typography variant="body2">{user.email}</Typography>
              </Paper>

              {isRedirecting && (
                <Stack width="100%" gap={1}>
                  <LinearProgressWithLabel
                    label="You should be redirected shortly."
                    labelPos="above"
                    lpProps={{ sx: { width: '100%' } }}
                  />
                  <Typography variant="body2" align="center">
                    Click the button below to navigate immediately.
                  </Typography>
                </Stack>
              )}

              <Typography variant="body1">
                <Link
                  href={"/app/logout"}
                  style={{
                    textDecoration: "none",
                    color: theme.palette.primary.main,
                  }}
                >
                  Logout
                </Link>{" "}
                if you want to switch accounts.
              </Typography>

              <Button
                onClick={() => {
                  const redirectUrl = getRedirectUrl();
                  redirectUrl ? router.push(decodeURIComponent(redirectUrl)) : router.push("/app");
                }}
                variant="contained"
              >
                {getRedirectUrl() ? "Navigate" : "Home"}
              </Button>
            </>
          ) : (
            <>
              <ReasonoteBetaIcon size={48} />
              {
                startLearningTopicName ? 
                  <Stack>
                    <Txt variant="h5" align="center" fontWeight={'bold'}>
                      Start Learning
                    </Txt>
                    {startLearningTopicName && <SimpleSkillChipWithAutoEmoji skillName={startLearningTopicName}/>}
                    {startTrial && <TrialSignupMessage />}
                  </Stack>
                :
                startListeningSubject ?
                  <Stack>
                    <Txt variant="h5" align="center" fontWeight={'bold'}>
                      Start Listening To
                    </Txt>
                    <SimpleSkillChipWithAutoEmoji skillName={startListeningSubject}/>
                    {startTrial && <TrialSignupMessage />}
                  </Stack>
                  :
                  startListeningPodcastId ?
                    <Stack>
                      <Txt variant="h5" align="center" fontWeight={'bold'}>
                        Start Listening To
                      </Txt>
                      <PodcastChip podcastId={startListeningPodcastId}/>
                      {startTrial && <TrialSignupMessage />}
                    </Stack>
                  :
                  <Stack>
                    <Txt variant="h5" align="center" fontWeight={'bold'}>
                      Start Learning
                    </Txt>
                    {startTrial && <TrialSignupMessage />}
                  </Stack>
              }
              <Tabs value={startTab === 'login' ? 0 : 1} onChange={handleChangeTab} centered>
                <Tab label="Login" />
                <Tab label="Sign Up" />
              </Tabs>
              {startTab === 'login' && (
                <>
                  <Stack gap={2} sx={{ width: "66%", minWidth: "250px" }} alignItems={'center'}>
                    <OauthProviderButtons redirectTo={redirectUrl ? `${window.location.origin}${redirectUrl}` : undefined}/>
                    <Typography variant="body2">or</Typography>
                    <Stack gap={2}>                  
                      <TxtField
                        startIcon={<Email color={"gray" as any} />}
                        required
                        label="Email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        inputProps={{
                          "data-testid": "login-email-input"
                        }}
                      />
                      <TxtField
                        startIcon={<Key color={"gray" as any} />}
                        required
                        label="Password"
                        type={"password"}
                        placeholder="**********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        inputProps={{
                          "data-testid": "login-password-input"
                        }}
                      />
                      <Typography textAlign={'center'} variant="body2">
                        <Link href="/app/reset-password" style={{textDecoration: 'underline', color: 'lightgray'}}>Forgot password?</Link>
                      </Typography>
                    </Stack>
                  </Stack>
                  <Button
                    onClick={() => onPasswordLogin()}
                    disabled={!email || !password}
                    variant={(!email || !password) ? "outlined" : "contained"}
                  >
                    Login
                  </Button>
                </>
              )}
              {startTab === 'signup' && (
                <>
                  <Stack gap={2} sx={{ width: "66%", minWidth: "250px" }} alignItems={'center'}>
                    <OauthProviderButtons 
                      redirectTo={redirectUrl ? `${window.location.origin}${redirectUrl}` : undefined}
                    />
                    <Typography variant="body2">or</Typography>
                    <Stack gap={1} sx={{ width: "100%" }}>
                      <TxtField
                        startIcon={<Email color={"gray" as any} />}
                        required
                        label="Email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        inputProps={{
                          "data-testid": "signup-email-input"
                        }}
                      />
                      <TxtField
                        startIcon={<Key color={"gray" as any} />}
                        required
                        label="Password"
                        type={"password"}
                        placeholder="**********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        inputProps={{
                          "data-testid": "signup-password-input"
                        }}
                      />
                      <TxtField
                        startIcon={<Person color={"gray" as any} />}
                        required
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        fullWidth
                        inputProps={{
                          "data-testid": "signup-firstname-input"
                        }}
                      />
                      <TxtField
                        startIcon={<Person color={"gray" as any} />}
                        required
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        fullWidth
                        inputProps={{
                          "data-testid": "signup-lastname-input"
                        }}
                      />
                    </Stack>
                  </Stack>
                  <Button
                    onClick={() => onPasswordSignUp()}
                    disabled={!email || !password || !firstName}
                    data-testid="signup-button"
                    variant={(!email || !password || !firstName) ? "outlined" : "contained"}
                  >
                    Sign Up
                  </Button>
                </>
              )}
              {issues.length > 0 && (
                <Stack direction="column" gap={1}>
                  {issues.map((issue, idx) => (
                    <Alert
                      key={idx}
                      variant="outlined"
                      severity={issue.severity}
                    >
                      <Stack>
                        {issue.msg}
                        {issue.action}
                      </Stack>
                    </Alert>
                  ))}
                </Stack>
              )}
            </>
          )}
        </Stack>
      </div>
    </div>
  );
}
