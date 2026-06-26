import CryptoJS from 'crypto-js';

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex); // 256-bit key
};

export const encryptFileBuffer = async (fileBuffer, keyHex) => {
  const base64Data = arrayBufferToBase64(fileBuffer);
  
  // AES Encrypt the Base64 string
  const encrypted = CryptoJS.AES.encrypt(base64Data, keyHex).toString();
  
  // Convert encrypted string back to Blob for uploading
  return new Blob([encrypted], { type: 'text/plain' });
};

export const decryptFileBuffer = async (encryptedBlob, keyHex, originalMimeType) => {
  const encryptedText = await encryptedBlob.text();
  
  // AES Decrypt to get Base64 string
  const decryptedBase64 = CryptoJS.AES.decrypt(encryptedText, keyHex).toString(CryptoJS.enc.Utf8);
  if (!decryptedBase64) {
    throw new Error('Failed to decrypt file. Invalid key or corrupted file.');
  }
  
  // Convert Base64 back to ArrayBuffer
  const arrayBuffer = base64ToArrayBuffer(decryptedBase64);
  
  // Create final Blob
  return new Blob([arrayBuffer], { type: originalMimeType });
};
