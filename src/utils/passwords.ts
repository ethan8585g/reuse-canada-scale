// Password hashing helpers built on Web Crypto (works on Cloudflare Workers and modern browsers).
// Stored format: pbkdf2$<iterations>$<base64-salt>$<base64-hash>
//
// Lazy-migration friendly: verifyPassword() returns { ok, needsRehash } so the login
// path can detect legacy plaintext entries, accept them, and silently upgrade them.

// Cloudflare Workers' Web Crypto PBKDF2 hard-caps iterations at 100,000:
// https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#pbkdf2
// OWASP suggests 600k for SHA-256, but on this runtime that throws
// NotSupportedError. 100k + a 16-byte random salt is the practical ceiling.
const ITERATIONS = 100_000
const KEY_LEN_BYTES = 32      // 256-bit derived key
const SALT_LEN_BYTES = 16

const PREFIX = 'pbkdf2$'

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number, keyLenBytes: number): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    keyLenBytes * 8
  )
  return new Uint8Array(bits)
}

export function isHashed(stored: string | null | undefined): boolean {
  return !!stored && stored.startsWith(PREFIX)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN_BYTES))
  const hash = await pbkdf2(password, salt, ITERATIONS, KEY_LEN_BYTES)
  return `${PREFIX}${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`
}

export interface VerifyResult { ok: boolean; needsRehash: boolean }

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<VerifyResult> {
  if (!stored) return { ok: false, needsRehash: false }
  if (!isHashed(stored)) {
    // Legacy plaintext column. Constant-time compare is overkill here — the row was already plaintext.
    return { ok: stored === password, needsRehash: stored === password }
  }
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return { ok: false, needsRehash: false }
  const iterations = parseInt(parts[1], 10)
  const salt = base64ToBytes(parts[2])
  const expected = base64ToBytes(parts[3])
  const actual = await pbkdf2(password, salt, iterations, expected.length)
  if (actual.length !== expected.length) return { ok: false, needsRehash: false }
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return { ok: diff === 0, needsRehash: diff === 0 && iterations < ITERATIONS }
}
