-- InstaAudit PostgreSQL Schema
-- Compatible with Supabase and standard PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Instagram accounts table (max 25 per user enforced at app level)
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_picture_url TEXT,
  access_token_encrypted TEXT NOT NULL,
  token_iv VARCHAR(255) NOT NULL,
  token_auth_tag VARCHAR(255) NOT NULL,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, instagram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_instagram_user_id ON instagram_accounts(instagram_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_is_active ON instagram_accounts(is_active);

-- Daily snapshots table
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_snapshots_account_id ON daily_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_account_date ON daily_snapshots(account_id, date DESC);

-- Post insights table
CREATE TABLE IF NOT EXISTS post_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  instagram_post_id VARCHAR(255) NOT NULL,
  post_type VARCHAR(50) DEFAULT 'IMAGE',
  caption TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  permalink TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, instagram_post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_insights_account_id ON post_insights(account_id);
CREATE INDEX IF NOT EXISTS idx_post_insights_instagram_post_id ON post_insights(instagram_post_id);
CREATE INDEX IF NOT EXISTS idx_post_insights_posted_at ON post_insights(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_insights_engagement_rate ON post_insights(engagement_rate DESC);

-- Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_account_id ON sync_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_synced_at ON sync_logs(synced_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_accounts_updated_at
  BEFORE UPDATE ON instagram_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_insights_updated_at
  BEFORE UPDATE ON post_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: account summary with latest snapshot
CREATE OR REPLACE VIEW account_summary AS
SELECT
  a.id,
  a.user_id,
  a.instagram_user_id,
  a.username,
  a.name,
  a.profile_picture_url,
  a.is_active,
  a.followers_count,
  a.following_count,
  a.media_count,
  a.last_synced_at,
  s.reach AS latest_reach,
  s.impressions AS latest_impressions,
  s.profile_views AS latest_profile_views,
  s.date AS snapshot_date
FROM instagram_accounts a
LEFT JOIN LATERAL (
  SELECT * FROM daily_snapshots
  WHERE account_id = a.id
  ORDER BY date DESC
  LIMIT 1
) s ON true;
