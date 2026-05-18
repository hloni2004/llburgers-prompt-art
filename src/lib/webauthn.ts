const normalizeBase64 = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  return `${padded}${padding}`;
};

export const base64ToArrayBuffer = (value: string): ArrayBuffer => {
  const binary = atob(normalizeBase64(value));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const arrayBufferToBase64 = (value: ArrayBuffer | Uint8Array): string => {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
  const chunkSize = 0x8000; // Chunk to avoid call stack limits for large buffers.
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};
