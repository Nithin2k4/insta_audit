const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { syncLimiter } = require('../middleware/rateLimiter');
const {
  listAccounts,
  deleteAccount,
  triggerSync,
  getAccountSummary,
  syncAllAccounts,
} = require('../controllers/accountsController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listAccounts);
router.post('/sync-all', syncLimiter, syncAllAccounts);
router.get('/:id/summary', getAccountSummary);
router.delete('/:id', deleteAccount);
router.post('/:id/sync', syncLimiter, triggerSync);

module.exports = router;
