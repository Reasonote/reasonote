import {
    useCallback,
    useState,
  } from "react";
  
  import {CreateShareRoute} from "@/app/api/share/create/routeSchema";
  import {
    RemoveShareAccessRoute,
  } from "@/app/api/share/remove-access/routeSchema";
  import {
    UpdatePublicShareRoute,
  } from "@/app/api/share/update-public/routeSchema";
  import {UpdateShareRoleRoute} from "@/app/api/share/update-role/routeSchema";
  import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
  import {RsnSnackbar} from "@/components/snackbars/RsnSnackbar";
  import {useSupabase} from "@/components/supabase/SupabaseProvider";
  import {Txt} from "@/components/typography/Txt";
  import {
    ApolloError,
    useQuery,
  } from "@apollo/client";
  import {Share} from "@mui/icons-material";
  import CloseIcon from "@mui/icons-material/Close";
  import LinkIcon from "@mui/icons-material/Link";
  import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Tooltip,
    Typography,
  } from "@mui/material";
  import {
    GetMemauthDeepDocument,
    GetMemauthFlatQuery,
    GetMemauthFlatQueryVariables,
  } from "@reasonote/lib-sdk-apollo-client";
  
  import {AuthorizedUsersList} from "./AuthorizedUsersList";
  import {GeneralAccessToggle} from "./GeneralAccessToggle";
  import {ShareEmailInput} from "./ShareEmailInput";
  
  export type ShareRole = 'Owner' | 'Editor' | 'Commenter' | 'Viewer';
  export type ShareEntityType = 'lesson' | 'course';
  
  interface ShareModalDumbProps {
    open: boolean;
    onClose: () => void;
    entityId: string;
    entityName: string;
    entityDirectLink: string;
    // Callback when new users are added
    onShareWithUsers?: (emails: string[], role: ShareRole) => Promise<void>;
    // Callback when general access is changed
    onUpdateGeneralAccess?: (isPublic: boolean) => Promise<void>;
    memauths?: GetMemauthFlatQuery;
    memauthsLoading?: boolean;
    memauthsError?: ApolloError;
    memauthsRefetch?: (variables?: Partial<GetMemauthFlatQueryVariables>) => Promise<any>;
  }
  
  interface ShareModalProps extends ShareModalDumbProps {
    entityType: ShareEntityType;
  }
  
  
  export function ShareModal({ 
    open, 
    onClose, 
    entityId,
    entityName,
    entityDirectLink,
    entityType,
    onShareWithUsers: onShareWithUsersCb,
    onUpdateGeneralAccess: onUpdateGeneralAccessCb,
  }: ShareModalProps) {
    const {sb} = useSupabase();
  
    const {data: memauths, loading: memauthsLoading, error: memauthsError, refetch: memauthsRefetch} = useQuery(GetMemauthDeepDocument,  {
      variables: {
        filter: {
          resourceEntityId: {
            eq: entityId,
          },
        },
      },
    });
  
    const onShareWithUsers = useCallback(async (emails: string[], role: ShareRole) => {
      try {
        const response = await CreateShareRoute.call({
          entityId,
          emails,
          role: role.toLowerCase() as any,
        });
  
        if (response.error) {
          throw new Error(response.error);
        }
  
        if (onShareWithUsersCb) {
          await onShareWithUsersCb(emails, role);
        }
      }
      catch(error) {
        console.error(error);
        throw error;
      }
      finally {
        if (memauthsRefetch) {
          await memauthsRefetch();
        }
      }
    }, [memauthsRefetch, onShareWithUsersCb]);
  
    const onUpdateGeneralAccess = useCallback(async (isPublic: boolean) => {
      const response = await UpdatePublicShareRoute.call({
        entityId,
        entityType,
        isPublic,
      });
  
      if (response.error) {
        throw new Error(response.error);
      }
  
      if (onUpdateGeneralAccessCb) {
        await onUpdateGeneralAccessCb(isPublic);
      }
    }, [onUpdateGeneralAccessCb]);
  
    return <ShareModalDumb 
      open={open}
      onClose={onClose}
      entityId={entityId}
      entityName={entityName}
      entityDirectLink={entityDirectLink}
      onShareWithUsers={onShareWithUsers}
      onUpdateGeneralAccess={onUpdateGeneralAccess}
      memauths={memauths}
      memauthsLoading={memauthsLoading}
      memauthsError={memauthsError}
      memauthsRefetch={memauthsRefetch}
    />;
  }
  
  export function ShareModalDumb({ 
    open, 
    onClose, 
    entityId,
    entityName,
    entityDirectLink,
    onShareWithUsers,
    onUpdateGeneralAccess,
    memauths,
    memauthsLoading,
    memauthsError,
    memauthsRefetch,
  }: ShareModalDumbProps) {
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState<ShareRole>('Viewer');
    const [isPublic, setIsPublic] = useState(false);
    const [showCopyToast, setShowCopyToast] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState<null | {
      message: string;
    }>(null);
    const [showErrorToast, setShowErrorToast] = useState<null | {
      errorMessage: string;
    }>(null);
  
    const shareLink = entityDirectLink;
  
    const handleCopyLink = () => {
      navigator.clipboard.writeText(shareLink);
      setShowCopyToast(true);
    };
  
    const handleShare = async () => {
      if (selectedEmails.length > 0 && onShareWithUsers) {
        try {
          await onShareWithUsers(selectedEmails, selectedRole);
          setSelectedEmails([]);
          setShowSuccessToast({
            message: `Successfully shared with ${selectedEmails.length} recipient${selectedEmails.length === 1 ? '' : 's'}`
          });
        } catch (error) {
          setShowErrorToast({
            errorMessage: error instanceof Error ? error.message : 'Failed to share'
          });
        }
      }
    };
  
    const handleUpdateRole = async (memauthId: string, newRole: string) => {
      try {
        const response = await UpdateShareRoleRoute.call({
          memauthId,
          role: newRole.toLowerCase() as any,
        });
        if (response.success) {
          if (memauthsRefetch) {
            await memauthsRefetch();
          }
          setShowSuccessToast({
            message: 'Successfully updated access level'
          });
        }
      } catch (error) {
        setShowErrorToast({
          errorMessage: error instanceof Error ? error.message : 'Failed to update role'
        });
      }
    };
  
    const handleRemoveAccess = async (memauthId: string) => {
      try {
        const response = await RemoveShareAccessRoute.call({
          memauthId,
        });
        if (response.success) {
          if (memauthsRefetch) {
            await memauthsRefetch();
          }
          setShowSuccessToast({
            message: 'Successfully removed access'
          });
        }
      } catch (error) {
        setShowErrorToast({
          errorMessage: error instanceof Error ? error.message : 'Failed to remove access'
        });
      }
    };
  
    const handleTogglePublicAccess = async (newValue: boolean) => {
      try {
        if (onUpdateGeneralAccess) {
          await onUpdateGeneralAccess(newValue);
        }
        setIsPublic(newValue);
        setShowSuccessToast({
          message: newValue ? 'Link sharing enabled' : 'Link sharing disabled'
        });
      } catch (error) {
        setShowErrorToast({
          errorMessage: error instanceof Error ? error.message : 'Failed to update sharing settings'
        });
      }
    };
  
    const isSmallDevice = useIsSmallDevice();
  
    return (
      <>
        <Dialog 
          data-testid="share-modal"
          open={open} 
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              width: isSmallDevice ? '100%' : undefined,
              margin: isSmallDevice ? 0 : undefined,
            },
          }}
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Txt startIcon={<Share />} variant="h6">Share "{entityName}"</Txt>
              <IconButton 
                data-testid="share-modal-close"
                onClick={onClose} 
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{
            width: '100%',
          }}
  
          >
            <Stack spacing={3}>
              {/* Email Input Section */}
              <Stack spacing={2} data-testid="share-email-section">
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Add people
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter email addresses to share with specific people
                  </Typography>
                </Stack>
                
                <ShareEmailInput
                  selectedEmails={selectedEmails}
                  onEmailsChange={setSelectedEmails}
                  selectedRole={selectedRole}
                  onRoleChange={setSelectedRole}
                />
                <Button 
                  data-testid="share-submit-button"
                  variant="contained" 
                  disabled={selectedEmails.length === 0}
                  onClick={handleShare}
                >
                  Share
                </Button>
              </Stack>
  
              {/* People with access */}
              <Stack spacing={.5} data-testid="share-access-list-section">
                <Txt variant="body1" color="text.secondary">People with access</Txt>
                <AuthorizedUsersList 
                  memauths={memauths}
                  onRemoveAccess={handleRemoveAccess}
                  onUpdateRole={handleUpdateRole}
                />
              </Stack>
  
              {/* General access */}
              <Stack spacing={2} data-testid="share-general-access-section">
                <Txt variant="body1" color="text.secondary">General access</Txt>
                <Stack spacing={2}>
                  <GeneralAccessToggle
                    isPublic={isPublic}
                    onChange={handleTogglePublicAccess}
                  />
                  
                  {/* Copy Link Section */}
                  <Stack
                    sx={{
                      p: 2,
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      width: '100%',
                      flexDirection: 'row'
                    }}
                  >
                    <Box width="fit-content">
                      <Tooltip title="Copy link">
                        <Button
                          data-testid="share-copy-link-button"
                          onClick={handleCopyLink}
                          size="small"
                          color="primary"
                          variant="contained"
                          startIcon={<LinkIcon fontSize="small" />}
                          sx={{
                            borderRadius: 20,
                            textTransform: 'none',
                          }}
                        >
                          Get link
                        </Button>
                      </Tooltip>
                    </Box>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
  
        <RsnSnackbar
          data-testid="share-copy-toast"
          open={showCopyToast}
          autoHideDuration={2000}
          onClose={() => setShowCopyToast(false)}
          message="Link copied to clipboard"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
  
        <RsnSnackbar
          data-testid="share-success-toast"
          open={showSuccessToast !== null}
          autoHideDuration={4000}
          onClose={() => setShowSuccessToast(null)}
          message={showSuccessToast?.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{
            sx: { backgroundColor: 'success.main' }
          }}
        />
  
        <RsnSnackbar
          data-testid="share-error-toast"
          open={showErrorToast !== null}
          autoHideDuration={6000}
          onClose={() => setShowErrorToast(null)}
          message={showErrorToast?.errorMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{
            sx: { backgroundColor: 'error.main' }
          }}
        />
      </>
    );
  } 