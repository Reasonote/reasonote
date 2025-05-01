'use client';

import React, {useState} from "react";

import {AdminSendEmailRoute} from "@/app/api/admin/send-email/routeSchema";
import {Txt} from "@/components/typography/Txt";
import {
  trimAllLines,
  trimLines,
} from "@lukebechtel/lab-ts-utils";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Switch,
  TextField,
} from "@mui/material";

import Newsletter from "./ReasonoteEmailTemplates/Newsletter";
// Import email templates
import ProductUpdate from "./ReasonoteEmailTemplates/ProductUpdate";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

const groups = [
  { value: 'product_updates' as const, label: 'Product Updates' },
  { value: 'edtech_updates' as const, label: 'EdTech Updates' },
  { value: 'newsletter' as const, label: 'Newsletter' },
  { value: 'account_updates' as const, label: 'Account Updates' },
] as const;

const initialContent = ``;

const emailTemplates = [
  { value: 'custom', label: 'Custom' },
  { value: 'ProductUpdate', label: 'Product Update' },
  { value: 'Newsletter', label: 'Newsletter' },
];

const templateMap = {
  ProductUpdate,
  Newsletter,
};

export function AdminSendEmailPage() {
  const [subject, setSubject] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<typeof groups[number]['value'][]>([]);
  const [message, setMessage] = useState('');
  const [emails, setEmails] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const isMobile = useIsSmallDevice();

  const handleGroupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedGroups([...selectedGroups, value as typeof groups[number]['value']]);
    } else {
      setSelectedGroups(selectedGroups.filter(group => group !== value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenConfirmDialog(true);
  };

  const confirmSend = async () => {
    setOpenConfirmDialog(false);
    try {
      const response = await AdminSendEmailRoute.call({
        subject,
        fromName,
        fromEmail,
        htmlContent,
        textContent: textContent || undefined,
        groups: selectedGroups,
        emails: emails ? emails.split(',').map(email => email.trim()) : undefined,
        dryRun,
      });
      if (response.success) {
        setMessage(`Success! ${response.data.message}`);
        setRecipientEmails(response.data.recipientEmails);
      } else {
        setMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  const inferTextContent = () => {
    // Simple HTML to plain text conversion
    const text = trimLines(trimAllLines(htmlContent.replace(/<[^>]*>/g, '')))
    // Limit consecutive empty lines to a maximum of two
    const limitedEmptyLines = text.replace(/\n{3,}/g, '\n\n');
    setTextContent(limitedEmptyLines);
  };

  const handlePreviewClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePreviewClose = () => {
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);

  return (
    <Stack spacing={3} maxWidth={1200} margin="auto" padding={3}>
      <Txt variant="h4">Send Email to Subscribers</Txt>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <form onSubmit={handleSubmit} style={{ flex: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="From Name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="From Email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              fullWidth
              required
              error={!fromEmail.endsWith('@reasonote.com')}
              helperText={!fromEmail.endsWith('@reasonote.com') ? "Email must end with @reasonote.com" : ""}
            />
            <TextField
              label="HTML Content"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              multiline
              rows={10}
              fullWidth
              required
            />
            
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={handlePreviewClick}
              >
                Preview Email
              </Button>
            )}

            <Button onClick={inferTextContent}>Infer Plain Text Content</Button>

            <TextField
              label="Plain Text Content (Optional)"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              multiline
              rows={5}
              fullWidth
            />
            <TextField
              label="Individual Emails (Optional)"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              fullWidth
              helperText="Enter comma-separated email addresses, or leave blank to send only to groups"
            />
            <Txt variant="h6">Select Groups:</Txt>
            {groups.map((group) => (
              <FormControlLabel
                key={group.value}
                control={
                  <Checkbox
                    checked={selectedGroups.includes(group.value)}
                    onChange={handleGroupChange}
                    value={group.value}
                  />
                }
                label={group.label}
              />
            ))}
            <Divider sx={{ my: 2 }} />
            <Paper elevation={3} sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Txt variant="subtitle1" fontWeight="bold">Dry Run Mode</Txt>
                    <Txt variant="body2" color="text.secondary">
                      (Preview recipients without sending)
                    </Txt>
                  </Stack>
                }
              />
            </Paper>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              sx={{ mt: 2 }}
            >
              {dryRun ? "Preview Recipients" : "Send Email"}
            </Button>
          </Stack>
        </form>

        {!isMobile && (
          <Box sx={{ width: '50%', border: '1px solid #ccc', borderRadius: 1 }}>
            <Txt variant="h6" sx={{ p: 2, borderBottom: '1px solid #ccc' }}>Email Preview</Txt>
            <Box sx={{ height: '600px', overflow: 'auto' }}>
              <iframe
                title="Email Preview"
                srcDoc={htmlContent}
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Popover for mobile preview */}
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handlePreviewClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
      >
        <Box sx={{ width: '90vw', maxWidth: '600px', height: '80vh', maxHeight: '600px' }}>
          <Txt variant="h6" sx={{ p: 2, borderBottom: '1px solid #ccc' }}>Email Preview</Txt>
          <Box sx={{ height: 'calc(100% - 56px)', overflow: 'auto' }}>
            <iframe
              title="Email Preview"
              srcDoc={htmlContent}
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
            />
          </Box>
        </Box>
      </Popover>

      {message && <Txt color={message.startsWith('Error') ? 'error' : 'success'}>{message}</Txt>}
      {recipientEmails.length > 0 && (
        <Stack spacing={1}>
          <Txt variant="h6">Recipient Emails:</Txt>
          <List>
            {recipientEmails.map((email, index) => (
              <ListItem key={index}>
                <ListItemText primary={email} />
              </ListItem>
            ))}
          </List>
        </Stack>
      )}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Email Send</DialogTitle>
        <DialogContent>
          <Txt>You are about to send this email to:</Txt>
          <List>
            {emails && (
              <ListItem>
                <ListItemText primary="Individual Emails" secondary={emails} />
              </ListItem>
            )}
            {selectedGroups.map((group) => (
              <ListItem key={group}>
                <ListItemText primary="Group" secondary={group} />
              </ListItem>
            ))}
          </List>
          <Txt>Are you sure you want to proceed?</Txt>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmSend} variant="contained" color="primary">
            Confirm Send
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default AdminSendEmailPage;
