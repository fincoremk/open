// @fincoremk/secure-box — the password and encryption primitives FINCOREMK uses, on the standard Web Crypto API.
// Works in browsers, Node ≥ 18, Deno and Cloudflare Workers. MIT. Zero dependencies.
//
//   • hashPassword / verifyPassword — PBKDF2-HMAC-SHA256, random 16-byte salt per password, 600,000 iterations
//     (OWASP 2023 guidance), versioned format so the cost can be raised later without breaking old hashes.
//   • seal / open — AES-256-GCM authenticated encryption with a key derived from a passphrase.
//     Any change to the ciphertext, IV, salt or associated data makes `open` fail. Nothing is "decrypted wrong".

const C = globalThis.crypto;
if (!C || !C.subtle) throw new Error('secure-box needs the Web Crypto API (crypto.subtle)');
const enc = new TextEncoder(), dec = new TextDecoder();
export const DEFAULT_ITERATIONS = 600_000;

const b64 = u => (typeof Buffer !== 'undefined' ? Buffer.from(u).toString('base64') : btoa(String.fromCharCode(...u))).replace(/=+$/, '');
const unb64 = s => (typeof Buffer !== 'undefined' ? new Uint8Array(Buffer.from(s, 'base64')) : Uint8Array.from(atob(s), c => c.charCodeAt(0)));
const rand = n => C.getRandomValues(new Uint8Array(n));

async function pbkdf2(password, salt, iterations, bits = 256) {
  const k = await C.subtle.importKey('raw', enc.encode(String(password).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await C.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, k, bits));
}

/** Constant-time comparison: the time taken does not depend on where the first difference is. */
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

/** → 'pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>' */
export async function hashPassword(password, { iterations = DEFAULT_ITERATIONS } = {}) {
  if (typeof password !== 'string' || !password.length) throw new TypeError('password must be a non-empty string');
  const salt = rand(16), h = await pbkdf2(password, salt, iterations);
  return `pbkdf2-sha256$${iterations}$${b64(salt)}$${b64(h)}`;
}

/** @returns {Promise<{ok:boolean, rehash:boolean}>} rehash=true when the stored hash uses fewer iterations than today's default. */
export async function verifyPassword(password, stored) {
  const m = /^pbkdf2-sha256\$(\d{4,8})\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(String(stored));
  if (!m) return { ok: false, rehash: false };
  const it = Number(m[1]), want = unb64(m[3]), got = await pbkdf2(password, unb64(m[2]), it, want.length * 8);
  const ok = timingSafeEqual(got, want);
  return { ok, rehash: ok && it < DEFAULT_ITERATIONS };
}

async function aesKey(passphrase, salt, iterations) {
  const raw = await pbkdf2(passphrase, salt, iterations, 256);
  return C.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt any JSON value with a passphrase. `aad` (optional string) is authenticated but not encrypted —
 * e.g. a company id, so a backup of company A cannot be restored into company B.
 * @returns {Promise<string>} 'sb1.<iterations>.<salt>.<iv>.<ciphertext>'
 */
export async function seal(value, passphrase, { aad = '', iterations = DEFAULT_ITERATIONS } = {}) {
  const salt = rand(16), iv = rand(12), key = await aesKey(passphrase, salt, iterations);
  const ct = new Uint8Array(await C.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, key, enc.encode(JSON.stringify(value))));
  return ['sb1', iterations, b64(salt), b64(iv), b64(ct)].join('.');
}

/** Decrypt a value from `seal`. Throws if the passphrase, the aad or a single bit of the box is wrong. */
export async function open(box, passphrase, { aad = '' } = {}) {
  const p = String(box).split('.');
  if (p.length !== 5 || p[0] !== 'sb1') throw new Error('not a secure-box value');
  const key = await aesKey(passphrase, unb64(p[2]), Number(p[1]));
  let pt;
  try { pt = await C.subtle.decrypt({ name: 'AES-GCM', iv: unb64(p[3]), additionalData: enc.encode(aad) }, key, unb64(p[4])); }
  catch { throw new Error('secure-box: authentication failed (wrong passphrase, wrong context or altered data)'); }
  return JSON.parse(dec.decode(pt));
}
