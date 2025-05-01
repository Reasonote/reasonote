"use client";
import {useState} from "react";

import {useCheckoutModal} from "hooks/useCheckoutModal";
import Link from "next/link";
import {useRouter} from "next/navigation";

import {CancelSubscriptionRoute} from "@/app/api/cb/cancel_subscription/_route";
import {
  useIsPracticeV2Enabled,
} from "@/clientOnly/hooks/useIsPracticeV2Enabled";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useRsnUserSettings} from "@/clientOnly/hooks/useRsnUserSettings";
import {Btn} from "@/components/buttons/Btn";
import {CurrentLicenseTypeButton} from "@/components/buttons/LicenseTypeButton";
import NotificationSubscriptionSettings
  from "@/components/settings/NotificationSubscriptionSettings";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {UserLimitsDisplay} from "@/components/users/profile/UserLimitsDisplay";
import {useApolloClient} from "@apollo/client";
import {
  AccountCircle,
  CancelOutlined,
  DarkMode,
  Email,
  LightMode,
  NotificationImportant,
  Password,
  QueryStats,
  Science,
  Settings,
  SettingsBrightness,
  WorkspacePremium,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ReasonoteLicensePlan,
  ReasonoteLicensePlans,
} from "@reasonote/core";
import {getUserSettingFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";

import {useRsnUser} from "../../../clientOnly/hooks/useRsnUser";
import EmailSubscriptionForm from "../../components/EmailSubscriptionForm";

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        borderRadius: 1,
        padding: 1,
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        color: theme.palette.text.secondary,
      }}>
        {icon}
      </Box>
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
    </Stack>
  );
}

