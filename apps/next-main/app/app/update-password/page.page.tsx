"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {BaseCallout} from "@/components/cards/BaseCallout";
import {Txt} from "@/components/typography/Txt";
import {
  DoorFront,
  Email,
  Error,
  Lock,
  Public,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {teal} from "@mui/material/colors";

import FullCenter from "../../../components/positioning/FullCenter";
import {useSupabase} from "../../../components/supabase/SupabaseProvider";

const passwordRequirements = [
  { regex: /.{8,}/, description: "At least 8 characters long" },
  // { regex: /[A-Z]/, description: "Contains an uppercase letter" },
  // { regex: /[a-z]/, description: "Contains a lowercase letter" },
  // { regex: /[0-9]/, description: "Contains a number" },
  // { regex: /[^A-Za-z0-9]/, description: "Contains a special character" },
];

const UpdatePasswordPage = () => {
  const theme = useTheme();
  const { supabase} = useSupabase();
  const router = useRouter();

  const rsnUser = useRsnUser();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingFirstPassword, setIsSettingFirstPassword] = useState(true);

  const [dontKnowEmail, setDontKnowEmail] = useState(false);

  useEffect(() => {
    if (rsnUser.rsnUser.loading) {
      return;
    }

    // Redirect to signup if we don't know the user's email
    if (!rsnUser.rsnUser.data?.authEmail) {
      setDontKnowEmail(true);
    }

    const checkPasswordStatus = async () => {
      const { data: hasPassword, error } = await supabase
        .rpc('current_user_has_password');
      
      if (!error) {
        setIsSettingFirstPassword(!hasPassword);
      }
    };

    checkPasswordStatus();
  }, [supabase, rsnUser, router]);

  useEffect(() => {
    const strength = passwordRequirements.filter(req => req.regex.test(password)).length;
    setPasswordStrength((strength / passwordRequirements.length) * 100);
  }, [password]);

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;
      setPasswordUpdated(true);
    } catch (error) {
      //@ts-ignore
      setPasswordUpdateError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.regex.test(password)) 
      && password === confirmPassword 
      && password.length > 0;
  };

  const getPageTitle = () => {
    return isSettingFirstPassword ? "Set a Password" : "Update Password";
  };

  const getButtonText = () => {
    if (isSubmitting) return "Updating...";
    return isSettingFirstPassword ? "Set Password" : "Update Password";
  };

  console.log({userStatus: rsnUser.userStatus, dontKnowEmail})

  return (
    <FullCenter>
      <Card sx={{ minWidth: "350px", width: "80%", maxWidth: "500px" }}>
        {(rsnUser.userStatus === 'logged_out' || dontKnowEmail) ? (
          <CardContent>
            <Stack gap={2}>
              <BaseCallout
                icon={<Error />}
                header={<Txt variant="h6">Something Went Wrong</Txt>}
                elevation={25}
                backgroundColor={theme.palette.error.dark}
              >
                You must be logged in, or have a valid "Reset Password" session to update your password.
              </BaseCallout>

              <Txt variant="h6">If you came here from...</Txt>
              <BaseCallout
                icon={<Email />}
                header={<Txt variant="h6"><b>...a "Reset Password" email</b></Txt>}
                elevation={25}
                backgroundColor={theme.palette.gray.main}
              >
                Please <b>click the link in the email again</b>, and you will be redirected here with a valid session.
              </BaseCallout>

              <BaseCallout
                icon={<Public />}
                header={<Txt variant="h6"><b>...anywhere else</b></Txt>}
                elevation={25}
                backgroundColor={theme.palette.gray.main}
              >
                <Stack gap={1} alignItems="center">
                  <Txt>Please login first.</Txt>
                  <div>
                    <Button
                      startIcon={<DoorFront />}
                      onClick={() => router.push("/app/login")}
                      variant="contained"
                      color="primary"
                    >
                      Login
                    </Button>
                  </div>
                </Stack>
              </BaseCallout>

              <Divider />

              <Txt variant="caption">
                If you have already tried the above steps, please{" "}
                <Link href="mailto:support@reasonote.com?subject=Update%20Password%20Problems&body=I'm%20having%20trouble%20updating%20my%20password.%20My%20email%20is:%20TODO@YOUREMAILADDRESS">
                  contact support@reasonote.com
                </Link>
                .
              </Txt>
            </Stack>
          </CardContent>
        ) : (
          <CardContent>
            <Stack gap={2}>
              <Txt startIcon={<Lock />} variant="h5">
                {getPageTitle()}
              </Txt>
              <Typography variant="body1" color="text.secondary">
                <i>{isSettingFirstPassword ? "Setting" : "Updating"} password for:</i> <b>{rsnUser.rsnUser.data?.authEmail}</b>
              </Typography>
              <Divider />
              {passwordUpdated ? (
                <div>
                  <Box component="div" py={2}>
                    <Typography variant="body1" color="success.main">
                      Password {isSettingFirstPassword ? "set" : "updated"} successfully!
                    </Typography>
                  </Box>
                  <Link
                    href={`/`}
                    style={{
                      textDecoration: "none",
                      color: teal[600],
                    }}
                  >
                    Go Home
                  </Link>
                </div>
              ) : (
                <Box
                  component="form"
                  noValidate
                  autoComplete="off"
                  onSubmit={handleFormSubmit}
                >
                  <Stack gap={2} mb={3}>
                    <TextField
                      id="create-new-password"
                      type={showPassword ? "text" : "password"}
                      label="Create a new password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      id="confirm-new-password"
                      type={showPassword ? "text" : "password"}
                      label="Confirm new password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      required
                      fullWidth
                    />
                    {/* <Box>
                      <Typography variant="body2" gutterBottom>
                        Password strength:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: theme.palette.grey[300],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: getPasswordStrengthColor(),
                          },
                        }}
                      />
                    </Box> */}
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Password requirements:
                      </Typography>
                      <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                        {passwordRequirements.map((req, index) => (
                          <li key={index} style={{ color: req.regex.test(password) ? theme.palette.success.main : theme.palette.text.secondary }}>
                            <Typography variant="body2">
                              {req.description}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                    {passwordUpdateError && (
                      <Typography variant="body2" color="error.main">
                        {passwordUpdateError}
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push("/app")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isSubmitting || !isPasswordValid()}
                    >
                      {getButtonText()}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        )}
      </Card>
    </FullCenter>
  );
};

export default UpdatePasswordPage;