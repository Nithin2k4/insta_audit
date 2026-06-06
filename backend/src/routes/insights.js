const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getOverview, getFollowerHistory, getEngagementHistory, getPosts, getReels } = require('../controllers/insightsController');

const router = express.Router();

router.use(authenticateToken);

router.get('/:accountId/overview', getOverview);
router.get('/:accountId/followers', getFollowerHistory);
router.get('/:accountId/engagement', getEngagementHistory);
router.get('/:accountId/posts', getPosts);
router.get('/:accountId/reels', getReels);

module.exports = router;
