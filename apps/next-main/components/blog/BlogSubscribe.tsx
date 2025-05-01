"use client";
import React, {useState} from "react";

import {
  EmailSubscriptionsRoute,
} from "@/app/api/email-subscriptions/routeSchema";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {Txt} from "@/components/typography/Txt";
import {
  CheckCircle,
  Email,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormGroup,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

// Define subscription option types
export type SubscriptionOption = {
  key: 'newsletter' | 'product_updates' | 'edtech_updates';
  label: string;
  description?: string;
  defaultChecked?: boolean;
};

// Define component variants
export type SubscribeVariant = 'simple' | 'compact' | 'configurable';

export interface BlogSubscribeProps {
  /**
   * The variant of the subscription component
   * - simple: Minimal UI with email field, no subscription descriptions
   * - compact: Email field with small checkboxes in a row beneath
   * - configurable: Shows clickable list of subscription options
   */
  variant?: SubscribeVariant;

  /**
   * Subscription options to display 
   * - For configurable: shown as clickable list items
   * - For compact: shown as small checkboxes
   * - For simple: determines what's being subscribed to (not shown)
   */
  options?: SubscriptionOption[];

  /**
   * Title for the subscription form
   */
  title?: string;

  /**
   * Description text for the subscription form
   */
  description?: string;

  /**
   * Text for the submit button
   */
  buttonText?: string;

  /**
   * Whether to hide the list in standard variant
   */
  hideList?: boolean;
}

// Default subscription options
const DEFAULT_OPTIONS: SubscriptionOption[] = [
  {
    key: 'newsletter',
    label: 'Newsletter',
    description: 'Get the latest articles and updates',
    defaultChecked: true
  },
  {
    key: 'product_updates',
    label: 'Product Updates',
    description: 'Stay informed about new features and improvements',
    defaultChecked: false
  },
  {
    key: 'edtech_updates',
    label: 'EdTech Updates',
    description: 'Educational technology news and trends',
    defaultChecked: false
  }
];

export function BlogSubscribe({
  variant = 'compact',
  options = DEFAULT_OPTIONS,
  title = 'Subscribe to Updates',
  description = 'Stay updated with our latest content and features',
  buttonText = 'Subscribe',
  hideList = false
}: BlogSubscribeProps) {
    const { hasLoggedIn } = useRsnUser();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isSmallDevice = useIsSmallDevice();

    // For configurable and compact variants, track which options are selected
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>(
      options.reduce((acc, option) => ({
        ...acc,
        [option.key]: option.defaultChecked ?? false
      }), {})
    );

    const handleOptionToggle = (key: string) => {
      setSelectedOptions({
        ...selectedOptions,
        [key]: !selectedOptions[key]
      });
    };

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedOptions({
        ...selectedOptions,
        [event.target.name]: event.target.checked
      });
    };

    // Get active options based on variant
    const getActiveOptions = () => {
      if (variant === 'configurable' || variant === 'compact') {
        return options.filter(option => selectedOptions[option.key]);
      } else {
        return options.filter(option => option.defaultChecked);
      }
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let subscriptionData: Record<string, any> = {};

            if (variant === 'configurable' || variant === 'compact') {
              // For configurable/compact variants, use selected options
              Object.entries(selectedOptions).forEach(([key, value]) => {
                if (value) {
                  subscriptionData[key] = true;
                }
              });

              // Ensure at least one option is selected
              if (Object.values(selectedOptions).every(v => !v)) {
                throw new Error("Please select at least one subscription option");
              }
            } else {
              // For simple variant, use the defaultChecked options
              options.forEach(option => {
                if (option.defaultChecked) {
                  subscriptionData[option.key] = true;
                }
              });

              // Ensure at least one option is set
              if (Object.keys(subscriptionData).length === 0) {
                subscriptionData.newsletter = true; // Default to newsletter if nothing selected
              }
            }

            // Add email for non-logged in users
            if (!hasLoggedIn) {
              subscriptionData.email = email;
            }

            const response = await EmailSubscriptionsRoute.call(subscriptionData);

            if (response.error) {
                throw new Error(response.error);
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred during subscription');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Stack spacing={2} alignItems="center" maxWidth={400} width="100%">
                <Alert severity="success" sx={{ width: '100%' }}>
                    <Txt>
                        {hasLoggedIn
                            ? "You've successfully subscribed!"
                            : "Thanks for subscribing! Please check your email to confirm your subscription."
                        }
                    </Txt>
                </Alert>
                {!hasLoggedIn && variant !== 'simple' && (
                    <Txt variant="body2" color="text.secondary" align="center">
                        Can't find the email? Check your spam folder or try subscribing again.
                    </Txt>
                )}
            </Stack>
        );
    }

    // For logged-in users, show just a button (all variants)
    if (hasLoggedIn) {
        return (
            <Button
                variant="contained"
                size="large"
                onClick={handleSubscribe}
                disabled={loading}
                sx={{ px: 4, py: 2 }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    buttonText
                )}
            </Button>
        );
    }

    // For all non-logged-in users (all variants)
    return (
        <Stack
            component="form"
            onSubmit={handleSubscribe}
            spacing={variant === 'configurable' ? 2 : 3}
            alignItems="center"
            width={isSmallDevice ? '100%' : '25rem'}
        >
            {/* Title and description - shown in all variants except simple */}
            {variant !== 'simple' && (
              <>
                {title && <Typography variant="h5" align="center">{title}</Typography>}
                {description && (
                  <Typography variant="body2" color="text.secondary" align="center">
                    {description}
                  </Typography>
                )}
              </>
            )}

            {/* Email field - shown in all variants for non-logged in users */}
            <TextField
                fullWidth
                type="email"
                label="Email Address"
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                InputProps={{
                    startAdornment: <Email color="action" sx={{ mr: 1 }} />,
                }}
            />

            {/* Compact variant checkboxes - shown in a row */}
            {variant === 'compact' && (
              <FormGroup 
                row 
                sx={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  mt: 1,
                  mb: 1
                }}
              >
                {options.map((option) => (
                  <FormControlLabel
                    key={option.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedOptions[option.key]}
                        onChange={handleCheckboxChange}
                        name={option.key}
                      />
                    }
                    label={
                      <Typography variant="caption" color="text.secondary">
                        {option.label}
                      </Typography>
                    }
                    sx={{ mr: 2 }}
                  />
                ))}
              </FormGroup>
            )}

            {/* Clickable selectable list - shown in configurable variant only */}
            {variant === 'configurable' && (
              <Box sx={{ width: '100%', my: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Select your subscriptions:
                </Typography>
                <List 
                  dense
                  disablePadding
                  sx={{ 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {options.map((option, index) => (
                    <React.Fragment key={option.key}>
                      {index > 0 && <Divider component="li" />}
                      <ListItemButton 
                        onClick={() => handleOptionToggle(option.key)}
                        disableRipple
                        dense
                        sx={{ 
                          py: 0.75,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'transparent',
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {selectedOptions[option.key] ? (
                            <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                          ) : (
                            <RadioButtonUnchecked fontSize="small" sx={{ color: 'text.disabled' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: selectedOptions[option.key] ? 500 : 400,
                                color: selectedOptions[option.key] ? 'text.primary' : 'text.secondary',
                                fontSize: '0.875rem'
                              }}
                            >
                              {option.label}
                            </Typography>
                          }
                          secondary={
                            option.description && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: selectedOptions[option.key] ? 'text.secondary' : 'text.disabled',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {option.description}
                              </Typography>
                            )
                          }
                        />
                      </ListItemButton>
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ width: '100%', py: 1.5 }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    buttonText
                )}
            </Button>
        </Stack>
    );
}