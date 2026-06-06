const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v19.0';

/**
 * Get basic account info including follower counts
 */
async function getAccountInfo(igUserId, accessToken) {
  const response = await axios.get(`${BASE_URL}/${igUserId}`, {
    params: {
      fields: 'id,name,username,profile_picture_url,followers_count,following_count,media_count,biography,website',
      access_token: accessToken,
    },
  });
  return response.data;
}

/**
 * Get account insights (reach, impressions, profile views, website clicks)
 */
async function getInsights(igUserId, accessToken, period = 'day', since, until) {
  const params = {
    metric: 'reach,impressions,profile_views,website_clicks',
    period,
    access_token: accessToken,
  };
  if (since) params.since = since;
  if (until) params.until = until;

  const response = await axios.get(`${BASE_URL}/${igUserId}/insights`, { params });
  return response.data;
}

/**
 * Get media (posts) for an account
 */
async function getMedia(igUserId, accessToken, limit = 25) {
  const response = await axios.get(`${BASE_URL}/${igUserId}/media`, {
    params: {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp,shortcode',
      limit,
      access_token: accessToken,
    },
  });
  return response.data;
}

/**
 * Get insights for a specific media post
 */
async function getMediaInsights(mediaId, accessToken, mediaType = 'IMAGE') {
  // Different metrics are available for different media types
  let metrics = 'reach,impressions,saved,shares';
  if (mediaType === 'VIDEO') {
    metrics = 'reach,impressions,saved,shares,plays';
  } else if (mediaType === 'REELS') {
    metrics = 'reach,impressions,saved,shares,plays,total_interactions';
  }

  try {
    const response = await axios.get(`${BASE_URL}/${mediaId}/insights`, {
      params: {
        metric: metrics,
        access_token: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    // Some media types may not support all metrics - return what we can
    if (error.response?.status === 400) {
      try {
        const fallbackResponse = await axios.get(`${BASE_URL}/${mediaId}/insights`, {
          params: {
            metric: 'reach,impressions,saved',
            access_token: accessToken,
          },
        });
        return fallbackResponse.data;
      } catch {
        return { data: [] };
      }
    }
    throw error;
  }
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
async function getLongLivedToken(shortLivedToken) {
  const response = await axios.get(`${BASE_URL}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    },
  });
  return response.data; // { access_token, token_type, expires_in }
}

/**
 * Get Facebook pages and linked Instagram accounts for the user
 */
async function getLinkedInstagramAccount(userAccessToken) {
  // First get the user's Facebook pages
  const pagesResponse = await axios.get(`${BASE_URL}/me/accounts`, {
    params: {
      fields: 'id,name,instagram_business_account',
      access_token: userAccessToken,
    },
  });

  const pages = pagesResponse.data.data || [];
  const igAccounts = [];

  for (const page of pages) {
    if (page.instagram_business_account) {
      igAccounts.push({
        pageId: page.id,
        pageName: page.name,
        igUserId: page.instagram_business_account.id,
      });
    }
  }

  return igAccounts;
}

/**
 * Parse insights response into a flat object
 */
function parseInsights(insightsData) {
  const result = {
    reach: 0,
    impressions: 0,
    profile_views: 0,
    website_clicks: 0,
  };

  if (!insightsData?.data) return result;

  for (const metric of insightsData.data) {
    const latestValue = metric.values?.[metric.values.length - 1]?.value || 0;
    switch (metric.name) {
      case 'reach':
        result.reach = latestValue;
        break;
      case 'impressions':
        result.impressions = latestValue;
        break;
      case 'profile_views':
        result.profile_views = latestValue;
        break;
      case 'website_clicks':
        result.website_clicks = latestValue;
        break;
    }
  }

  return result;
}

/**
 * Parse media insights into a flat object
 */
function parseMediaInsights(insightsData) {
  const result = {
    reach: 0,
    impressions: 0,
    saved: 0,
    shares: 0,
  };

  if (!insightsData?.data) return result;

  for (const metric of insightsData.data) {
    result[metric.name] = metric.values?.[0]?.value || metric.value || 0;
  }

  return result;
}

module.exports = {
  getAccountInfo,
  getInsights,
  getMedia,
  getMediaInsights,
  getLongLivedToken,
  getLinkedInstagramAccount,
  parseInsights,
  parseMediaInsights,
};
