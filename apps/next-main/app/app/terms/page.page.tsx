'use client'
import React from "react";

import {
  Box,
  Typography,
} from "@mui/material";

export default function TermsOfService() {
  return (
    <Box my={4} p={5}>
      <Typography variant="h3" component="h1" gutterBottom>
        Terms of Service
      </Typography>
      
      <Typography variant="body1" paragraph>
        Last updated: 2024-09-18
      </Typography>

      <Typography variant="h5" gutterBottom>
        1. Acceptance of Terms
      </Typography>
      <Typography variant="body1" paragraph>
        By accessing or using Reasonote ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
      </Typography>

      <Typography variant="h5" gutterBottom>
        2. Description of Service
      </Typography>
      <Typography variant="body1" paragraph>
        Reasonote is a SaaS platform that provides [brief description of your service]. The Service is provided "as is" and "as available" without warranties of any kind.
      </Typography>

      <Typography variant="h5" gutterBottom>
        3. User Accounts
      </Typography>
      <Typography variant="body1" paragraph>
        You are responsible for safeguarding the password you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
      </Typography>

      <Typography variant="h5" gutterBottom>
        4. User Content
      </Typography>
      <Typography variant="body1" paragraph>
        You retain all rights to any content you submit, post or display on or through the Service. By submitting, posting or displaying content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute it.
      </Typography>

      <Typography variant="h5" gutterBottom>
        5. Acceptable Use
      </Typography>
      <Typography variant="body1" paragraph>
        You agree not to use the Service for any unlawful purposes or to conduct any unlawful activity, including, but not limited to, fraud, embezzlement, money laundering or insider trading.
      </Typography>

      <Typography variant="h5" gutterBottom>
        6. Termination
      </Typography>
      <Typography variant="body1" paragraph>
        We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
      </Typography>

      <Typography variant="h5" gutterBottom>
        7. Limitation of Liability
      </Typography>
      <Typography variant="body1" paragraph>
        In no event shall Reasonote, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
      </Typography>

      <Typography variant="h5" gutterBottom>
        8. Changes to Terms
      </Typography>
      <Typography variant="body1" paragraph>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes by posting the new Terms on this page and updating the "Last updated" date.
      </Typography>

      <Typography variant="h5" gutterBottom>
        9. Governing Law
      </Typography>
      <Typography variant="body1" paragraph>
        These Terms shall be governed and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
      </Typography>

      <Typography variant="h5" gutterBottom>
        10. Contact Us
      </Typography>
      <Typography variant="body1" paragraph>
        If you have any questions about these Terms, please contact us at terms@reasonote.com.
      </Typography>
    </Box>
  );
}