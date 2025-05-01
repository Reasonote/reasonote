import {format} from "date-fns";
import {useCheckoutModal} from "hooks/useCheckoutModal";
import {useRouter} from "next/navigation";

import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ReasonoteLicensePlans,
  ReasonoteLicenseType,
} from "@reasonote/core";

type LimitCategory = 'lessons_generated' | 'podcasts_generated' | 'practice_activities';

const LIMIT_DISPLAY_INFO: Record<LimitCategory, {
  label: string;
  description?: string;
}> = {
  lessons_generated: {
    label: "Lessons Generated",
    description: "Number of AI-powered lessons you can generate"
  },
  podcasts_generated: {
    label: "Podcasts Generated",
    description: "Number of AI podcasts you can generate"
  },
  practice_activities: {
    label: "Practice Sessions",
    description: "Number of practice mode study sessions"
  }
};

function LimitBar({ 
  created, 
  allowed, 
  label, 
  isUnlimited,
  description 
}: { 
  created: number; 
  allowed: number; 
  label: string;
  isUnlimited?: boolean;
  description?: string;
}) {
  const theme = useTheme();
  const percentage = isUnlimited ? 0 : (created / allowed) * 100;
  
  return (
    <Stack spacing={1} width="100%">
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" fontWeight={500}>{label}</Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              backgroundColor: theme.palette.action.hover,
              padding: '4px 8px',
              borderRadius: 1,
              fontWeight: 500
            }}
          >
            {created} / {isUnlimited ? '∞' : allowed}
          </Typography>
        </Stack>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>
      {!isUnlimited && (
        <LinearProgress 
          variant="determinate" 
          value={Math.min(percentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.palette.action.hover,
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: percentage > 90 
                ? theme.palette.error.main 
                : percentage > 70 
                  ? theme.palette.warning.main 
                  : theme.palette.success.main,
            },
          }}
        />
      )}
    </Stack>
  );
}

function getUpgradeInfo(currentType: ReasonoteLicenseType) {
  const plan = ReasonoteLicensePlans[currentType];

  if (!plan || !plan.upsell) {
    return {
      title: "",
      subtitle: ""
    };
  }
  return {
    title: plan.upsell.upsellText,
    subtitle: plan.upsell.upsellDescription
  };
}

export function UserLimitsDisplay() {
  const router = useRouter();
  const theme = useTheme();

  const {data: license, loading: loading, error: error} = useReasonoteLicense();
  const { openCheckout, CheckoutModalComponent } = useCheckoutModal();

  if (loading) {
    return <LinearProgress />;
  }

  if (!license) {
    return null;
  }

  const isNearLimit = Object.entries(license.features)
    .some(([_, value]) => {
      if (value.usage?.isUnlimitedPerPeriod) return false;

      if (!value.usage?.numberInPeriod || !value.usage?.numberInPeriodAllowed) return false;

      return (value.usage?.numberInPeriod / value.usage?.numberInPeriodAllowed) > 0.8;
    });

  const formatDate = (dateStr: string) => format(new Date(dateStr), 'MMM d');

  const upgradeInfo = getUpgradeInfo(license.currentPlan.type);

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Usage Period
        </Typography>
        <Typography variant="body2">
          {formatDate(license.features.find(f => f.featureId === 'lessons_generated')?.usage?.periodStart ?? new Date().toISOString())} - {formatDate(license.features.find(f => f.featureId === 'lessons_generated')?.usage?.periodEnd ?? new Date().toISOString())}
        </Typography>
      </Stack>
      
      {isNearLimit && license.currentPlan.upsell && (
        <Alert 
          severity="warning"
          sx={{
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => router.push(license.currentPlan.upsell?.upsellPath ?? '/app/upgrade')}
            >
              Upgrade Now
            </Button>
          }
        >
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {upgradeInfo.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {upgradeInfo.subtitle}
            </Typography>
          </Stack>
        </Alert>
      )}
      
      <Stack spacing={3}>
        {(Object.entries(LIMIT_DISPLAY_INFO) as [LimitCategory, typeof LIMIT_DISPLAY_INFO[LimitCategory]][]).filter(([_, value]) => license.features.find(f => f.featureId === _)?.usage).map(([key, info]) => (
          <LimitBar 
            key={key}
            created={license.features.find(f => f.featureId === key)?.usage?.numberInPeriod ?? 0}
            allowed={license.features.find(f => f.featureId === key)?.usage?.numberInPeriodAllowed ?? 0}
            label={info.label}
            description={info.description}
            isUnlimited={!!license.features.find(f => f.featureId === key)?.usage?.isUnlimitedPerPeriod}
          />
        ))}
      </Stack>

      {license.currentPlan.upsell && (
        <Box textAlign="center" mt={2}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => openCheckout({
              lookupKey: license.currentPlan.upsell?.upsellLookupKey ?? '',
              couponCode: process.env.NEXT_PUBLIC_STRIPE_20_OFF_COUPON_CODE
            })}
          >
            {license.currentPlan.upsell.upsellText}
          </Button>
        </Box>
      )}
      <CheckoutModalComponent />
    </Stack>
  );
} 