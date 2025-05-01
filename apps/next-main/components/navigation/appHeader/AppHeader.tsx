import React, {useEffect} from "react";

import {
  AlignJustify,
  ChevronLeft,
  PlusCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {vFYPIntent} from "@/app/app/foryou/FYPState";
import {useBreadcrumbs} from "@/clientOnly/context/BreadcrumbContext";
import RsnErrorBoundary from "@/clientOnly/error/RsnErrorBoundary";
import {useFeatureFlag} from "@/clientOnly/hooks/useFeatureFlag";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useUserIsLoggedIn} from "@/clientOnly/hooks/useUserIsLoggedIn";
import {useUserXP} from "@/clientOnly/hooks/useUserXP";
import {sidebarCollapsedVar} from "@/clientOnly/state/userVars";
import {useReactiveVar} from "@apollo/client";
import {
  AppBar,
  Button,
  Chip,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import LoginOrAccountButton from "../../auth/login/LoginOrAccountButton";
import {CurrentLicenseTypeButton} from "../../buttons/LicenseTypeButton";
import {SkillChip} from "../../chips/SkillChip/SkillChip";
import {ReasonoteBetaIcon} from "../../icons/FavIcon";
import {DailyProgress} from "../../xp/progress/DailyProgress";

export function useAppHeaderDisabled() {
  const headerDisabledRegexes = [
    /\/app\/lessons\/.*\/new_session/,
    /\/app\/onboarding.*/,
    /\/app\/skills\/skill_.*/,
    /\/app\/demo-video\/.*/,
    /\/app\/courses\/.*\/view.*/,
  ]

  const curPathName = usePathname();

  const pathRegexesMatch = headerDisabledRegexes.some((regex) => regex.test(curPathName ?? ''));

  const fypIntent = useReactiveVar(vFYPIntent);

  const onFypFocus = fypIntent?.type === 'review-pinned' || fypIntent?.type === 'review-all';

  return pathRegexesMatch || onFypFocus;
}

function AppHeaderErrorFallback() {
  const theme = useTheme();

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
      }}
      color="transparent"
    >
      <Toolbar
        variant="regular"
        sx={{
          backgroundColor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`,
          padding: '0px 10px'
        }}
      >
        <Stack
          direction="row"
          width="100%"
          alignItems="center"
          justifyContent="space-between"
          px={2}
        >
          <Stack direction="row" gap={2} alignItems="center">
            <Link href="/app" style={{ textDecoration: "none" }}>
              <Button
                size="small"
                color="inherit"
                sx={{ minWidth: "20px" }}
              >
                <ReasonoteBetaIcon size={25} />
              </Button>
            </Link>
          </Stack>
          <Tooltip title="Error loading app header">
            <Chip
              label="Error loading header"
              color="error"
              sx={{ height: 32 }}
            />
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export function AppHeader(props: {
  ignoreDisabled?: boolean;
  onSidebarClick?: () => void;
  isSidebarOpen?: boolean;
}) {
  return (
    <RsnErrorBoundary fallback={<AppHeaderErrorFallback />}>
      <AppHeaderInner {...props} />
    </RsnErrorBoundary>
  );
}

export function AppHeaderInner({
  ignoreDisabled,
  onSidebarClick,
  disableSidebar,
}: {
  ignoreDisabled?: boolean;
  onSidebarClick?: () => void;
  disableSidebar?: boolean;
}) {
  const theme = useTheme();
  const curPathName = usePathname();
  const { data: isLoggedIn } = useUserIsLoggedIn();
  const isAdminPage = curPathName?.startsWith("/app/admin");
  const showHeaderAddButton = useFeatureFlag('enable-header-add-button');
  const rsnUserId = useRsnUserId();
  const { data: userXPData, refetch: refetchUserXP, loading: userXPLoading } = useUserXP();

  
  // Use the Apollo reactive variable for sidebar state
  const sidebarCollapsed = useReactiveVar(sidebarCollapsedVar);
  const toggleSidebar = () => {
    if (onSidebarClick) {
      onSidebarClick();
    } else {
      sidebarCollapsedVar(!sidebarCollapsed);
    }
  };

  // Use the breadcrumbs context instead of the reactive variable
  const { breadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    if (!rsnUserId) return;
    refetchUserXP();
  }, [rsnUserId]);

  const isSmallDevice = useIsSmallDevice();

  const router = useRouter();

  const appBarIsDisabled = false; 

  const hideProgressIndicator = curPathName?.endsWith('/practice/practice') || curPathName?.endsWith('/practice_v2/practice') || !isLoggedIn;
  const hideLicenseTypeButton = curPathName?.startsWith('/app/tools');

  
  const showingBreadcrumbHeader = isSmallDevice && breadcrumbs && breadcrumbs.length > 0;


  // Function to render a single breadcrumb
  const renderBreadcrumb = (breadcrumb: any, index: number) => {
    if (breadcrumb.entityId) {
      return (
        <SkillChip
          key={`breadcrumb-${index}`}
          topicOrId={breadcrumb.entityId}
          disableAddDelete
          disableLevelIndicator
          disableModal
          size={isSmallDevice ? "small" : "medium"}
        />
      );
    } else {
      return (
        <Button
          key={`breadcrumb-${index}`}
          onClick={breadcrumb.onClick}
          variant="text"
          color="inherit"
          size={isSmallDevice ? "small" : "medium"}
        >
          {breadcrumb.name}
        </Button>
      );
    }
  };

  return appBarIsDisabled ? null : (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
      }}
      color="transparent"
    >
      {
        isAdminPage && (
          <Stack
            direction="row"
            sx={{ width: '100%', background: 'orange' }}
            alignItems={'center'}
            justifyContent={'space-between'}
            p={0}
          >
            <Typography variant="body1" color={theme.palette.text.primary}>
              Internal
            </Typography>
            <Button
              variant="text"
              color="inherit"
              onClick={() => router.push('/app/admin')}
            >
              Admin Dashboard
            </Button>
          </Stack>
        )
      }

      <Toolbar
        variant="regular"
        disableGutters
        sx={{
          backgroundColor: 'background.paper',
          justifyContent: 'space-between',
          pl: isSmallDevice ? 0 : 1,
          pr: isSmallDevice ? 1 : 2,
          height: isSmallDevice ? 48 : 56
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={isSmallDevice ? 1 : 2}
          sx={{ flex: '0 1 auto' }}
        >
          {showingBreadcrumbHeader ? (
            // Render breadcrumbs with back button (mobile only)
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Back to Home">
                <IconButton
                  onClick={() => router.push('/app')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronLeft />
                </IconButton>
              </Tooltip>
              
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.id || `breadcrumb-${index}`}>
                  {index > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      /
                    </Typography>
                  )}
                  {renderBreadcrumb(breadcrumb, index)}
                </React.Fragment>
              ))}
            </Stack>
          ) : (
            // Render standard header elements (always on desktop, fallback on mobile)
            <>
              {isSmallDevice ? (
                // Mobile layout without breadcrumbs
                <Stack direction="row" alignItems="center" spacing={1}>
                  {!disableSidebar && (
                    <Tooltip title={sidebarCollapsed ? "Open Menu" : "Close Menu"}>
                      <IconButton 
                        onClick={toggleSidebar}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {sidebarCollapsed ? <AlignJustify size={24} /> : <X size={24} />}
                      </IconButton>
                    </Tooltip>
                  )}

                  {sidebarCollapsed && (
                    <Link href="/app" style={{ textDecoration: "none" }}>
                      <IconButton
                        color="inherit"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ReasonoteBetaIcon size={25} />
                      </IconButton>
                    </Link>
                  )}
                </Stack>
              ) : (
                // Desktop layout
                sidebarCollapsed && !disableSidebar && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Create New Skill">
                      <IconButton
                        onClick={() => router.push('/app')}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PlusCircle size={24} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              )}
            </>
          )}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={isSmallDevice ? 0.5 : 1}
          sx={{ flex: '0 1 auto' }}
        >
          {/* Only show these elements if not on mobile with open sidebar */}
          {(!isSmallDevice || sidebarCollapsed) && (
            <>
              <RsnErrorBoundary
                fallback={<Tooltip title="Error loading license type"><Chip label="Error" color="error" /></Tooltip>}
              >
                {(!showingBreadcrumbHeader) && (
                  !hideLicenseTypeButton && <CurrentLicenseTypeButton showUpsell={true} />
                )}
              </RsnErrorBoundary>
              {!hideProgressIndicator && (!showingBreadcrumbHeader) && (
                <DailyProgress
                  dailyXp={userXPData?.dailyXp ?? 0}
                  variant="circular"
                  showPracticeSuggestions={true}
                  disableDailyGoalCompleteModal={true}
                  boxProps={{
                    sx: {
                      zoom: isSmallDevice ? 0.7 : 1,
                      opacity: userXPLoading ? 0.7 : 1,
                    }
                  }}
                />
              )}
              {(!showingBreadcrumbHeader) && (
                <LoginOrAccountButton />
              )}
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