export default function SettingsPage() {
  const { rsnUser } = useRsnUser();
  const router = useRouter();
  const theme = useTheme();

  const { data: subData, refetch: refetchLicense } = useReasonoteLicense();
  const isPracticeV2Enabled = useIsPracticeV2Enabled();

  const licenseType = subData?.currentPlan.type;
  const licenseTypes = [licenseType];
  const { openCheckout, CheckoutModalComponent } = useCheckoutModal();

  // Extract cancellation information
  const isCanceled = subData?.currentPlan.isCanceled || false;
  const canceledAt = subData?.currentPlan.canceledAt;
  const cancellationReason = subData?.currentPlan.cancellationReason;

  const currentPlan = ReasonoteLicensePlans[licenseType as keyof typeof ReasonoteLicensePlans] as (ReasonoteLicensePlan | undefined);
  const upsell = currentPlan?.upsell;
  const upsellPlan = upsell?.upsellToType ? ReasonoteLicensePlans[upsell.upsellToType] : null;

  const { data: userSettings, loading: settingsLoading } = useRsnUserSettings();
  const { supabase } = useSupabase();
  const ac = useApolloClient();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const toggleTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    if (!rsnUser.data?.id) return;
    await supabase
      .from('user_setting')
      .upsert({
        id: userSettings?.id,
        rsn_user: rsnUser.data?.id,
        ui_theme: newTheme
      });

    ac.refetchQueries({
      include: [getUserSettingFlatQueryDoc]
    });

  };

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    toggleTheme(event.target.value as 'light' | 'dark' | 'system');
  };

  const toggleIsPracticeV2Enabled = async (newIsPracticeV2Enabled: boolean) => {
    if (!rsnUser.data?.id) return;
    await supabase
      .from('user_setting')
      .upsert({
        id: userSettings?.id,
        rsn_user: rsnUser.data?.id,
        metadata: {
          ...JSON.parse(userSettings?.metadata || "{}"),
          enable_practice_v2: newIsPracticeV2Enabled,
        }
      });

    ac.refetchQueries({
      include: [getUserSettingFlatQueryDoc]
    });
  };

  const handleEnablePracticeV2Change = (event: SelectChangeEvent<string>) => {
    toggleIsPracticeV2Enabled(event.target.value === 'true');
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setCancelError(null);
    
    try {
      // Get the current subscription ID
      const { data: subscriptions, error } = await supabase
        .rpc("get_user_stripe_subs_short");
      
      if (error) {
        throw new Error("Failed to retrieve subscription information");
      }
      
      if (!subscriptions || subscriptions.length === 0) {
        throw new Error("No active subscription found");
      }
      
      // We'll cancel the first subscription found (users typically have only one)
      const subscriptionId = subscriptions[0].stripe_subscription_id;
      
      // Call Stripe API to cancel the subscription
      const response = await CancelSubscriptionRoute.call({
        subscriptionId: subscriptionId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel subscription');
      }
      
      setCancelSuccess(true);
      
      // Refresh license data to reflect the changes
      ac.refetchQueries({
        include: [getUserSettingFlatQueryDoc]
      });
      
      // Also refetch the license data directly
      refetchLicense();
      
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setCancelError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setCancelLoading(false);
    }
  };

  const isPaidPlan = licenseType === 'Reasonote-Basic' || licenseType === 'Reasonote-Pro';

  return (
    <Stack spacing={3} sx={{ width: '100%', alignItems: 'center' }}>
      {/* Page Header */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          width: '80%',
          maxWidth: '500px',
          pt: 2,
        }}
      >
        <Settings sx={{
          fontSize: 40,
          color: theme.palette.text.primary
        }} />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary
          }}
        >
          Settings
        </Typography>
      </Stack>

      <Card
        sx={{
          minWidth: "350px",
          width: "80%",
          maxWidth: "500px",
          boxShadow: theme.shadows[3],
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            {/* Account Section - Combined Profile and Security */}
            <Stack spacing={1}>
              <SectionHeader icon={<AccountCircle />} title="Account" />
              <Stack spacing={2} sx={{ pl: 2 }}>
                {/* Profile Info */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <CurUserAvatar sx={{ width: '48px', height: '48px' }} />
                  {rsnUser.data?.authEmail && (
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Email fontSize="small" color="action" />
                        <Typography variant="body1">
                          {rsnUser.data.authEmail}
                        </Typography>
                      </Stack>
                    </Stack>
                  )}
                </Stack>

                {/* Security Controls */}
                <Btn
                  variant="outlined"
                  startIcon={<Password />}
                  onClick={() => router.push("/app/update-password")}
                  sx={{ width: 'fit-content' }}
                >
                  Update Password
                </Btn>
              </Stack>
            </Stack>

            <Divider />

            {/* License Section */}
            <Stack spacing={1}>
              <SectionHeader icon={<WorkspacePremium />} title="Subscription" />

              <Stack spacing={2}>
                <Box sx={{ position: 'relative' }}>
                  <CurrentLicenseTypeButton
                    chipProps={{
                      sx: {
                        fontSize: '1rem',
                        padding: '16px',
                      }
                    }}
                  />
                  
                  {/* Cancelled Badge */}
                  {isCanceled && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        backgroundColor: theme.palette.error.main,
                        color: theme.palette.error.contrastText,
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      Cancelled
                    </Box>
                  )}
                </Box>
                
                {/* Cancellation Info */}
                {isCanceled && canceledAt && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Your subscription was cancelled on {new Date(canceledAt).toLocaleDateString()}.
                      {cancellationReason && (
                        <> Reason: {cancellationReason}</>
                      )}
                      <br />
                      You'll have access until the end of your current billing period.
                    </Typography>
                    {/* Resubscribe button */}
                    {isPaidPlan && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          // Determine the lookup key based on the license type
                          let lookupKey = '';
                          if (licenseType === 'Reasonote-Basic') {
                            lookupKey = process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY || '';
                          } else if (licenseType === 'Reasonote-Pro') {
                            lookupKey = process.env.NEXT_PUBLIC_REASONOTE_PRO_MONTHLY_DEFAULT_LOOKUP_KEY || '';
                          }
                          
                          openCheckout({
                            lookupKey,
                            couponCode: process.env.NEXT_PUBLIC_STRIPE_20_OFF_COUPON_CODE
                          });
                        }}
                        sx={{ mt: 1 }}
                      >
                        Resubscribe
                      </Button>
                    )}
                  </Alert>
                )}
                
                {/* Cancel Subscription Button - only show for paid plans that are not already cancelled */}
                {isPaidPlan && !isCanceled && (
                  <Box>
                    {cancelSuccess ? (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Your subscription has been canceled. You'll have access until the end of your current billing period.
                      </Alert>
                    ) : (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelOutlined />}
                        onClick={() => setCancelDialogOpen(true)}
                        sx={{ mt: 1 }}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? 'Canceling...' : 'Cancel Subscription'}
                      </Button>
                    )}
                    {cancelError && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        Error: {cancelError}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>

              {/* Upgrade Card */}
              {upsellPlan && upsell && (
                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}35, ${theme.palette.primary.main}20)`,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6" color={theme.palette.text.primary}>
                        {upsell?.upsellText}
                      </Typography>
                      <Typography variant="body2" color={theme.palette.text.primary} sx={{ opacity: 0.8 }}>
                        {upsell?.upsellDescription}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => openCheckout({
                          lookupKey: upsell.upsellLookupKey ?? '',
                          couponCode: process.env.NEXT_PUBLIC_STRIPE_20_OFF_COUPON_CODE
                        })}
                        sx={{
                          alignSelf: 'flex-start',
                          fontWeight: 600,
                          px: 3,
                          background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                          color: 'white',
                        }}
                      >
                        Upgrade Now
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>


            <Divider />

                        {/* Theme Selection */}
                        <Stack spacing={1}>
              <SectionHeader icon={<DarkMode />} title="Theme" />
              <Stack direction="row" spacing={2} alignItems="center" sx={{ pl: 2 }}>
                <Select
                  value={userSettings?.uiTheme || 'system'}
                  onChange={handleThemeChange}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="light">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LightMode fontSize="small" />
                      <Typography>Light</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="dark">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DarkMode fontSize="small" />
                      <Typography>Dark</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="system">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SettingsBrightness fontSize="small" />
                      <Typography>System</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </Stack>
            </Stack>

            <Divider />


            {/* Move Notifications section up, after Profile */}
            <Stack spacing={1}>
              <SectionHeader icon={<NotificationImportant />} title="Notifications" />
              <Box sx={{ pl: 2 }}>
                <Stack spacing={3}>
                  <Typography variant="subtitle1">Email Notifications</Typography>
                  {rsnUser.data?.id ? (
                    <EmailSubscriptionForm />
                  ) : (
                    <>
                      <Typography>Please sign in to manage your email settings.</Typography>
                      <Link href="/app/login?redirectTo=/app/settings" style={{ textDecoration: "none" }}>
                        <Button color="primary" variant="contained">
                          Login
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  <Typography variant="subtitle1" sx={{ mt: 3 }}>Push Notifications</Typography>
                  {rsnUser.data?.id ? (
                    <NotificationSubscriptionSettings />
                  ) : (
                    <Typography>Please sign in to manage your push notification settings.</Typography>
                  )}
                </Stack>
              </Box>
            </Stack>

            <Divider />

            {/* Usage Limits Section */}
            <Stack spacing={1}>
              <SectionHeader icon={<QueryStats />} title="Usage & Limits" />
              <Box sx={{ pl: 2 }}>
                <UserLimitsDisplay />
              </Box>
            </Stack>

            <Divider />

            {/* Beta Features Section */}
            <Stack spacing={1}>
              <SectionHeader icon={<Science />} title="New Features" />
              <Stack direction="row" spacing={2} alignItems="center" sx={{ pl: 2 }}>
                <>
                  <Select
                    value={String(isPracticeV2Enabled)}
                    onChange={handleEnablePracticeV2Change}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="true">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Practice V2</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="false">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Practice V1</Typography>
                      </Stack>
                    </MenuItem>
                  </Select>
                </>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <CheckoutModalComponent />

      {/* Cancellation Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription? You'll continue to have access to all features until the end of your current billing period.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Subscription
          </Button>
          <Button 
            onClick={() => {
              setCancelDialogOpen(false);
              handleCancelSubscription();
            }} 
            color="error"
            variant="contained"
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Stack >
  );
}
