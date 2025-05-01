import {
  useEffect,
  useState,
} from "react";

import {
  LucideIcon,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {sidebarCollapsedVar} from "@/clientOnly/state/userVars";
import {useReactiveVar} from "@apollo/client";
import {
  History,
  SvgIconComponent,
} from "@mui/icons-material";
import {
  Button,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import {styled} from "@mui/material/styles";

import {CombinedHistory} from "../drawers/leftDrawer/CombinedHistory";
import {
  SidebarListSectionHeader,
} from "../drawers/leftDrawer/SidebarListSectionHeader";
import {ReasonoteBetaIcon} from "../icons/FavIcon";
import {useSupabase} from "../supabase/SupabaseProvider";

export type IconType = LucideIcon | SvgIconComponent;

export interface MenuItemType {
    name: string;
    path?: string;
    /**
     * If provided, this will override the default behavior of clicking the item to navigate to the path.
     */
    onClick?: () => void;
    icon: IconType;
    pathRegexes?: RegExp[];
}

const StyledLink = styled(Link)(({ theme }) => ({}));

export const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 60;

const HEADER_HEIGHT = {
    MOBILE: 48,
    DESKTOP: 56
};

export interface EntitySidebarProps {
    skillId?: string;
    courseId?: string;
    currentPath?: string;
    initialCollapsed?: boolean;
    menuItems?: MenuItemType[];
    moreMenuItems?: MenuItemType[];
    onEntitySelect?: (entityId: string) => void;
    isOpen?: boolean;
    onMenuClick?: () => void;
    collapsedWidth?: number;
}

const ScrollableContainer = styled('div')<{ collapsed: boolean }>(({ collapsed }) => ({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    height: '100%',
    '& > *:last-child': {
        paddingBottom: 16
    },
    scrollbarWidth: collapsed ? 'none' : 'auto',
    msOverflowStyle: collapsed ? 'none' : 'auto',
    '&::-webkit-scrollbar': {
        display: collapsed ? 'none' : 'auto'
    }
}));

export function EntitySidebar({
    skillId,
    courseId,
    currentPath,
    initialCollapsed = true,
    menuItems,
    moreMenuItems,
    onEntitySelect,
    isOpen,
    onMenuClick,
    collapsedWidth = SIDEBAR_COLLAPSED_WIDTH
}: EntitySidebarProps) {
    const theme = useTheme();
    const { sb } = useSupabase()
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();

    // Use Apollo reactive variable for collapsed state
    const isCollapsed = useReactiveVar(sidebarCollapsedVar);
    
    // Determine if we're in history-only mode
    // const isHistoryMode = !skillId && !courseId;
    // const isHidden = isHistoryMode && !isOpen;
    
    // Updated to hide on mobile when collapsed
    const isHidden = isSmallDevice && isCollapsed;
    
    // Set initial collapsed state if needed
    useEffect(() => {
        if (initialCollapsed !== isCollapsed) {
            sidebarCollapsedVar(initialCollapsed);
        }
    }, [initialCollapsed]);

    const getEntityUrl = (path: string) => courseId ? `/app/courses/${courseId}/view${path ? `/${path}` : ''}` : `/app/skills/${skillId}${path ? `/${path}` : ''}`;
    const [entityName, setEntityName] = useState('');

    // Mouse event handlers for auto-collapse - only use on desktop
    const handleMouseEnter = () => {
        if (!isSmallDevice) {
            sidebarCollapsedVar(false);
        }
    };
    
    const handleMouseLeave = () => {
        if (!isSmallDevice) {
            sidebarCollapsedVar(true);
        }
    };

    // Toggle method for mobile
    const toggleSidebar = () => {
        if (isSmallDevice) {
            sidebarCollapsedVar(!isCollapsed);
        }
    };

    // Handle menu button click - use onMenuClick if provided, otherwise toggle sidebar
    const handleMenuButtonClick = () => {
        if (onMenuClick) {
            onMenuClick();
        } else {
            toggleSidebar();
        }
    };

    // More menu state
    const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isMoreMenuOpen = Boolean(moreMenuAnchorEl);

    const handleMoreMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setMoreMenuAnchorEl(event.currentTarget);
    };

    const handleMoreMenuClose = () => {
        setMoreMenuAnchorEl(null);
    };

    const handleMoreMenuItemClick = (path: string) => {
        router.push(getEntityUrl(path));
        handleMoreMenuClose();
    };

    useEffect(() => {
        const fetchEntityName = async () => {
            if (courseId) {
                const { data: course } = await sb.from('course').select('_name').eq('id', courseId).single();
                setEntityName(course?._name ?? '');
            } else if (skillId) {
                const { data: skill } = await sb.from('skill').select('_name').eq('id', skillId).single();
                setEntityName(skill?._name ?? '');
            }
        };
        fetchEntityName();
    }, [skillId, courseId]);

    return (
        <div
            className={`shadow-lg transition-all duration-300 h-full relative flex flex-col`}
            style={{
                backgroundColor: theme.palette.background.default,
                maxWidth: isCollapsed ? collapsedWidth : SIDEBAR_WIDTH,
                width: isHidden ? 0 : isCollapsed ? collapsedWidth : SIDEBAR_WIDTH,
                overflow: 'hidden',
                opacity: isHidden ? 0 : 1,
                borderRight: `1px solid ${theme.palette.divider}`,
                paddingTop: 0,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Fixed Menu Button Row - match AppHeader height */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    height: isSmallDevice ? 56 : 64,
                    width: '100%',
                    flexShrink: 0,
                    px: isSmallDevice ? 0 : 1
                }}
            >
                <Link href="/app" style={{ textDecoration: "none" }}>
                  <Button
                    size="small"
                    color="inherit"
                    sx={{ minWidth: "30px" }}
                  >
                    <Stack direction={"row"} gap={1}>
                      <ReasonoteBetaIcon size={25}/>
                    </Stack>
                  </Button>
                </Link>

                {!isCollapsed ? (
                    <Stack direction="row" spacing={1} alignItems="center">
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
                        
                        {/* {isSmallDevice && (
                            <Tooltip title="Close Sidebar">
                                <IconButton
                                    onClick={() => sidebarCollapsedVar(true)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <X size={24} />
                                </IconButton>
                            </Tooltip>
                        )} */}
                    </Stack>
                ) : null}
            </Stack>

            {/* Scrollable Content */}
            <div style={{
                overflow: 'auto',
                flex: 1,
                marginTop: isSmallDevice ? 0 : undefined  // Remove extra spacing on mobile
            }}>
                {!isCollapsed && (
                    <>
                        <Divider sx={{ mt: 2, mb: 2 }} />
                        <SidebarListSectionHeader
                            icon={<History color="gray" />}
                            title="History"
                        />
                        <CombinedHistory currentId={courseId ?? skillId ?? null}/>
                    </>
                )}
            </div>
        </div>
    );
} 