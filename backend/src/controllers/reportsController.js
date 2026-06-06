const { query } = require('../models/db');

function toCSV(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    });
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

async function exportData(req, res) {
  const { accountId, from, to, format = 'json' } = req.query;

  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  try {
    // Verify ownership
    const accountResult = await query(
      'SELECT id, username FROM instagram_accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];
    const params = [accountId];
    let dateFilter = '';

    if (from) {
      params.push(from);
      dateFilter += ` AND date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      dateFilter += ` AND date <= $${params.length}`;
    }
    if (!from && !to) {
      dateFilter = " AND date >= NOW() - INTERVAL '30 days'";
    }

    const snapshotsResult = await query(
      `SELECT date, followers_count, following_count, reach, impressions, profile_views, website_clicks
       FROM daily_snapshots
       WHERE account_id = $1 ${dateFilter}
       ORDER BY date ASC`,
      params
    );

    // Post insights with date filter
    const postParams = [accountId];
    let postDateFilter = '';
    if (from) {
      postParams.push(from);
      postDateFilter += ` AND DATE(posted_at) >= $${postParams.length}`;
    }
    if (to) {
      postParams.push(to);
      postDateFilter += ` AND DATE(posted_at) <= $${postParams.length}`;
    }
    if (!from && !to) {
      postDateFilter = " AND posted_at > NOW() - INTERVAL '30 days'";
    }

    const postsResult = await query(
      `SELECT instagram_post_id, post_type, caption, permalink, like_count, comment_count,
              share_count, save_count, reach, impressions, engagement_rate, posted_at
       FROM post_insights
       WHERE account_id = $1 ${postDateFilter}
       ORDER BY posted_at DESC`,
      postParams
    );

    const exportData = {
      account: { id: accountId, username: account.username },
      exported_at: new Date().toISOString(),
      from: from || null,
      to: to || null,
      snapshots: snapshotsResult.rows,
      posts: postsResult.rows,
    };

    if (format === 'csv') {
      const snapshotsCSV = toCSV(snapshotsResult.rows);
      const postsCSV = toCSV(postsResult.rows);
      const csv = `# Daily Snapshots\n${snapshotsCSV}\n\n# Post Insights\n${postsCSV}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${account.username}_export.csv"`);
      return res.send(csv);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${account.username}_export.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
}

module.exports = { exportData };
