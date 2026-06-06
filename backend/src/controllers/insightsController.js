const { query } = require('../models/db');

async function checkAccountAccess(accountId, userId) {
  const result = await query(
    'SELECT id FROM instagram_accounts WHERE id = $1 AND user_id = $2',
    [accountId, userId]
  );
  return result.rows.length > 0;
}

async function getOverview(req, res) {
  const { accountId } = req.params;
  try {
    const hasAccess = await checkAccountAccess(accountId, req.user.id);
    if (!hasAccess) return res.status(404).json({ error: 'Account not found' });

    // Latest snapshot + account info
    const accountResult = await query(
      `SELECT
        a.followers_count, a.following_count, a.media_count, a.last_synced_at, a.username,
        s.reach, s.impressions, s.profile_views, s.website_clicks, s.date
       FROM instagram_accounts a
       LEFT JOIN LATERAL (
         SELECT * FROM daily_snapshots WHERE account_id = a.id ORDER BY date DESC LIMIT 1
       ) s ON true
       WHERE a.id = $1`,
      [accountId]
    );

    // Average engagement rate from recent posts
    const engagementResult = await query(
      `SELECT AVG(engagement_rate) AS avg_engagement_rate
       FROM post_insights
       WHERE account_id = $1 AND posted_at > NOW() - INTERVAL '30 days'`,
      [accountId]
    );

    // Post count last 30 days
    const postCountResult = await query(
      `SELECT COUNT(*) AS post_count
       FROM post_insights
       WHERE account_id = $1 AND posted_at > NOW() - INTERVAL '30 days'`,
      [accountId]
    );

    const account = accountResult.rows[0] || {};
    const avgEngagement = parseFloat(engagementResult.rows[0]?.avg_engagement_rate || 0);
    const postCount = parseInt(postCountResult.rows[0]?.post_count || 0);

    res.json({
      followers: account.followers_count || 0,
      following: account.following_count || 0,
      media_count: account.media_count || 0,
      reach: account.reach || 0,
      impressions: account.impressions || 0,
      profile_views: account.profile_views || 0,
      website_clicks: account.website_clicks || 0,
      avg_engagement_rate: parseFloat(avgEngagement.toFixed(4)),
      posts_last_30_days: postCount,
      last_synced_at: account.last_synced_at,
      snapshot_date: account.date,
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to get overview' });
  }
}

async function getFollowerHistory(req, res) {
  const { accountId } = req.params;
  const { from, to } = req.query;

  try {
    const hasAccess = await checkAccountAccess(accountId, req.user.id);
    if (!hasAccess) return res.status(404).json({ error: 'Account not found' });

    let dateFilter = '';
    const params = [accountId];

    if (from) {
      params.push(from);
      dateFilter += ` AND date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      dateFilter += ` AND date <= $${params.length}`;
    }
    if (!from && !to) {
      dateFilter = ' AND date >= NOW() - INTERVAL \'30 days\'';
    }

    const result = await query(
      `SELECT date, followers_count, following_count
       FROM daily_snapshots
       WHERE account_id = $1 ${dateFilter}
       ORDER BY date ASC`,
      params
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Follower history error:', error);
    res.status(500).json({ error: 'Failed to get follower history' });
  }
}

async function getEngagementHistory(req, res) {
  const { accountId } = req.params;
  const { from, to } = req.query;

  try {
    const hasAccess = await checkAccountAccess(accountId, req.user.id);
    if (!hasAccess) return res.status(404).json({ error: 'Account not found' });

    let dateFilter = '';
    const params = [accountId];

    if (from) {
      params.push(from);
      dateFilter += ` AND date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      dateFilter += ` AND date <= $${params.length}`;
    }
    if (!from && !to) {
      dateFilter = ' AND date >= NOW() - INTERVAL \'30 days\'';
    }

    const result = await query(
      `SELECT date, reach, impressions, profile_views
       FROM daily_snapshots
       WHERE account_id = $1 ${dateFilter}
       ORDER BY date ASC`,
      params
    );

    // Also get aggregated post engagement per day
    const postEngResult = await query(
      `SELECT
        DATE(posted_at) AS date,
        SUM(like_count) AS likes,
        SUM(comment_count) AS comments,
        SUM(save_count) AS saves,
        SUM(share_count) AS shares,
        COUNT(*) AS post_count
       FROM post_insights
       WHERE account_id = $1
         AND posted_at IS NOT NULL
         ${from ? `AND DATE(posted_at) >= '${from}'` : ''}
         ${to ? `AND DATE(posted_at) <= '${to}'` : ''}
         ${(!from && !to) ? "AND posted_at > NOW() - INTERVAL '30 days'" : ''}
       GROUP BY DATE(posted_at)
       ORDER BY date ASC`,
      [accountId]
    );

    res.json({ snapshots: result.rows, postEngagement: postEngResult.rows });
  } catch (error) {
    console.error('Engagement history error:', error);
    res.status(500).json({ error: 'Failed to get engagement history' });
  }
}

async function getPosts(req, res) {
  const { accountId } = req.params;
  const { page = 1, limit = 12, sort = 'posted_at' } = req.query;

  const validSorts = ['posted_at', 'like_count', 'comment_count', 'engagement_rate', 'reach'];
  const sortColumn = validSorts.includes(sort) ? sort : 'posted_at';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const hasAccess = await checkAccountAccess(accountId, req.user.id);
    if (!hasAccess) return res.status(404).json({ error: 'Account not found' });

    const countResult = await query(
      'SELECT COUNT(*) FROM post_insights WHERE account_id = $1',
      [accountId]
    );

    const result = await query(
      `SELECT id, instagram_post_id, post_type, caption, media_url, thumbnail_url, permalink,
              like_count, comment_count, share_count, save_count, reach, impressions,
              engagement_rate, posted_at
       FROM post_insights
       WHERE account_id = $1
       ORDER BY ${sortColumn} DESC
       LIMIT $2 OFFSET $3`,
      [accountId, parseInt(limit), offset]
    );

    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
}

async function getReels(req, res) {
  const { accountId } = req.params;
  const { page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const hasAccess = await checkAccountAccess(accountId, req.user.id);
    if (!hasAccess) return res.status(404).json({ error: 'Account not found' });

    const countResult = await query(
      "SELECT COUNT(*) FROM post_insights WHERE account_id = $1 AND post_type IN ('REELS', 'VIDEO')",
      [accountId]
    );

    const result = await query(
      `SELECT id, instagram_post_id, post_type, caption, media_url, thumbnail_url, permalink,
              like_count, comment_count, share_count, save_count, reach, impressions,
              engagement_rate, posted_at
       FROM post_insights
       WHERE account_id = $1 AND post_type IN ('REELS', 'VIDEO')
       ORDER BY posted_at DESC
       LIMIT $2 OFFSET $3`,
      [accountId, parseInt(limit), offset]
    );

    res.json({
      reels: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Reels error:', error);
    res.status(500).json({ error: 'Failed to get reels' });
  }
}

module.exports = { getOverview, getFollowerHistory, getEngagementHistory, getPosts, getReels };
