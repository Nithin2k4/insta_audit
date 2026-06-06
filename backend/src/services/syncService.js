const cron = require('node-cron');
const { query } = require('../models/db');
const { decrypt } = require('../utils/crypto');
const { getAccountInfo, getInsights, getMedia, getMediaInsights, parseInsights, parseMediaInsights } = require('./instagramService');
const { sendTokenExpiryEmail } = require('./emailService');

async function syncAccount(account) {
  console.log(`Syncing account: ${account.username} (${account.id})`);

  try {
    // Decrypt access token
    const accessToken = decrypt(
      account.access_token_encrypted,
      account.token_iv,
      account.token_auth_tag
    );

    // Check token expiry
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      await markAccountInactive(account);
      return;
    }

    // Fetch account info
    const info = await getAccountInfo(account.instagram_user_id, accessToken);

    // Update account stats
    await query(
      `UPDATE instagram_accounts
       SET followers_count = $1, following_count = $2, media_count = $3, last_synced_at = NOW()
       WHERE id = $4`,
      [info.followers_count || 0, info.following_count || 0, info.media_count || 0, account.id]
    );

    // Fetch insights
    const insightsData = await getInsights(account.instagram_user_id, accessToken);
    const insights = parseInsights(insightsData);

    // Save daily snapshot (upsert)
    const today = new Date().toISOString().split('T')[0];
    await query(
      `INSERT INTO daily_snapshots
        (account_id, date, followers_count, following_count, media_count, reach, impressions, profile_views, website_clicks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (account_id, date) DO UPDATE SET
         followers_count = EXCLUDED.followers_count,
         following_count = EXCLUDED.following_count,
         media_count = EXCLUDED.media_count,
         reach = EXCLUDED.reach,
         impressions = EXCLUDED.impressions,
         profile_views = EXCLUDED.profile_views,
         website_clicks = EXCLUDED.website_clicks`,
      [
        account.id,
        today,
        info.followers_count || 0,
        info.following_count || 0,
        info.media_count || 0,
        insights.reach,
        insights.impressions,
        insights.profile_views,
        insights.website_clicks,
      ]
    );

    // Fetch media posts
    const mediaData = await getMedia(account.instagram_user_id, accessToken, 50);
    const posts = mediaData.data || [];

    for (const post of posts) {
      try {
        // Get per-post insights
        const mediaInsightsData = await getMediaInsights(post.id, accessToken, post.media_type);
        const mediaInsights = parseMediaInsights(mediaInsightsData);

        const engagementRate = info.followers_count
          ? ((post.like_count || 0) + (post.comments_count || 0) + (mediaInsights.saved || 0)) /
            info.followers_count
          : 0;

        await query(
          `INSERT INTO post_insights
            (account_id, instagram_post_id, post_type, caption, media_url, thumbnail_url, permalink,
             like_count, comment_count, share_count, save_count, reach, impressions, engagement_rate, posted_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (account_id, instagram_post_id) DO UPDATE SET
             like_count = EXCLUDED.like_count,
             comment_count = EXCLUDED.comment_count,
             share_count = EXCLUDED.share_count,
             save_count = EXCLUDED.save_count,
             reach = EXCLUDED.reach,
             impressions = EXCLUDED.impressions,
             engagement_rate = EXCLUDED.engagement_rate,
             updated_at = NOW()`,
          [
            account.id,
            post.id,
            post.media_type || 'IMAGE',
            post.caption || null,
            post.media_url || null,
            post.thumbnail_url || null,
            post.permalink || null,
            post.like_count || 0,
            post.comments_count || 0,
            mediaInsights.shares || 0,
            mediaInsights.saved || 0,
            mediaInsights.reach || 0,
            mediaInsights.impressions || 0,
            parseFloat(engagementRate.toFixed(6)),
            post.timestamp ? new Date(post.timestamp) : null,
          ]
        );
      } catch (postError) {
        console.error(`Failed to sync post ${post.id}:`, postError.message);
      }
    }

    // Log success
    await query(
      'INSERT INTO sync_logs (account_id, status, message) VALUES ($1, $2, $3)',
      [account.id, 'success', `Synced ${posts.length} posts`]
    );

    console.log(`Successfully synced account: ${account.username}`);
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    console.error(`Sync failed for ${account.username}:`, message);

    // Check if token is invalid
    if (error.response?.data?.error?.code === 190) {
      await markAccountInactive(account);
    } else {
      await query(
        'INSERT INTO sync_logs (account_id, status, message) VALUES ($1, $2, $3)',
        [account.id, 'error', message]
      );
    }
  }
}

async function markAccountInactive(account) {
  await query(
    'UPDATE instagram_accounts SET is_active = FALSE WHERE id = $1',
    [account.id]
  );

  await query(
    "INSERT INTO sync_logs (account_id, status, message) VALUES ($1, $2, $3)",
    [account.id, 'error', 'Access token expired. Account marked inactive.']
  );

  // Get user email to notify
  try {
    const userResult = await query(
      'SELECT u.email, u.name FROM users u JOIN instagram_accounts a ON a.user_id = u.id WHERE a.id = $1',
      [account.id]
    );
    if (userResult.rows.length > 0) {
      const { email, name } = userResult.rows[0];
      await sendTokenExpiryEmail(email, name, account.username);
    }
  } catch (e) {
    console.error('Failed to send expiry email:', e.message);
  }
}

async function syncAllActiveAccounts() {
  console.log('Starting daily sync for all active accounts...');
  try {
    const result = await query(
      'SELECT * FROM instagram_accounts WHERE is_active = TRUE'
    );

    const accounts = result.rows;
    console.log(`Found ${accounts.length} active accounts to sync`);

    for (const account of accounts) {
      await syncAccount(account);
      // Small delay between accounts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('Daily sync completed');
  } catch (error) {
    console.error('Daily sync failed:', error.message);
  }
}

function startSyncScheduler() {
  // Run daily at 2 AM UTC
  cron.schedule('0 2 * * *', syncAllActiveAccounts, {
    timezone: 'UTC',
  });
  console.log('Sync scheduler configured for 2 AM UTC daily');
}

module.exports = { syncAccount, syncAllActiveAccounts, startSyncScheduler };
