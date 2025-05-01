"use client";

import {useEffect} from "react";

import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  useShouldRedirectToOnboarding,
} from "@/clientOnly/hooks/useShouldRedirectToOnboarding";
import {sidebarCollapsedVar} from "@/clientOnly/state/userVars";
import {ChatDrawer} from "@/components/chat/ChatDrawer/ChatDrawer";
import {DialogManagerProvider} from "@/components/dialogs/DialogManager";
import {AnkiFileHandler} from "@/components/FullscreenDropzone/AnkiFileHandler";
import {
  FileHandlerRegistry,
} from "@/components/FullscreenDropzone/fileHandlerSystem";
import {AppHeader} from "@/components/navigation/appHeader/AppHeader";
import {EntitySidebar} from "@/components/navigation/EntitySidebar";
import {
  LinearProgressWithLabel,
} from "@/components/progress/LinearProgressWithLabel";
import {AppTours} from "@/components/tours/AppTours";
import {useReactiveVar} from "@apollo/client";
import {
  Box,
  Card,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

const fileHandlerRegistry = new FileHandlerRegistry();
fileHandlerRegistry.registerHandler(new AnkiFileHandler());

export default function AppLayout({ children }: any) {
  // The entire app is wrapped in a very simple error boundary.
  const theme = useTheme();
  const router = useRouter();
  const isSmallDevice = useIsSmallDevice();
  
  // Use the Apollo reactive variable for sidebar state
  const sidebarCollapsed = useReactiveVar(sidebarCollapsedVar);
  const toggleSidebar = () => sidebarCollapsedVar(!sidebarCollapsed);

  const shouldRedirectToOnboardingRes = useShouldRedirectToOnboarding();

  useEffect(() => {
    if (shouldRedirectToOnboardingRes.data) {
      router.push("/app/onboarding");
    }
  }, [shouldRedirectToOnboardingRes]);

  const showAppLoading = shouldRedirectToOnboardingRes.loading;

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {showAppLoading ? (
        <Stack height="100vh" width="100%" justifyContent="center" alignItems="center">
          <Card sx={{ height: '100px', width: '200px' }}>
            <LinearProgressWithLabel
              labelPos="above"
              label={<Typography textAlign="center">Getting things ready...</Typography>}
              wrapperProps={{ sx: { width: '100%', height: '100%' } }}
            />
          </Card>
        </Stack>
      ) : shouldRedirectToOnboardingRes.data ? (
        <Stack height="100vh" width="100%" justifyContent="center" alignItems="center">
          <Card sx={{ height: '100px', width: '200px' }}>
            <LinearProgressWithLabel
              labelPos="above"
              label={<Typography textAlign="center">Redirecting to Onboarding...</Typography>}
              wrapperProps={{ sx: { width: '100%', height: '100%' } }}
            />
          </Card>
        </Stack>
      ) : (
        <DialogManagerProvider>
          <>
            {/* Sidebar */}
            <EntitySidebar
              isOpen={!sidebarCollapsed}
              onMenuClick={toggleSidebar}
              initialCollapsed={sidebarCollapsed}
              // collapsedWidth={0}
            />

            {/* Main content area */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100vh',
              position: 'relative'
            }}>
              <AppHeader
                onSidebarClick={toggleSidebar}
                isSidebarOpen={!sidebarCollapsed}
              />
              <ChatDrawer />
              <AppTours />
              {isSmallDevice && !sidebarCollapsed && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 2,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSidebar();
                  }}
                />
              )}
              <div
                id="MAIN_PAGE_CONTENT"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'auto',
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                {/* <FullScreenDropzone
                  fileHandlerRegistry={fileHandlerRegistry} 
                  onComplete={() => {
                    
                  }} 
                /> */}
                {/* <div>{curPathName}</div>
                  <div>{shouldRedirectToBetaPage ? 'SHOULD' : 'SHOULD NOT'}</div> */}
                {children}
              </div>
            </div>
          </>
        </DialogManagerProvider>
      )}
    </div>
  );
}