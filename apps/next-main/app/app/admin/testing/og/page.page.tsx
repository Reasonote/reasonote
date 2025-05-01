"use client";

import {
  useEffect,
  useState,
} from "react";

export default function ValidateImagePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Look for a meta tag with property "og:image" (adjust if needed)
    const meta = document.querySelector('meta[property="og:image"]');
    if (meta) {
      const url = meta.getAttribute('content') || null;
      setImageUrl(url);
    }
  }, []);


  return (
    <div style={{ padding: '2rem' }}>
      <h1>Base64 Image Validation</h1>
      {imageUrl ? (
        <div>
          <p><strong>Found image URL:</strong></p>
          <pre style={{ overflowX: 'auto', background: '#f0f0f0', padding: '1rem' }}>
            {imageUrl}
          </pre>
          <p><strong>Rendered Image:</strong></p>
          <img src={imageUrl} alt="Dynamic OG" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      ) : (
        <p>No valid image URL header found.</p>
      )}
    </div>
  );
}