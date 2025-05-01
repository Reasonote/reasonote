import React from "react";

import {useRouter} from "next/navigation";
import posthog from "posthog-js";

import {useHasLicenseType} from "@/clientOnly/hooks/useHasLicenseType";
import {useRsnUsername} from "@/clientOnly/hooks/useRsnUsername";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {
  AccountTree,
  Campaign,
  ChevronLeft,
  ChevronRight,
  CollectionsBookmark,
  ContentCut,
  DocumentScanner,
  FilterCenterFocus,
  FitnessCenter,
  Gamepad,
  LocalLibrary,
  Logout,
  Person,
  Reviews,
  Settings,
  SmartButton,
} from "@mui/icons-material";
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";

// Define types for menu items
type MenuItemType = {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'divider' | 'header';
};

export default function AccountButton() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [currentView, setCurrentView] = React.useState<'main' | 'library'>('main');
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { username } = useRsnUsername();
  const { data: isAdmin } = useHasLicenseType("Reasonote-Admin");
  
  const handleProfile = () => {
    if (username) {
      router.push(`/app/u/${username}`);
    }
    else {
      console.warn("No username found");
    }
  };

  const handleAccount = () => {
    router.push("/app/settings");
  };

  const handleLogout = () => {
    router.push("/app/logout");
  };

  const handleFeedback = () => {
    posthog.capture("feedback_initiated", {
      source: "settings_cog_icon",
      type: "general_feedback",
      location: window.location.pathname,
    }, {
      send_instantly: true
    });
    console.log("user clicked feedback from settings cog icon");
    window.open('https://respected-cry-857.notion.site/12dbad52645980c19eefd7be8a4428a7?pvs=105', '_blank');
  };

  const mainMenuItems: MenuItemType[] = [
    {
      key: 'profile',
      label: "Your Profile",
      icon: <CurUserAvatar sx={{width: '10px', height: '10px'}} />,
      onClick: handleProfile
    },
    {
      key: 'settings',
      label: "Settings",
      icon: <Settings fontSize="medium" />,
      onClick: handleAccount
    },
    { key: 'divider-1', type: 'divider' },
    {
      key: 'library',
      label: "Your Library",
      icon: <LocalLibrary fontSize="small" />,
      onClick: () => setCurrentView('library')
    },
    { key: 'divider-2', type: 'divider' },
    {
      key: 'feedback',
      label: "Feedback",
      icon: <Campaign fontSize="small" />,
      onClick: handleFeedback
    },
    {
      key: 'logout',
      label: "Logout",
      icon: <Logout fontSize="small" />,
      onClick: handleLogout
    }
  ];

  const libraryItems: MenuItemType[] = [
    {
      key: 'activities',
      label: "Activities",
      icon: <Gamepad fontSize="small" />,
      onClick: () => router.push("/app/activities")
    },
    {
      key: 'skills',
      label: "Skills",
      icon: <FitnessCenter fontSize="small" />,
      onClick: () => router.push("/app/skills")
    },
    {
      key: 'lessons',
      label: "Lessons",
      icon: <LocalLibrary fontSize="small" />,
      onClick: () => router.push("/app/lessons")
    },
  ];

  // Only include experimental items if user is admin
  const experimentalItems: MenuItemType[] = isAdmin ? [
    { key: 'divider-library', type: 'divider' },
    {
      key: 'experimental-header',
      type: 'header',
      label: "Experimental"
    },
    {
      key: 'analyze',
      label: "Analyze",
      icon: <FilterCenterFocus fontSize="small" />,
      onClick: () => router.push("/app/analyze")
    },
    {
      key: 'documents',
      label: "Documents",
      icon: <DocumentScanner fontSize="small" />,
      onClick: () => router.push("/app/documents")
    },
    {
      key: 'skillsets',
      label: "Skill Sets",
      icon: <AccountTree fontSize="small" />,
      onClick: () => router.push("/app/skillsets")
    },
    {
      key: 'create-activity',
      label: "Create Activity",
      icon: <SmartButton fontSize="small" />,
      onClick: () => router.push("/app/codesandbox/ai")
    },
    {
      key: 'practice',
      label: "Practice",
      icon: <Reviews fontSize="small" />,
      onClick: () => router.push("/app/practice/new")
    },
    {
      key: 'characters',
      label: "Characters",
      icon: <Person fontSize="small" />,
      onClick: () => router.push("/app/characters")
    },
    {
      key: 'snips',
      label: "Snips",
      icon: <ContentCut fontSize="small" />,
      onClick: () => router.push("/app/snips")
    },
    {
      key: 'courses',
      label: "Courses",
      icon: <CollectionsBookmark fontSize="small" />,
      onClick: () => router.push("/app/courses")
    }
  ] : [];

  // Combine regular library items with experimental items (if user is admin)
  const allLibraryItems: MenuItemType[] = [...libraryItems, ...experimentalItems];

  return (
    <>
      <IconButton 
        onClick={handleClick}
        sx={{
          width: 40,
          height: 40,
          padding: 0,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <CurUserAvatar 
          sx={{ 
            width: 32, 
            height: 32 
          }} 
        />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: "auto",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            minWidth: 220,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {currentView === 'main' ? (
          mainMenuItems.map((item) => (
            item.type === 'divider' ? (
              <Divider key={item.key} />
            ) : (
              <MenuItem key={item.key} onClick={item.onClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText>{item.label}</ListItemText>
                {item.key === 'library' && <ChevronRight />}
              </MenuItem>
            )
          ))
        ) : (
          [
            <MenuItem key="back-to-main" onClick={() => setCurrentView('main')} sx={{ mb: 1 }}>
              <ListItemIcon><ChevronLeft /></ListItemIcon>
              <ListItemText primary="Your Library" sx={{ fontWeight: 'bold' }} />
            </MenuItem>,
            <Divider key="library-divider" />,
            ...allLibraryItems.map((item) => (
              item.type === 'divider' ? (
                <Divider key={item.key} />
              ) : item.type === 'header' ? (
                <Typography
                  key={item.key}
                  variant="caption"
                  sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}
                >
                  {item.label}
                </Typography>
              ) : (
                <MenuItem 
                  key={item.key} 
                  onClick={() => {
                    item.onClick?.();
                    handleClose();
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              )
            ))
          ]
        )}
      </Menu>
    </>
  );
}
