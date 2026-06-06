const bcrypt = require('bcryptjs');
const { query } = require('../models/db');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, getRefreshTokenExpiry } = require('../utils/jwt');
const { hashToken } = require('../utils/crypto');
const { encrypt, decrypt } = require('../utils/crypto');
const { sendWelcomeEmail } = require('../services/emailService');
const { getLongLivedToken, getLinkedInstagramAccount, getAccountInfo } = require('../services/instagramService');
const { google } = require('googleapis');
const axios = require('axios');

// Helper to set tokens
async function issueTokens(userId, email, res) {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return accessToken;
}

async function register(req, res) {
  const { email, password, name } = req.body;
  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );
    const user = result.rows[0];

    const accessToken = await issueTokens(user.id, user.email, res);
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = await issueTokens(user.id, user.email, res);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function logout(req, res) {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]).catch(() => {});
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
}

async function refresh(req, res) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const tokenHash = hashToken(refreshToken);
    const result = await query(
      'SELECT rt.*, u.email FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id WHERE rt.token_hash = $1 AND rt.expires_at > NOW()',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const tokenRow = result.rows[0];
    // Rotate refresh token
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    const accessToken = await issueTokens(tokenRow.user_id, tokenRow.email, res);

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
}

async function getMe(req, res) {
  try {
    const result = await query(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
}

function getInstagramOAuthUrl(req, res) {
  const scopes = [
    'instagram_basic',
    'instagram_manage_insights',
    'pages_read_engagement',
    'pages_show_list',
  ].join(',');

  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(process.env.META_REDIRECT_URI)}&scope=${scopes}&response_type=code&state=${req.user.id}`;

  res.json({ url });
}

async function instagramCallback(req, res) {
  const { code, state: userId, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/accounts?error=oauth_denied`);
  }

  try {
    // Exchange code for short-lived token
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      },
    });

    const shortLivedToken = tokenResponse.data.access_token;

    // Exchange for long-lived token
    const longLivedData = await getLongLivedToken(shortLivedToken);
    const accessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in || 5183944; // ~60 days default
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Get linked IG accounts from Facebook pages
    const igAccounts = await getLinkedInstagramAccount(accessToken);

    if (igAccounts.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL}/accounts?error=no_ig_account`);
    }

    // Check account limit
    const countResult = await query(
      'SELECT COUNT(*) FROM instagram_accounts WHERE user_id = $1',
      [userId]
    );
    const currentCount = parseInt(countResult.rows[0].count);
    if (currentCount >= 25) {
      return res.redirect(`${process.env.FRONTEND_URL}/accounts?error=account_limit`);
    }

    let addedCount = 0;
    for (const igAcct of igAccounts) {
      const info = await getAccountInfo(igAcct.igUserId, accessToken);
      const { encrypted, iv, authTag } = encrypt(accessToken);

      await query(
        `INSERT INTO instagram_accounts
          (user_id, instagram_user_id, username, name, profile_picture_url, access_token_encrypted, token_iv, token_auth_tag, token_expires_at, followers_count, following_count, media_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (user_id, instagram_user_id) DO UPDATE SET
           username = EXCLUDED.username,
           name = EXCLUDED.name,
           profile_picture_url = EXCLUDED.profile_picture_url,
           access_token_encrypted = EXCLUDED.access_token_encrypted,
           token_iv = EXCLUDED.token_iv,
           token_auth_tag = EXCLUDED.token_auth_tag,
           token_expires_at = EXCLUDED.token_expires_at,
           is_active = TRUE,
           updated_at = NOW()`,
        [
          userId,
          igAcct.igUserId,
          info.username,
          info.name,
          info.profile_picture_url,
          encrypted,
          iv,
          authTag,
          tokenExpiresAt,
          info.followers_count || 0,
          info.following_count || 0,
          info.media_count || 0,
        ]
      );
      addedCount++;
    }

    res.redirect(`${process.env.FRONTEND_URL}/accounts?success=connected&count=${addedCount}`);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/accounts?error=oauth_failed`);
  }
}

function getGoogleOAuthUrl(req, res) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    state: 'google_oauth',
  });

  res.json({ url });
}

async function googleCallback(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_denied`);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Find or create user
    let userResult = await query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [data.id, data.email]);
    let user = userResult.rows[0];

    if (!user) {
      const insertResult = await query(
        'INSERT INTO users (email, name, google_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [data.email, data.name, data.id, data.picture]
      );
      user = insertResult.rows[0];
      sendWelcomeEmail(user.email, user.name).catch(() => {});
    } else if (!user.google_id) {
      await query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [data.id, data.picture, user.id]);
    }

    const accessToken = await issueTokens(user.id, user.email, res);

    // Redirect with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
}

async function updateProfile(req, res) {
  const { name } = req.body;
  try {
    const result = await query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, avatar_url',
      [name, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({ error: 'No password set (OAuth account)' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
}

async function deleteAccount(req, res) {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.clearCookie('refreshToken');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  getInstagramOAuthUrl,
  instagramCallback,
  getGoogleOAuthUrl,
  googleCallback,
  updateProfile,
  changePassword,
  deleteAccount,
};
