"use client";
import { Stack, Typography, Link as MuiLink, Tooltip } from '@mui/material';
import Link from 'next/link';
import { X, Mail, LinkedIn } from '@mui/icons-material';
import { DiscordIcon } from '../icons/DiscordIcon';
import { Txt } from '@/components/typography/Txt';

export const Footer = () => (
  <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
    {/* Contact & Social Links */}
    <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
      <Tooltip title="Join our Discord community" arrow>
        <MuiLink 
          href="https://discord.gg/8VRBVyDP2g" 
          target="_blank" 
          sx={{ color: 'text.secondary', '&:hover': { color: '#5865F2' } }}
        >
          <DiscordIcon />
        </MuiLink>
      </Tooltip>

      <Tooltip title="Follow us on X" arrow>
        <MuiLink 
          href="https://x.com/reasonote" 
          target="_blank"
          sx={{ color: 'text.secondary', '&:hover': { color: '#1DA1F2' } }}
        >
          <X />
        </MuiLink>
      </Tooltip>

      <Tooltip title="Connect with us on LinkedIn" arrow>
        <MuiLink 
          href="https://www.linkedin.com/company/reasonote" 
          target="_blank"
          sx={{ color: 'text.secondary', '&:hover': { color: '#0077B5' } }}
        >
          <LinkedIn />
        </MuiLink>
      </Tooltip>

      <Tooltip title="Email us at support@reasonote.com" arrow>
        <MuiLink 
          href="mailto:support@reasonote.com"
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          <Mail />
        </MuiLink>
      </Tooltip>
    </Stack>

    {/* Legal Links */}
    <Stack direction="row" spacing={2} justifyContent="center">
      <Link href="/app/privacy" passHref>
        <Typography variant="caption" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          Privacy Policy
        </Typography>
      </Link>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>
      <Link href="/app/terms" passHref>
        <Typography variant="caption" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          Terms of Service
        </Typography>
      </Link>
    </Stack>
  </Stack>
); 