/**
 * Utility functions for encoding and decoding data
 */

/**
 * Converts a URL-safe base64 string to a Uint8Array
 * Used for web push notification VAPID keys
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Converts an ArrayBuffer to a base64 string
 * Used for web push notification subscription objects
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode.apply(
    null, 
    Array.from(new Uint8Array(buffer))
  );
  return window.btoa(binary);
} 