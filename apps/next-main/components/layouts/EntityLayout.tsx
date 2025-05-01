import {
  ReactNode,
  useEffect,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {usePersistedState} from "@/clientOnly/hooks/usePersistedState";
import LoginWall from "@/components/auth/LoginWall";
import EntityBottomNavigation
  from "@/components/navigation/EntityBottomNavigation";
import {
  MenuItemType,
  SIDEBAR_WIDTH,
} from "@/components/navigation/EntitySidebar";
import {NotFoundPage} from "@/components/navigation/NotFound";
import {Box} from "@mui/material";

interface EntityLayoutProps {
    children: ReactNode;
    entityId: string;
    entityType: 'skill' | 'course';
    menuItems: MenuItemType[];
    moreMenuItems?: MenuItemType[];
    noSidebarRoutes?: RegExp[];
    noBottomBarRoutes?: RegExp[];
    noHeaderRoutes?: RegExp[];
    notFound?: boolean;
    entityData?: any;
    rootSkillId?: string;
}

export function EntityLayout({
    children,
    entityId,
    entityType,
    menuItems,
    moreMenuItems = [],
    noSidebarRoutes = [],
    noBottomBarRoutes = [],
    noHeaderRoutes = [],
    notFound,
    entityData,
    rootSkillId,
}: EntityLayoutProps): JSX.Element {
    const pathname = usePathname();
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();
    const [sidebarCollapsed, setSidebarCollapsed] = usePersistedState(`${entityType}Sidebar_collapsed`, false);

    useEffect(() => {
        if (isSmallDevice) {
            setSidebarCollapsed(true);
        }
    }, [isSmallDevice]);

    const shouldShowSidebar = !noSidebarRoutes.some(pattern => pattern.test(pathname ?? ''));
    const currentPath = pathname?.replace(`/app/${entityType}s/${entityId}${entityType === 'course' ? '/view' : ''}/`, '') || '';

    const shouldShowBottomBarOnMobile = !noBottomBarRoutes.some(pattern => pattern.test(pathname ?? ''));
    const shouldShowHeaderOnMobile = !noHeaderRoutes.some(pattern => pattern.test(pathname ?? ''));

    if (notFound) {
        return <NotFoundPage />;
    }

    return (
        <LoginWall extraUrlParams={{
            redirectTo: `/app/${entityType}s/${entityId}${entityType === 'course' ? '/view' : ''}`,
        }}>
                <Box sx={{
                    display: 'flex',
                    width: '100%',
                    height: '100dvh',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {/* {shouldShowSidebar && entityId && (
                        <EntitySidebar
                            skillId={isSmallDevice ? undefined : (entityType === 'skill' ? entityId : rootSkillId)}
                            courseId={isSmallDevice ? undefined : (entityType === 'course' ? entityId : undefined)}
                            currentPath={currentPath}
                            menuItems={menuItems}
                            moreMenuItems={moreMenuItems}
                            initialCollapsed
                            onEntitySelect={(id) => {
                                router.push(`/app/${entityType}s/${id}${entityType === 'course' ? '/view' : ''}`);
                            }}
                            onMenuClick={() => {
                                setSidebarCollapsed(prev => !prev);
                            }}
                            isOpen={isSmallDevice ? !sidebarCollapsed : undefined}
                        />
                    )} */}

                    <Box 
                        onClick={() => isSmallDevice && !sidebarCollapsed && setSidebarCollapsed(true)}
                        sx={{
                            position: isSmallDevice ? 'absolute' : 'relative',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            transform: isSmallDevice && !sidebarCollapsed ? `translateX(${SIDEBAR_WIDTH}px)` : 'none',
                            transition: 'transform 0.3s ease, filter 0.3s ease',
                            width: '100%',
                            height: '100%'
                        }}
                    >
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
                                    setSidebarCollapsed(true);
                                }}
                            />
                        )}

                        {/* {(!isSmallDevice || shouldShowHeaderOnMobile) && (
                            <AppHeader
                                ignoreDisabled
                                isSidebarOpen={!sidebarCollapsed}
                                onSidebarClick={() => setSidebarCollapsed(prev => !prev)}
                                skillId={entityType === 'skill' ? entityId : rootSkillId}
                            />
                        )} */}
                        <Box sx={{
                            flex: 1,
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            p: isSmallDevice ? 0 : 1,
                            pb: isSmallDevice && shouldShowBottomBarOnMobile ? '56px' : undefined
                        }}>
                            {children}
                        </Box>

                        {isSmallDevice && shouldShowBottomBarOnMobile && (
                            <Box sx={{
                                position: 'fixed',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                transition: 'transform 0.3s ease',
                                zIndex: 1
                            }}>
                                <EntityBottomNavigation
                                    entityId={entityId}
                                    entityType={entityType}
                                    menuItems={menuItems}
                                    moreMenuItems={moreMenuItems}
                                    currentPath={currentPath}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
        </LoginWall>
    );
} 