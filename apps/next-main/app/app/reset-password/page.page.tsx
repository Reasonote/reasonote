"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {BaseCallout} from "@/components/cards/BaseCallout";
import {
  Email,
  Info,
  Send,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import FullCenter from "../../../components/positioning/FullCenter";
import {useSupabase} from "../../../components/supabase/SupabaseProvider";
import {GET_REASONOTE_UPDATE_PASSWORD_URL} from "../../../utils/locationUtils";
import {isEmailProbablyValid} from "../../../utils/validationUtils";

/**
 * Used to reset a user's password. The password reset flow is:
 *
 * 1. The user enters their email and they are sent a link to log in to their
 * account. This link redirects them to the `/update-password` page.
 * 2. The user enters their new password on this page and we update it.
 */
const ResetPasswordPage = () => {
  const theme = useTheme();
  /** The Supabase client. */
  const { supabase } = useSupabase();

  /** The value of the email input. */
  const [email, setEmail] = useState<string>("");

  /**
   * If there was an error validating the email or sending the password reset,
   * the reason why is populated here and displayed to the user.
   */
  const [issue, setIssue] = useState<{ severity: 'warning' | 'error', message: string } | null>(null);

  /** Indicates whether the password reset email has been sent or not. */
  const [passwordResetEmailSent, setPasswordResetEmailSent] =
    useState<boolean>(false);

  const allowSendEmail = isEmailProbablyValid(email);

  /**
   * Called when the email input value is changed to update the value in the
   * component state.
   *
   * Also, if the email error message is showing we hide it again until they
   * submit the form again so that it doesn't cause any confusion as the user
   * attempts to fix the issue.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event The change event.
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setIssue(null);
  };

  /**
   * Called when the reset password form is submitted to validate the email
   * and send the login email.
   *
   * @async
   *
   * @param {React.FormEvent<HTMLFormElement>} event The form submit event.
   */
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isEmailValid = isEmailProbablyValid(email);
    if (!isEmailValid) {
      setIssue({
        severity: 'warning',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    const redirectTo = GET_REASONOTE_UPDATE_PASSWORD_URL();

    console.log(`Asking supabase to send reset password email to: "${email}", with redirectTo: "${redirectTo}"`);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setIssue({
        severity: 'error',
        message: error.message,
      });
    }
    else setPasswordResetEmailSent(true);
  };

  // After the input has been stable for 1 second, we check if it's a valid.
  // If not, we show an error message.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isEmailProbablyValid(email) && email.trim().length > 0) {
        setIssue({
          severity: 'warning',
          message: 'Please enter a valid email address.',
        });
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [email]);

  return (
    <FullCenter>
      <Card sx={{ width: theme.breakpoints.values.sm }}>
        <CardContent>
          <Stack gap={1}>
            <Typography fontSize={18} mb={2}>
              Account Recovery
            </Typography>
            <Divider />
            {passwordResetEmailSent && (
              <Box component="div" mt={2} mb={4}>
                An email has been sent to your inbox. Follow the instructions
                there to reset your password.
              </Box>
            )}
            <Stack
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={handleFormSubmit}
              alignItems={'center'}
              gap={2}
            >
              <BaseCallout icon={<Info />} header={<Typography>Reset Password</Typography>} backgroundColor={theme.palette.info.dark}
                sx={{ paper: { padding: '8px' } }}
              >
                <Typography>
                  Enter <b>the email address used for your account</b> to receive a link to reset your password.
                </Typography>
              </BaseCallout>
              <Stack columnGap={0.5} mb={1.5} width={'100%'} gap={2}>
                <TextField
                  // id="reset-password-email"
                  inputProps={{
                    "data-testid": "reset-password-email",
                  }}
                  type="email"
                  label="Email Address"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color={"gray" as any} />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  value={email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  aria-describedby="reset-password-email-error"
                  required
                />
                <Divider />
                {issue && (
                  <Alert
                    variant="outlined"
                    severity={issue.severity}
                  >
                    <Stack>
                      {issue.message}
                    </Stack>
                  </Alert>
                )}
              </Stack>
              <Button
                disabled={!allowSendEmail}
                type="submit"
                startIcon={<Send />}
              >Send Email</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </FullCenter>
  );
};
export default ResetPasswordPage;
