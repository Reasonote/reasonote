import React from 'react';
import { Html, Text, Heading } from "@react-email/components";

interface ProductUpdateProps {
  content: string;
}

export default function ProductUpdate({ content }: ProductUpdateProps) {
  return (
    <Html>
      <Heading>Product Update</Heading>
      <Text>{content}</Text>
    </Html>
  );
}