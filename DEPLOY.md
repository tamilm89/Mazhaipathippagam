# Vercel Deployment Guide

## Quick Deploy (3 projects)

### 1. Push to GitHub
```powershell
git init
git add .
git commit -m "Initial commit with Vercel + Postgres support"
git remote add origin https://github.com/yourusername/yourrepo.git
git push -u origin main
```

### 2. Create Vercel Projects

#### Project A: Shop Frontend
- Import repo → Set Root Directory: `shop`
- Build Command: `npm run build`
- Output Directory: `dist`
- Add Environment Variable:
  - `VITE_API_BASE` = `https://your-api-project.vercel.app` (update after creating API project)

#### Project B: Admin Frontend
- Import same repo → Set Root Directory: `admin`
- Build Command: `npm run build`
- Output Directory: `dist`
- Add Environment Variable:
  - `VITE_API_BASE` = `https://your-api-project.vercel.app`

#### Project C: API (Server)
- Import same repo → Set Root Directory: `server`
- Framework Preset: Other
- Build Command: leave empty (serverless functions auto-detect)
- Environment Variables:
  - `JWT_SECRET` = `your-strong-secret-here-change-me`
  - `SENDGRID_API_KEY` = your SendGrid API key (optional)
  - `EMAIL_FROM` = `no-reply@yourdomain.com` (optional)
  - `TWILIO_ACCOUNT_SID` = your Twilio SID (optional)
  - `TWILIO_AUTH_TOKEN` = your Twilio auth token (optional)
  - `TWILIO_FROM` = your Twilio phone number (optional)
  - `TWILIO_WHATSAPP_FROM` = `whatsapp:+14155238886` (optional)
  - `DEFAULT_COUNTRY_CODE` = `+91`

### 3. Add Vercel Postgres to API Project

- In your API project dashboard → Storage tab
- Click "Create Database" → Select "Postgres"
- Vercel automatically injects `DATABASE_URL` as an environment variable

### 4. Run Database Migrations

From your local machine (or CI):

```powershell
cd server

# Get DATABASE_URL from Vercel dashboard (API project → Storage → Postgres → .env.local tab)
$env:DATABASE_URL="postgres://default:xxx@xxx-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"

# Note: Prisma install will fail locally due to network issues
# Just copy the DATABASE_URL for now

# You'll run this from a machine with stable internet or skip it and let Vercel handle migrations
```

**Alternative: Run migrations from Vercel CLI**

If local install fails, use Vercel CLI:

```powershell
npm install -g vercel
vercel login
vercel link  # Link to your API project
vercel env pull .env  # Download env vars including DATABASE_URL

# Now run migrations
cd server
npx prisma migrate dev --name init
node scripts/migrate-json-to-db.js
```

### 5. Deploy & Test

- Vercel auto-deploys on git push
- Visit your shop URL, register, place an order
- Visit admin URL, login with `admin@local` / `admin`, manage orders
- Notifications send if Twilio/SendGrid configured

## Custom Domains (Optional)

- Shop: `yourdomain.com`
- Admin: `admin.yourdomain.com`
- API: `api.yourdomain.com`

Add these in each project's Settings → Domains.

## Troubleshooting

### Prisma install fails locally
- This is a local network/SSL issue
- Vercel will install it successfully during deployment
- To test locally, use a VPN or retry from a different network

### DATABASE_URL not found
- Make sure Vercel Postgres is created in the same project as your API
- Check Environment Variables tab; `DATABASE_URL` should be auto-injected

### 503 errors for create/update
- Means DATABASE_URL is not set
- Double-check Vercel Postgres is linked and deployed

### CORS errors
- Add your frontend domains to CORS in `server/app.js` if needed
- Current setup uses `cors()` which allows all origins in dev

## Next Steps

1. Add custom domains
2. Configure SendGrid for email notifications
3. Configure Twilio for SMS/WhatsApp
4. Set up monitoring (Vercel Analytics, Sentry)
5. Add rate limiting for production
