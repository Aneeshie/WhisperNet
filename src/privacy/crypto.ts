/**
 * WhisperNet Crypto Module
 * 
 * All cryptography uses the browser's built-in Web Crypto API.
 * No external dependencies. Everything runs in the browser.
 * 
 * - PBKDF2: PIN hashing (100k iterations, SHA-256)
 * - ECDSA P-256: Message signing & verification
 * - AES-256-GCM: Local storage encryption
 */

const PBKDF2_ITERATIONS = 100_000;

// ─── PIN Hashing (PBKDF2) ────────────────────────────────────────

export async function hashPin(pin: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = existingSalt
    ? Uint8Array.from(atob(existingSalt), c => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  return {
    hash: btoa(String.fromCharCode(...hashArray)),
    salt: existingSalt || btoa(String.fromCharCode(...salt)),
  };
}

export async function verifyPin(pin: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPin(pin, storedSalt);
  return hash === storedHash;
}

// ─── ECDSA Key Pair (Message Signing) ────────────────────────────

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true, // extractable so we can export/store
    ["sign", "verify"]
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
}

export async function signData(privateKey: CryptoKey, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encoder.encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifySignature(
  publicKeyBase64: string,
  data: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    const publicKey = await importPublicKey(publicKeyBase64);
    const encoder = new TextEncoder();
    const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signature,
      encoder.encode(data)
    );
  } catch {
    return false;
  }
}

// ─── AES-256-GCM (Local Storage Encryption) ─────────────────────

export async function deriveEncryptionKey(pin: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

export async function decrypt(key: CryptoKey, encryptedBase64: string): Promise<string> {
  const binary = atob(encryptedBase64);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// ─── Message Signing Helper ──────────────────────────────────────

/**
 * Creates a deterministic string from message fields for signing.
 * This is what gets signed/verified — if any of these fields are
 * tampered with, the signature won't match.
 */
export function getSignablePayload(msg: { id: string; content: string; createdAt: number }): string {
  return `${msg.id}:${msg.content}:${msg.createdAt}`;
}

  const hmacKey = await deriveHmacKey();
  if (!hmacKey) throw new Error("Cannot derive HMAC key");

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function hmacVerify(_key: CryptoKey, data: string, expectedHmac: string): Promise<boolean> {
  try {
    const computed = await hmacSign(_key, data);
    return computed === expectedHmac;
  } catch {
    return false;
  }
}


