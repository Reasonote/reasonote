import React from 'react';
import { Html, Text, Heading } from "@react-email/components";

interface NewsletterProps {
  content: string;
}

export default function Newsletter({ content }: NewsletterProps) {
  return (
    <Html>
      <Heading>Reasonote Newsletter</Heading>
      <Text>{content}</Text>
    </Html>
  );
}