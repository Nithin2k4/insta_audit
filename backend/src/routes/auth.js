const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
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
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticateToken, getMe);

// Instagram OAuth
router.get('/instagram/oauth-url', authenticateToken, getInstagramOAuthUrl);
router.get('/instagram/callback', instagramCallback);

// Google OAuth
router.get('/google/oauth-url', getGoogleOAuthUrl);
router.get('/google/callback', googleCallback);

// Profile management
router.put('/me', authenticateToken, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
], validate, updateProfile);

router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], validate, changePassword);

router.delete('/me', authenticateToken, deleteAccount);

module.exports = router;
