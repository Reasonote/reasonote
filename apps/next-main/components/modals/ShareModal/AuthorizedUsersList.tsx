import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {GetMemauthDeepQuery} from "@reasonote/lib-sdk-apollo-client";

import {AccessLevelSelect} from "./AccessLevelSelect";
import {ShareRole} from "./ShareEntityModal";

interface AuthorizedUsersListProps {
  memauths?: GetMemauthDeepQuery;
  onRemoveAccess?: (userId: string) => Promise<void>;
  onUpdateRole?: (memauthId: string, newRole: string) => Promise<void>;
}

const AVAILABLE_ROLES = ['viewer', 'commenter', 'editor'] as const;

export function AuthorizedUsersList({ 
  memauths, 
  onRemoveAccess,
  onUpdateRole,
}: AuthorizedUsersListProps) {
  const rsnUserId = useRsnUserId();
  
  const handleRoleChange = async (memauthId: string, newRole: ShareRole) => {
    if (onUpdateRole) {
      await onUpdateRole(memauthId, newRole);
    }
  };
  
  const isSmallDevice = useIsSmallDevice();

  const sortedEdges = [...(memauths?.memauthCollection?.edges ?? [])].sort((a, b) => {
    const aIsCurrentUser = a?.node?.principalUser?.id === rsnUserId;
    const bIsCurrentUser = b?.node?.principalUser?.id === rsnUserId;
    
    if (aIsCurrentUser && !bIsCurrentUser) return -1;
    if (!aIsCurrentUser && bIsCurrentUser) return 1;
    return 0;
  });

  if (!memauths?.memauthCollection?.edges?.length) {
    return null;
  }

  const maxHeight = isSmallDevice ? 200 : 300;

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          maxHeight: maxHeight,
          overflowY: 'auto',
          // Add subtle scrollbar styling
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: (theme) => theme.palette.grey[300],
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: (theme) => theme.palette.grey[400],
          },
        }}
      >
        {sortedEdges.map(edge => {
          const memauth = edge?.node;
          if (!memauth) return null;
          if (memauth.isPublic) {
            return null;
          }

          const isOwner = memauth.accessLevel?.toLowerCase() === 'owner';

          return (
            <Stack 
              key={memauth.id} 
              data-testid={`share-user-item-${memauth.principalUser?.id}`}
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ py: 0.5 }}
            >
              <Stack spacing={0.5} flexGrow={1}>
                <Typography variant="body2">
                  {memauth.principalUser?.authEmail ?? <i>Unknown Email</i>} 
                  {memauth.principalUser?.id === rsnUserId ? " (You)" : ""}
                </Typography>
                {isOwner ? (
                  <Typography variant="caption" color="text.secondary">
                    Owner
                  </Typography>
                ) : (
                  <AccessLevelSelect
                    data-testid={`share-role-select-${memauth.principalUser?.id}`}
                    value={memauth.accessLevel as ShareRole}
                    onChange={(newRole) => handleRoleChange(memauth.id, newRole)}
                  />
                )}
              </Stack>
              {onRemoveAccess && !isOwner && (
                <IconButton 
                  data-testid={`share-remove-user-${memauth.principalUser?.id}`}
                  size="small" 
                  onClick={() => onRemoveAccess(memauth.id)}
                  aria-label="Remove access"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          );
        })}
      </Box>
    </Stack>
  );
} 