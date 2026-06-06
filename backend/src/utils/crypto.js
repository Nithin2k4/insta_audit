const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns { encrypted, iv, authTag } all as hex strings
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypt an encrypted token
 * @param {string} encrypted - hex string of encrypted data
 * @param {string} ivHex - hex string of IV
 * @param {string} authTagHex - hex string of auth tag
 * @returns {string} - decrypted plaintext
 */
function decrypt(encrypted, ivHex, authTagHex) {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash a token for storage (for refresh tokens)
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { encrypt, decrypt, hashToken };
