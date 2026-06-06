const { query } = require('../models/db');
const { decrypt } = require('../utils/crypto');
const { syncAccount } = require('../services/syncService');

async function listAccounts(req, res) {
  try {
    const result = await query(
      `SELECT
        a.id, a.instagram_user_id, a.username, a.name, a.profile_picture_url,
        a.is_active, a.followers_count, a.following_count, a.media_count, a.last_synced_at,
        a.created_at,
        s.reach AS latest_reach,
        s.impressions AS latest_impressions,
        s.profile_views AS latest_profile_views,
        s.date AS snapshot_date
       FROM instagram_accounts a
       LEFT JOIN LATERAL (
         SELECT * FROM daily_snapshots WHERE account_id = a.id ORDER BY date DESC LIMIT 1
       ) s ON true
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json({ accounts: result.rows });
  } catch (error) {
    console.error('List accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}

async function deleteAccount(req, res) {
  const { id } = req.params;
  try {
    const result = await query(
      'DELETE FROM instagram_accounts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
}

async function triggerSync(req, res) {
  const { id } = req.params;
  try {
    const result = await query(
      'SELECT * FROM instagram_accounts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = result.rows[0];
    if (!account.is_active) {
      return res.status(400).json({ error: 'Account is inactive. Please reconnect it first.' });
    }

    // Run sync in background
    syncAccount(account).catch((err) => console.error('Sync error:', err));

    res.json({ message: 'Sync started', accountId: id });
  } catch (error) {
    console.error('Trigger sync error:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
}

async function getAccountSummary(req, res) {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT
        a.id, a.instagram_user_id, a.username, a.name, a.profile_picture_url,
        a.is_active, a.followers_count, a.following_count, a.media_count, a.last_synced_at,
        s.reach, s.impressions, s.profile_views, s.website_clicks, s.date AS snapshot_date
       FROM instagram_accounts a
       LEFT JOIN LATERAL (
         SELECT * FROM daily_snapshots WHERE account_id = a.id ORDER BY date DESC LIMIT 1
       ) s ON true
       WHERE a.id = $1 AND a.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ account: result.rows[0] });
  } catch (error) {
    console.error('Account summary error:', error);
    res.status(500).json({ error: 'Failed to get account summary' });
  }
}

async function syncAllAccounts(req, res) {
  try {
    const result = await query(
      'SELECT * FROM instagram_accounts WHERE user_id = $1 AND is_active = TRUE',
      [req.user.id]
    );

    const accounts = result.rows;
    if (accounts.length === 0) {
      return res.json({ message: 'No active accounts to sync' });
    }

    // Run all syncs in background
    Promise.allSettled(accounts.map((acc) => syncAccount(acc))).catch(() => {});

    res.json({ message: `Sync started for ${accounts.length} account(s)` });
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
}

module.exports = { listAccounts, deleteAccount, triggerSync, getAccountSummary, syncAllAccounts };
