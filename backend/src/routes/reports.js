const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { exportData } = require('../controllers/reportsController');

const router = express.Router();

router.use(authenticateToken);
router.get('/export', exportData);

module.exports = router;
