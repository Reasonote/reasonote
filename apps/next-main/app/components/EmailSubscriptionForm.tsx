'use client';

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {Txt} from "@/components/typography/Txt";
import {Email} from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import {styled} from "@mui/system";

import {EmailSubscriptionsRoute} from "../api/email-subscriptions/routeSchema";

type Subscriptions = {
  product_updates: boolean;
  edtech_updates: boolean;
  newsletter: boolean;
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-center',
}));

const InfoPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPopover-paper': {
    padding: theme.spacing(2),
    maxWidth: 300,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.grey[300]}`,
  },
}));

const subscriptionInfo = {
  product_updates: {
    description: "Receive updates about new features and improvements to Reasonote.",
    frequency: "~1 Email Per Week"
  },
  edtech_updates: {
    description: "Stay informed about the latest trends and news in educational technology.",
    frequency: "~1 Email Per Month"
  },
  newsletter: {
    description: "Get our regular newsletter with tips, best practices, and community highlights.",
    frequency: "~1 Email Per Week"
  },
  account_updates: {
    description: "Important updates about your account, billing, and security (cannot be disabled).",
    frequency: "As needed"
  },
};

export default function EmailSubscriptionForm() {
  const [subscriptions, setSubscriptions] = useState<Subscriptions>({
    product_updates: false,
    edtech_updates: false,
    newsletter: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { supabase } = useSupabase();
  const { rsnUserId } = useRsnUser();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  useEffect(() => {
    if (rsnUserId) {
      fetchSubscriptions();
    }
  }, [rsnUserId]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      if (!rsnUserId) {
        setError('No user ID');
        return;
      }

      const { data, error } = await supabase
        .from('email_subscription')
        .select('*')
        .eq('rsn_user_id', rsnUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // no subscriptions found
          setSubscriptions({
            product_updates: true,
            edtech_updates: true,
            newsletter: true,
          });
        } else {
          setError('Failed to fetch subscriptions');
        }
      } else if (data) {
        setSubscriptions({
          product_updates: data.product_updates,
          edtech_updates: data.edtech_updates,
          newsletter: data.newsletter,
        });
      }
    } catch (error) {
      setError('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [rsnUserId, supabase]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubscriptions({
      ...subscriptions,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const response = await EmailSubscriptionsRoute.call(subscriptions);

    if (!response.success) {
      setError('Failed to update subscriptions');
    } else {
      setSuccess(true);
      await fetchSubscriptions();
    }

    setLoading(false);
  };

  const handleInfoClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setOpenPopoverId(id);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
    setOpenPopoverId(null);
  };

  if (loading && !subscriptions.product_updates && !subscriptions.edtech_updates && !subscriptions.newsletter) {
    return (
      <Box display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack>
      <Txt startIcon={<Email/>} variant="h6" gutterBottom>
        Email Preferences
      </Txt>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Subscriptions updated successfully!
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        {Object.entries(subscriptions).map(([key, value]) => (
          <Box key={key} display="flex" alignItems="center" mb={2}>
            <StyledFormControlLabel
              control={
                <Checkbox
                  checked={value}
                  onChange={handleChange}
                  name={key}
                />
              }
              label={
                <Stack>
                  <Typography>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {subscriptionInfo[key as keyof typeof subscriptionInfo].frequency}
                  </Typography>
                </Stack>
              }
            />
            <IconButton
              size="small"
              onClick={(e) => handleInfoClick(e, key)}
              aria-label={`Info about ${key}`}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
            <InfoPopover
              open={openPopoverId === key}
              anchorEl={anchorEl}
              onClose={handleInfoClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <Typography>{subscriptionInfo[key as keyof typeof subscriptionInfo].description}</Typography>
            </InfoPopover>
          </Box>
        ))}
        <Box display="flex" alignItems="center" mb={2}>
          <StyledFormControlLabel
            control={
              <Checkbox
                checked={true}
                disabled
              />
            }
            label={<Stack>
              <Typography>Account Updates</Typography>
              <Typography variant="caption" color="text.secondary">
                {subscriptionInfo.account_updates.frequency}
              </Typography>
            </Stack>
            }
          />
          <IconButton
            size="small"
            onClick={(e) => handleInfoClick(e, 'account_updates')}
            aria-label="Info about account updates"
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
          <InfoPopover
            open={openPopoverId === 'account_updates'}
            anchorEl={anchorEl}
            onClose={handleInfoClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Typography>{subscriptionInfo.account_updates.description}</Typography>
          </InfoPopover>
        </Box>
        <Box mt={2}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Subscriptions'}
          </Button>
        </Box>
      </form>
    </Stack>
  );
}