/**
 * Utilitas Token Stateless untuk Admin Random URL
 * Format Token: 75 karakter Base64URL tanpa titik dan tanpa JSON
 * Payload: 8 byte waktu kedaluwarsa (BigInt epoch ms) + 16 byte nonce acak = 24 byte
 * Signature: HMAC-SHA256 (32 byte)
 * Total: 56 byte biner -> 75 karakter Base64URL
 * Runtime: Web Crypto API (crypto.subtle) - Kompatibel penuh dengan Node.js dan Edge Runtime Vercel
 */

export { ADMIN_TOKEN_REGEX, isAdminLoginPath } from './admin-path';
import { ADMIN_TOKEN_REGEX } from './admin-path';

/**
 * Mengecek apakah fitur Admin Random Path aktif dan valid
 * Aktif HANYA jika ADMIN_RANDOM_PATH=true dan ADMIN_PATH_SECRET minimal 32 karakter.
 */
export function isRandomAdminPathActive(): boolean {
  if (process.env.ADMIN_RANDOM_PATH !== 'true') {
    return false;
  }

  const secret = process.env.ADMIN_PATH_SECRET;
  if (!secret || secret.length < 32) {
    console.warn(
      '[AdminRandomPath] Peringatan: ADMIN_RANDOM_PATH=true tetapi ADMIN_PATH_SECRET tidak ada atau kurang dari 32 karakter. Fallback otomatis ke perilaku lama (/login).'
    );
    return false;
  }

  return true;
}

/**
 * Helper Base64URL encode dari Uint8Array
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Helper Base64URL decode ke Uint8Array
 */
function base64UrlToUint8Array(base64url: string): Uint8Array | null {
  try {
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64url, 'base64url');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Mendapatkan CryptoKey Web Crypto untuk HMAC-SHA256
 */
async function getHmacKey(secretStr: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secretStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Men-generate token acak 75 karakter
 * @param validityMs Masa berlaku token dalam millisecond (default: 5 menit = 300.000 ms)
 * @param customSecret Secret khusus (opsional, untuk testing)
 */
export async function generateAdminToken(validityMs = 300000, customSecret?: string): Promise<string> {
  const secret = customSecret || process.env.ADMIN_PATH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_PATH_SECRET wajib diisi minimal 32 karakter untuk generate token');
  }

  // 1. Payload 24 byte: 8 byte exp (BigInt epoch ms) + 16 byte nonce
  const payload = new Uint8Array(24);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

  const expMs = BigInt(Date.now() + validityMs);
  view.setBigInt64(0, expMs, false); // Big-endian

  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);
  payload.set(nonce, 8);

  // 2. Hitung HMAC-SHA256 (32 byte)
  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, payload);
  const signature = new Uint8Array(sigBuffer);

  // 3. Gabungkan 24 byte payload + 32 byte signature = 56 byte biner
  const combined = new Uint8Array(56);
  combined.set(payload, 0);
  combined.set(signature, 24);

  // 4. Encode ke Base64URL (tepat 75 karakter)
  const token = uint8ArrayToBase64Url(combined);
  if (token.length !== 75) {
    throw new Error(`Panjang token tidak terduga: ${token.length} (diharapkan 75 karakter)`);
  }

  return token;
}

/**
 * Memverifikasi token acak 75 karakter
 * Memastikan signature valid (constant-time) dan waktu belum kedaluwarsa.
 */
export async function verifyAdminToken(token: string, customSecret?: string): Promise<boolean> {
  if (!token || typeof token !== 'string' || !ADMIN_TOKEN_REGEX.test(token)) {
    return false;
  }

  const secret = customSecret || process.env.ADMIN_PATH_SECRET;
  if (!secret || secret.length < 32) {
    return false;
  }

  const bytes = base64UrlToUint8Array(token);
  if (!bytes || bytes.byteLength !== 56) {
    return false;
  }

  // Parsing berdasarkan offset biner
  const payload = new Uint8Array(24);
  payload.set(bytes.subarray(0, 24));
  const signature = new Uint8Array(32);
  signature.set(bytes.subarray(24, 56));

  // 1. Verifikasi HMAC-SHA256 via Web Crypto (constant-time verification)
  try {
    const key = await getHmacKey(secret);
    const isValidSig = await crypto.subtle.verify('HMAC', key, signature, payload);
    if (!isValidSig) {
      return false;
    }

    // 2. Cek waktu kedaluwarsa
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const expMs = view.getBigInt64(0, false);
    const nowMs = BigInt(Date.now());

    if (nowMs > expMs) {
      return false; // Kedaluwarsa
    }

    return true;
  } catch {
    return false;
  }
}
