const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'insta-audit',
  });
}

function generateRefreshToken() {
  // Generate a cryptographically secure random token
  return crypto.randomBytes(64).toString('hex');
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { issuer: 'insta-audit' });
}

function getRefreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  getRefreshTokenExpiry,
  REFRESH_TOKEN_EXPIRY_MS,
};
