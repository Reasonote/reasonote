import {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";

import {MenuItemType} from "./EntitySidebar";

type EntityBottomNavigationProps = {
    entityId: string;
    entityType: string;
    menuItems: MenuItemType[];
    moreMenuItems?: MenuItemType[];
    currentPath: string;
}

export default function EntityBottomNavigation({ entityId, entityType, menuItems, moreMenuItems, currentPath }: EntityBottomNavigationProps) {
    const [activeMenuPath, setActiveMenuPath] = useState('');
    const theme = useTheme();
    const router = useRouter();
    const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);

    useEffect(() => {
        const activeItem = menuItems.find(item => {
            if (item.pathRegexes) {
                return item.pathRegexes.some(regex => regex.test(currentPath));
            }
            return null;
        });
        setActiveMenuPath(activeItem ? activeItem.path ?? '' : '');
    }, [currentPath]);

    const handleMenuChange = (event: React.SyntheticEvent, newPath: string) => {
        if (newPath === 'more') {
            // More is special and already handled.
            return;
        }

        // Find the menu item
        const menuItem = [...menuItems, ...(moreMenuItems || [])].find(item => item.path === newPath);
        
        // If the item has an onClick handler, use it
        if (menuItem && menuItem.onClick) {
            menuItem.onClick();
            return;
        }

        setActiveMenuPath(newPath);
        
        // Check if newPath starts with a query parameter
        if (newPath.startsWith('?')) {
            // Get the current base path without query parameters
            let currentBasePath = '';
            if (entityType === 'course') {
                currentBasePath = `/app/courses/${entityId}/view`;
            } else {
                currentBasePath = `/app/skills/${entityId}`;
            }
            
            // Append the query parameter to the base path
            router.push(`${currentBasePath}${newPath}`);
        } else {
            // Handle normal paths as before
            if (entityType === 'course') {
                router.push(`/app/courses/${entityId}/view/${newPath}`);
            } else {
                router.push(`/app/skills/${entityId}/${newPath}`);
            }
        }
    };

    const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
        setMoreAnchorEl(event.currentTarget);
    };

    const handleMoreClose = () => {
        setMoreAnchorEl(null);
    };

    const handleMoreItemClick = (item: MenuItemType) => {
        // If the item has an onClick handler, use it
        if (item.onClick) {
            item.onClick();
        } else if (item.path) {
            handleMenuChange({} as React.SyntheticEvent, item.path);
        }
        handleMoreClose();
    };

    return (
        <>
            <BottomNavigation
                value={activeMenuPath}
                onChange={handleMenuChange}
                showLabels
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 56,
                    backgroundColor: theme.palette.background.paper,
                    borderTop: `1px solid ${theme.palette.divider}`,
                }}
            >
                {menuItems.map((item) => (
                    <BottomNavigationAction
                        sx={{
                            minWidth: 30,
                        }}
                        key={item.name}
                        label={item.name}
                        value={item.path}
                        icon={<item.icon sx={{ fontSize: 20 }} />}
                    />
                ))}
                {moreMenuItems && (
                    <BottomNavigationAction
                        sx={{
                            minWidth: 30,
                        }}
                        key="more"
                        label="More"
                        value="more"
                        icon={<MoreHorizIcon sx={{ fontSize: 20 }} />}
                        onClick={handleMoreClick}
                    />
                )}
            </BottomNavigation>
            {moreMenuItems && (
                <Menu
                    anchorEl={moreAnchorEl}
                    open={Boolean(moreAnchorEl)}
                    onClose={handleMoreClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                >
                    {moreMenuItems.map((item) => (
                        <MenuItem key={item.name} onClick={() => handleMoreItemClick(item)}>
                            <item.icon sx={{ mr: 1, fontSize: 20 }} />
                            {item.name}
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </>
    )
}