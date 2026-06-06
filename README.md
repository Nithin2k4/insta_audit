# InstaAudit - Instagram Analytics for Social Media Managers

A full-stack SaaS application for tracking Instagram analytics across multiple client accounts.

## Features

- Connect up to 25 Instagram business accounts
- Automated daily sync via Instagram Graph API (cron at 2 AM UTC)
- Follower growth, reach, impressions, and engagement charts
- Post-level analytics with sorting and pagination
- Export data as JSON or CSV
- JWT auth with refresh tokens + Meta OAuth + Google OAuth
- AES-256-GCM encrypted Instagram access token storage

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts + React Router v6
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (schema in `database/schema.sql`)
- **Auth:** JWT + Meta OAuth + Google OAuth
- **Email:** Resend

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)
- Meta Developer App (for Instagram OAuth)
- Google OAuth credentials (optional)
- Resend account (for email notifications)

### 1. Database

Run the schema against your PostgreSQL database:

```bash
psql $DATABASE_URL < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in your credentials in .env
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

### Environment Variables

**Backend `.env`:**
```
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/insta_audit
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=<64-char hex string for AES-256>
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=http://localhost:5000/api/auth/instagram/callback
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
RESEND_API_KEY=your-resend-key
FRONTEND_URL=http://localhost:5173
```

Generate an ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Meta App Setup

1. Create a Meta Developer App at https://developers.facebook.com
2. Add Instagram Graph API product
3. Add permissions: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`, `pages_show_list`
4. Set OAuth redirect URI to your `META_REDIRECT_URI`

## API Endpoints

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/instagram/oauth-url` — Get Meta OAuth URL
- `GET /api/accounts` — List connected accounts
- `GET /api/insights/:accountId/overview` — Latest metrics
- `GET /api/insights/:accountId/followers?from=&to=` — Follower history
- `GET /api/reports/export?accountId=&from=&to=&format=json|csv` — Export data
