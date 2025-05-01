"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  type UserProfile,
  useUserProfile,
} from "@/clientOnly/hooks/useUserProfile";
import {
  BookOutlined,
  StarOutline,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

interface UserProfilePinnedItemsProps {
  username: string;
}

// Placeholder pinned items for demonstration
const PLACEHOLDER_ITEMS = [
  { id: '1', title: 'My Reading List', description: 'Books I want to read', icon: <BookOutlined /> },
  { id: '2', title: 'Favorite Movies', description: 'My top rated films', icon: <StarOutline /> },
  { id: '3', title: 'Study Notes', description: 'Personal study materials', icon: <BookOutlined /> },
  { id: '4', title: 'Project Ideas', description: 'Future project concepts', icon: <StarOutline /> },
];

export function UserProfilePinnedItems({ username }: UserProfilePinnedItemsProps) {
  const { getUserProfileByUsername } = useUserProfile();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await getUserProfileByUsername(username);
      setUserProfile(data);
    }
    loadProfile();
  }, [username, getUserProfileByUsername]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pinned
      </Typography>
      <Grid container spacing={2}>
        {PLACEHOLDER_ITEMS.map((item) => (
          <Grid item key={item.id} xs={12} sm={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {item.icon}
                  <Typography variant="h6" component="div">
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 