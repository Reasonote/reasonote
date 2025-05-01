"use client";
import {
  useCallback,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {useRouter} from "next/navigation";
import posthog from "posthog-js";

import {useDevParamHelper} from "@/clientOnly/hooks/useDevParamHelper";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {theme} from "@/styles/theme";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import {
  Badge,
  Chip,
  ChipProps,
  Divider,
  ListSubheader,
  Menu,
  MenuItem,
  Skeleton,
  Typography,
} from "@mui/material";
import {ReasonoteLicenseTypes} from "@reasonote/core";

export function CurrentLicenseTypeButton({
  chipProps,
  showUpsell = false,
}: {
  chipProps?: ChipProps;
  showUpsell?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { update: updateDevPlan } = useDevParamHelper('dev_plan');

  const { data: licenseData, loading: licenseLoading } = useReasonoteLicense();
  const licenseType = licenseData?.currentPlan.type;
  const router = useRouter();
  const isSmallDevice = useIsSmallDevice();

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (licenseType === 'Reasonote-Admin' || licenseType === 'Reasonote-QA') {
      setAnchorEl(event.currentTarget);
    } else if (showUpsell && (licenseType === 'Reasonote-Free' || licenseType === 'Reasonote-Anonymous')) {
      posthog.capture('upsell_badge_clicked', {
        license_type: licenseType,
        show_upsell: showUpsell,
      }, { send_instantly: true });
      // Handle promotional routing
      if (licenseType === 'Reasonote-Anonymous') {
        const checkoutUrl = `/app/stripe/elements-checkout?couponCode=${process.env.NEXT_PUBLIC_STRIPE_20_OFF_COUPON_CODE}&lookupKey=${process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY}`;
        router.push(`/app/login?startTab=signup&startTrial=true&redirectTo=${encodeURIComponent(checkoutUrl)}`);
      } else {
        router.push(`/app/stripe/elements-checkout?couponCode=${process.env.NEXT_PUBLIC_STRIPE_20_OFF_COUPON_CODE}&lookupKey=${process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY}`);
      }
    } else {
      router.push(licenseData?.currentPlan.upsell?.upsellPath ?? '/app/upgrade');
    }
  }, [licenseType, router, licenseData, showUpsell]);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleImpersonateClick = (type: string) => {
    if (updateDevPlan) {
      updateDevPlan(type);
      handleClose();
    }
  };

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    handleClose();
  };

  const items: Record<string, { color: string; label: string }> = {
    "Reasonote-Free": { color: "default", label: "Free" },
    "Reasonote-Basic": { color: "info", label: "Basic" },
    "Reasonote-Anonymous": { color: "primary", label: "Try" },
    "Reasonote-Pro": { color: "purple", label: "Pro" },
    "Reasonote-Admin": { color: "licenseTypeReasonoteAdmin", label: "Admin" },
    "Reasonote-QA": { color: "licenseTypeReasonoteQA", label: "QA" },
  };

  const license = licenseType ? items[licenseType] : null;

  const { color, label } = license ?? { color: 'default', label: 'Free' };

  // Show promotional chip for Free and Anonymous users if showUpsell is true
  const shouldShowPromo = showUpsell && (licenseType === 'Reasonote-Free' || licenseType === 'Reasonote-Anonymous');
  const displayColor = shouldShowPromo ? 'purple' : color;
  const displayLabel = shouldShowPromo ? (<Badge color="secondary" sx={{ overflow: 'visible' }}
    slotProps={{
      badge: (isSmallDevice ? 
        undefined :
        {
          style: {
            overflow: 'visible',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: theme.palette.purple.dark,
            padding: '2px 4px',
            borderRadius: '4px',
            marginLeft: '4px',
            transform: 'translate(-120%, -80%)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }
      }),
    }}
    badgeContent={
      (isSmallDevice ? 
        null :  
        <Typography style={{ overflow: 'visible', zoom: '.8', display: 'flex', alignItems: 'center', gap: '2px' }} variant="caption">
          <LocalOfferIcon sx={{ fontSize: '12px' }} />
          <b>20% off</b>
        </Typography>
      )
    }>
      <b>Start Free Trial</b>
    </Badge>
  ) : label;

  const menuSections = {
    ...(licenseType === 'Reasonote-Admin' ? {
      general: {
        label: 'General',
        items: [
          { label: 'Dashboard', path: '/app/admin' },
        ]
      },
      users: {
        label: 'User Management',
        items: [
          { label: 'View All Users', path: '/app/admin/users' },
          // { label: 'User Analytics', path: '/app/admin/users/analytics' },
          // { label: 'Permissions', path: '/app/admin/users/permissions' },
        ]
      },
      testing: {
        label: 'Testing',
        items: [
          { label: 'Testing', path: '/app/admin/testing' },
          { label: 'Markdown', path: '/app/admin/testing/markdown' },
        ]
      },
    } : {}),
    impersonate: {
      label: 'Impersonate License',
      items: ReasonoteLicenseTypes.map(type => ({
        label: `Switch to ${type}`,
        action: () => handleImpersonateClick(type)
      }))
    }
  };

  return (
    <AnimatePresence mode="wait">
      {licenseLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 50 }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Skeleton variant="rounded" width={50} height={20} />
        </motion.div>
      ) : (
        <motion.div
          key="license-chip"
          initial={{ opacity: 0, scale: 0.9, width: 0 }}
          animate={{ opacity: 1, scale: 1, width: 'fit-content' }}
          exit={{ opacity: 0, scale: 0.9, width: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Chip
            onClick={handleClick}
            label={displayLabel}
            color={displayColor as any}
            size={"small"}
            {...chipProps}
            sx={{
              '& .MuiChip-label': {
                overflow: 'visible',
              },
            }}
          />
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {Object.entries(menuSections).map(([key, section], index) => (
              <div key={key}>
                {index > 0 && <Divider />}
                <ListSubheader sx={{ bgcolor: 'background.paper' }}>
                  {section.label}
                </ListSubheader>
                {section.items.map((item) => (
                  <MenuItem
                    key={item.path || item.label}
                    onClick={() => {
                      if ('path' in item) {
                        handleMenuItemClick(item.path);
                      } else if ('action' in item) {
                        item.action();
                      }
                    }}
                  >
                    <Typography variant="inherit">{item.label}</Typography>
                  </MenuItem>
                ))}
              </div>
            ))}
          </Menu>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
