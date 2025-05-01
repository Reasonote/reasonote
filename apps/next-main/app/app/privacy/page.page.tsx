'use client'
import React from "react";

import {
  Box,
  Typography,
} from "@mui/material";

export default function PrivacyPolicy() {
  return (
    <Box my={4} p={5}>
      <Typography variant="h3" component="h1" gutterBottom>
        Privacy Policy
      </Typography>
      
      <Typography variant="body1" paragraph>
        Last updated: 2024-09-18
      </Typography>

      <Typography variant="h5" gutterBottom>
        1. Introduction
      </Typography>
      <Typography variant="body1" paragraph>
        Welcome to Reasonote ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
      </Typography>

      <Typography variant="h5" gutterBottom>
        2. Information We Collect
      </Typography>
      <Typography variant="body1" paragraph>
        We collect the following types of information:
        • Personal Information: Name, email address, profile picture
        • Usage Data: Chat history, interaction patterns, feature usage statistics
        • Device Information: Device type, operating system, browser type, IP address
      </Typography>

      <Typography variant="h5" gutterBottom>
        3. How We Use Your Information
      </Typography>
      <Typography variant="body1" paragraph>
        We use the information we collect to:
        • Provide and maintain our service
        • Improve and personalize your user experience
        • Analyze usage patterns and optimize our app's performance
        • Communicate with you about updates, features, and support
        • Detect and prevent fraudulent or unauthorized activity
        • Comply with legal obligations and enforce our terms of service
        • Develop new features and services based on user feedback and usage patterns
      </Typography>

      <Typography variant="h5" gutterBottom>
        4. Third-Party User Data
      </Typography>
      <Typography variant="body1" paragraph>
        We use third-party authentication services to enhance user experience and security.
      </Typography>

      <Typography variant="h6" gutterBottom>
        4.1 Google User Data
      </Typography>
      <Typography variant="body1" paragraph>
        Our app accesses and uses Google user data solely for authentication purposes, including:
        • User login
        • Retrieving user email
        • Obtaining user name
        • Accessing user avatar
      </Typography>
      <Typography variant="body1" paragraph>
        We do not access, use, store, or share any other Google user data beyond these basic profile elements. We adhere strictly to Google's API Services User Data Policy and Limited Use requirements in our handling of this information. Specifically:
        • We only request access to the Google user data that is necessary for the purposes of our app.
        • We do not sell Google user data.
        • We do not use or transfer Google user data for serving ads.
        • We do not allow humans to read Google user data unless we have your affirmative agreement, it is necessary for security purposes, or to comply with applicable law.
      </Typography>

      <Typography variant="h5" gutterBottom>
        5. Data Sharing and Disclosure
      </Typography>
      <Typography variant="body1" paragraph>
        We do not sell your personal information. We only share limited user information with third-party service providers to facilitate the provision of our services. This shared information is restricted to your name, email address, and avatar. These service providers are contractually obligated to use this information solely for the purpose of providing the services we've requested and are prohibited from using it for any other purposes.
      </Typography>

      <Typography variant="h5" gutterBottom>
        6. Data Security
      </Typography>
      <Typography variant="body1" paragraph>
        We implement appropriate technical and organizational measures to protect the security of your personal information. These measures include:
        • Utilizing Supabase's robust security features, including row-level security and encrypted data at rest
        • Employing HTTPS encryption for all data transmissions
        • Implementing secure authentication practices
        • Regularly updating and patching our systems
        • Conducting periodic security audits
        • Restricting access to personal data to authorized personnel only
        • Using industry-standard encryption for sensitive data storage
      </Typography>

      <Typography variant="h5" gutterBottom>
        7. Your Rights and Data Controls
      </Typography>
      <Typography variant="body1" paragraph>
        You have certain rights regarding your personal information, including:
        • The right to access your data
        • The right to correct inaccurate data
        • The right to delete your data
        • The right to restrict or object to processing
        • The right to data portability
        
        You can exercise these rights by contacting our support team at privacy@reasonote.com.
      </Typography>

      <Typography variant="h5" gutterBottom>
        8. Data Retention
      </Typography>
      <Typography variant="body1" paragraph>
        We retain your personal information for as long as your account is active or as needed to provide you services or as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
      </Typography>

      <Typography variant="h5" gutterBottom>
        9. International Data Transfers
      </Typography>
      <Typography variant="body1" paragraph>
        Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We have implemented appropriate safeguards, such as standard contractual clauses, to protect your information when it is transferred internationally.
      </Typography>

      <Typography variant="h5" gutterBottom>
        10. In-App Privacy Information
      </Typography>
      <Typography variant="body1" paragraph>
        You can access this Privacy Policy at any time within the app by going to https://reasonote.com/app/privacy. Additionally, we provide in-app notifications about our privacy practices when we collect or use your personal information.
      </Typography>

      <Typography variant="h5" gutterBottom>
        11. Changes to This Privacy Policy
      </Typography>
      <Typography variant="body1" paragraph>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page, updating the "Last updated" date, and sending you an email notification.
      </Typography>

      <Typography variant="h5" gutterBottom>
        12. Contact Us
      </Typography>
      <Typography variant="body1" paragraph>
        If you have any questions about this Privacy Policy, please contact us at privacy@reasonote.com.
      </Typography>
    </Box>
  );
}
