"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  type UserProfile,
  useUserProfile,
} from "@/clientOnly/hooks/useUserProfile";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Description as BioIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface UserProfileHeaderProps {
  username: string;
}

export function UserProfileHeader({ username }: UserProfileHeaderProps) {
  const router = useRouter();
  const { getUserProfileByUsername, updateUserProfile } = useUserProfile();
  const { rsnUserId } = useRsnUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {supabase} = useSupabase();

  // Check if current user owns this profile
  const isOwnProfile = userProfile?.rsn_user_id === rsnUserId;

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await getUserProfileByUsername(username);
      if (error) {
        setLoadingError(error.message);
        return;
      }
      setUserProfile(data);
      setNewUsername(data.username);
      setNewDisplayName(data.display_name || '');
      setNewBio(data.bio || '');
    }
    loadProfile();
  }, [username, getUserProfileByUsername]);

  const handleSaveUsername = async () => {
    if (!userProfile) return;
    try {
      const { error } = await updateUserProfile({ username: newUsername });
      if (error) {
        // Check for duplicate username error
        if (error.message.includes('duplicate')) {
          setUsernameError('This username is already taken');
        } else {
          setUsernameError(error.message);
        }
        return;
      }
      setUsernameError(null);
      setIsEditingUsername(false);
      // Redirect to the new username URL
      router.push(`/app/u/${newUsername}`);
    } catch (err: any) {
      setUsernameError(err.message);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!userProfile) return;
    try {
      const { error } = await updateUserProfile({
        display_name: newDisplayName,
      });
      if (error) {
        setDisplayNameError(error.message);
        return;
      }
      setDisplayNameError(null);
      setIsEditingDisplayName(false);
      // Reload profile to get updated data
      const { data } = await getUserProfileByUsername(userProfile.username);
      setUserProfile(data);
    } catch (err: any) {
      setDisplayNameError(err.message);
    }
  };

  const handleSaveBio = async () => {
    if (!userProfile) return;
    try {
      const { error } = await updateUserProfile({
        bio: newBio,
      });
      if (error) {
        setBioError(error.message);
        return;
      }
      setBioError(null);
      setIsEditingBio(false);
      // Reload profile to get updated data
      const { data } = await getUserProfileByUsername(userProfile.username);
      setUserProfile(data);
    } catch (err: any) {
      setBioError(err.message);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('rsnUserId', userProfile!.rsn_user_id);

    const authToken = await supabase.auth.getSession().then(({data}) => data.session?.access_token);

    try {
      const response = await fetch('/api/user_profile/picture/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      // Reload profile to get updated image URL
      const {data} = await getUserProfileByUsername(username);
      setUserProfile(data);
    } catch (err: any) {
      setAvatarError(err.message);
    }
  };

  if (loadingError) return <div>Profile not found</div>;
  if (!userProfile) return <div>Loading...</div>;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} alignItems="flex-start">
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={userProfile.profile_image_url || ''}
            sx={{ 
              width: 120, 
              height: 120,
              cursor: isOwnProfile ? 'pointer' : 'default',
              '&:hover': isOwnProfile ? {
                opacity: 0.8,
              } : {},
            }}
            onClick={() => isOwnProfile && fileInputRef.current?.click()}
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileSelect}
          />
        </Box>
        <Stack spacing={1} flex={1}>
          {/* Display Name Section */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {isEditingDisplayName ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Add a display name"
                    sx={{ minWidth: 200 }}
                    error={Boolean(displayNameError)}
                    helperText={displayNameError}
                  />
                  <IconButton size="small" onClick={handleSaveDisplayName} color="primary">
                    <CheckIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => {
                    setIsEditingDisplayName(false);
                    setNewDisplayName(userProfile.display_name || '');
                  }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <>
                <Typography variant="h4">
                  {userProfile.display_name || userProfile.username}
                </Typography>
                {isOwnProfile && (
                  <IconButton size="small" onClick={() => setIsEditingDisplayName(true)} color="gray">
                    <EditIcon />
                  </IconButton>
                )}
              </>
            )}
          </Stack>

          {/* Username Section */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {isEditingUsername ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    error={Boolean(usernameError)}
                    helperText={usernameError}
                    sx={{ minWidth: 200 }}
                  />
                  <IconButton size="small" onClick={handleSaveUsername} color="primary">
                    <CheckIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => {
                    setIsEditingUsername(false);
                    setNewUsername(userProfile.username);
                    setUsernameError(null);
                  }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <>
                <Typography variant="subtitle1" color="text.secondary">
                  @{userProfile.username}
                </Typography>
                {isOwnProfile && (
                  <IconButton size="small" onClick={() => setIsEditingUsername(true)} color="gray">
                    <EditIcon />
                  </IconButton>
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Stack>

      {/* Bio Section */}
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BioIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Bio
            </Typography>
            {isOwnProfile && !isEditingBio && (
              <IconButton size="small" onClick={() => setIsEditingBio(true)} color="gray">
                <EditIcon fontSize="small"  />
              </IconButton>
            )}
          </Stack>
          
          {isEditingBio ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                multiline
                rows={3}
                size="small"
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Write a bio about yourself"
                fullWidth
                error={Boolean(bioError)}
                helperText={bioError}
              />
                <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <EditIcon fontSize="inherit" />
                      
                      <a 
                        href="https://www.markdownguide.org/basic-syntax/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'inherit' }}
                      >
                        Supports{' '} Markdown formatting
                      </a>
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={handleSaveBio} color="primary">
                    <CheckIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => {
                    setIsEditingBio(false);
                    setNewBio(userProfile.bio || '');
                  }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Typography variant="body1">
              {userProfile.bio ? 
                <MuiMarkdownDefault>{userProfile.bio}</MuiMarkdownDefault>
              : (isOwnProfile ? <i style={{ color: 'gray' }}>Add a bio to tell people about yourself</i> : <i style={{ color: 'gray' }}>No bio yet</i>)}
            </Typography>
          )}
        </Stack>
      </Paper>

      {avatarError && (
        <Typography color="error" variant="caption">
          Failed to update profile picture: {avatarError}
        </Typography>
      )}
    </Stack>
  );
} 