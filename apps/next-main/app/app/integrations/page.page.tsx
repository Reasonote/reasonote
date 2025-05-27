"use client";
import React, {useState} from "react";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  CheckCircle,
  Error,
  Refresh,
  SettingsInputComponent,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import {
  ReadwiseSetupRoute,
} from "../../api/integrations/readwise/setup/routeSchema";
import {
  ReadwiseSyncRoute,
} from "../../api/integrations/readwise/sync/routeSchema";
import {
  ReadwiseValidateRoute,
} from "../../api/integrations/readwise/validate/routeSchema";

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        borderRadius: 1,
        padding: 1,
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        color: theme.palette.text.secondary,
      }}>
        {icon}
      </Box>
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
    </Stack>
  );
}

function ReadwiseIntegrationCard() {
  const { rsnUserId } = useRsnUser();
  const { supabase } = useSupabase();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [setting, setSetting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);
  const [setupResult, setSetupResult] = useState<{
    success: boolean;
    error?: string;
    integrationId?: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Load existing integration
  const [existingIntegration, setExistingIntegration] = useState<{
    id: string;
    last_synced: string | null;
    sync_error: string | null;
    metadata: any;
  } | null>(null);
  const [loadingIntegration, setLoadingIntegration] = useState(true);

  React.useEffect(() => {
    if (rsnUserId) {
      loadExistingIntegration();
    }
  }, [rsnUserId]);

  const loadExistingIntegration = async () => {
    if (!rsnUserId) return;
    
    try {
      const { data, error } = await supabase
        .from('integration')
        .select('id, last_synced, sync_error, metadata')
        .eq('_type', 'readwise')
        .eq('for_user', rsnUserId)
        .limit(1)
        .single();

      if (data) {
        setExistingIntegration(data);
      }
    } catch (error) {
      // No existing integration found
    } finally {
      setLoadingIntegration(false);
    }
  };

  const handleValidateToken = async () => {
    if (!token.trim()) return;

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await ReadwiseValidateRoute.call({ token: token.trim() });
      if (result.data) {
        setValidationResult(result.data);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: "Network error while validating token",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSetupIntegration = async () => {
    if (!token.trim() || !validationResult?.valid) return;

    setSetting(true);
    setSetupResult(null);

    try {
      const result = await ReadwiseSetupRoute.call({ token: token.trim() });
      if (result.data) {
        setSetupResult(result.data);
        
        if (result.data.success) {
          // Reload the integration data
          await loadExistingIntegration();
          setToken(""); // Clear the token input
          setValidationResult(null);
        }
      }
    } catch (error) {
      setSetupResult({
        success: false,
        error: "Network error while setting up integration",
      });
    } finally {
      setSetting(false);
    }
  };

  const handleManualSync = async () => {
    if (!existingIntegration?.id) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await ReadwiseSyncRoute.call({ 
        integrationId: existingIntegration.id 
      });
      if (result.data) {
        setSyncResult(result.data);
        
        if (result.data.success) {
          // Reload integration to show updated sync status
          setTimeout(() => loadExistingIntegration(), 1000);
        }
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: "Network error while triggering sync",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveIntegration = async () => {
    if (!existingIntegration?.id) return;

    try {
      const { error } = await supabase
        .from('integration')
        .delete()
        .eq('id', existingIntegration.id);

      if (!error) {
        setExistingIntegration(null);
        setToken("");
        setValidationResult(null);
        setSetupResult(null);
        setSyncResult(null);
      }
    } catch (error) {
      console.error("Error removing integration:", error);
    }
  };

  if (loadingIntegration) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={20} />
            <Typography>Loading Readwise integration...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <img 
              src="/static/images/Readwise-Icon-Dark.svg" 
              width={24} 
              height={24} 
              alt="Readwise logo"
            />
            <Typography variant="h6">Readwise Integration</Typography>
            {existingIntegration && (
              <Chip 
                icon={<CheckCircle color="success" />} 
                label="Connected" 
                color="gray" 
                size="small" 
              />
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Connect your Readwise account to automatically sync your highlights to Reasonote.
          </Typography>

          {/* Existing Integration Status */}
          {existingIntegration && (
            <Box>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2">
                    <strong>Status:</strong> Connected to Readwise
                  </Typography>
                </Stack>
                
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2">
                    <strong>Last synced:</strong> {
                      existingIntegration.last_synced 
                        ? new Date(existingIntegration.last_synced).toLocaleString()
                        : 'Never'
                    }
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={syncing ? <CircularProgress size={16} /> : <Refresh />}
                    onClick={handleManualSync}
                    disabled={syncing}
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </Stack>

                {existingIntegration.sync_error && (
                  <Alert severity="error" icon={<Error />}>
                    <Typography variant="body2">
                      <strong>Sync Error:</strong> {existingIntegration.sync_error}
                    </Typography>
                  </Alert>
                )}

                {syncResult && (
                  <Alert severity={syncResult.success ? "success" : "error"}>
                    {syncResult.message || syncResult.error}
                  </Alert>
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleRemoveIntegration}
                  >
                    Remove Integration
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Setup New Integration */}
          {!existingIntegration && (
            <Stack spacing={2}>
              <TextField
                label="Readwise API Token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Readwise API token"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowToken(!showToken)}
                        edge="end"
                      >
                        {showToken ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Get your API token from{" "}
                <a 
                  href="https://readwise.io/access_token" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Readwise Settings
                </a>
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleValidateToken}
                  disabled={!token.trim() || validating}
                  startIcon={validating ? <CircularProgress size={16} /> : undefined}
                >
                  {validating ? 'Validating...' : 'Validate Token'}
                </Button>

                {validationResult?.valid && (
                  <Button
                    variant="contained"
                    onClick={handleSetupIntegration}
                    disabled={setting}
                    startIcon={setting ? <CircularProgress size={16} /> : <CheckCircle />}
                  >
                    {setting ? 'Setting up...' : 'Connect Readwise'}
                  </Button>
                )}
              </Stack>

              {/* Validation Results */}
              {validationResult && (
                <Alert 
                  severity={validationResult.valid ? "success" : "error"}
                  icon={validationResult.valid ? <CheckCircle /> : <Error />}
                >
                  {validationResult.valid ? (
                    <Stack>
                      <Typography variant="body2">
                        Token is valid!
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2">
                      {validationResult.error}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Setup Results */}
              {setupResult && (
                <Alert severity={setupResult.success ? "success" : "error"}>
                  {setupResult.success 
                    ? "Readwise integration connected successfully! Your highlights will sync automatically."
                    : setupResult.error
                  }
                </Alert>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function IntegrationPlaceholderCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string; 
}) {
  return (
    <Card sx={{ opacity: 0.7 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <img 
              src={icon} 
              width={24} 
              height={24} 
              alt={`${title} logo`}
            />
            <Typography variant="h6">{title} Integration</Typography>
            <Chip 
              label="Coming Soon" 
              color="default" 
              size="small" 
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  const theme = useTheme();

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      <Stack spacing={4}>
        {/* Page Header */}
        <Stack spacing={2}>
          <SectionHeader 
            icon={<SettingsInputComponent />} 
            title="Integrations" 
          />
          <Typography variant="body1" color="text.secondary">
            Connect external services to sync your data with Reasonote.
          </Typography>
        </Stack>

        <Divider />

        {/* Readwise Integration */}
        <Stack spacing={2}>
          <ReadwiseIntegrationCard />
        </Stack>

        {/* Future Integrations */}
        <Stack spacing={2}>
          <Typography variant="h6">Coming Soon</Typography>
          
          <IntegrationPlaceholderCard
            icon="/static/images/Pocket-Icon.svg"
            title="Pocket"
            description="Save articles and read them later. Sync your saved items from Pocket to Reasonote for better organization and note-taking."
          />
          
          <IntegrationPlaceholderCard
            icon="/static/images/Instapaper-Icon.svg"
            title="Instapaper"
            description="Sync your Instapaper articles and highlights to Reasonote. Keep all your read-later content organized in one place."
          />
          
          <IntegrationPlaceholderCard
            icon="/static/images/Zotero-Icon.svg"
            title="Zotero"
            description="Import your research papers, citations, and academic sources from Zotero to enhance your research workflow."
          />
        </Stack>
      </Stack>
    </Box>
  );
} 