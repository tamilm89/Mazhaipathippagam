# Pre-Deployment Checklist

## ✅ Completed Setup

### Backend (API)
- [x] Serverless function entry: `server/api/index.js`
- [x] Vercel config: `server/vercel.json`
- [x] Prisma schema: `server/prisma/schema.prisma`
- [x] Database client: `server/lib/db.js`
- [x] All routes migrated to Prisma:
  - [x] `server/routes/auth.js`
  - [x] `server/routes/products.js`
  - [x] `server/routes/orders.js`
- [x] Notifications service: `server/services/notifications.js`
- [x] Migration script: `server/scripts/migrate-json-to-db.js`
- [x] Environment template: `server/.env.example`
- [x] Package.json with Prisma auto-generation

### Frontends
- [x] Shop Vercel config: `shop/vercel.json`
- [x] Shop env example: `shop/.env.example`
- [x] Admin Vercel config: `admin/vercel.json`
- [x] Admin env example: `admin/.env.example`
- [x] Both frontends use `VITE_API_BASE` env var

### Documentation
- [x] README.md with deployment instructions
- [x] DEPLOY.md with step-by-step Vercel guide

## 🚀 Ready to Deploy

Your codebase is production-ready. Here's what to do:

### Step 1: Push to Git
```powershell
cd d:\workspace\tamil\Mazhipathippagam_firebase

# Initialize if not already done
git init
git add .
git commit -m "Production-ready: Vercel + Postgres + Notifications"

# Add your GitHub repo
git remote add origin https://github.com/YOURUSERNAME/YOURREPO.git
git branch -M main
git push -u origin main
```

### Step 2: Create Vercel Projects

Import your repo 3 times in Vercel dashboard:

**Project 1: Shop**
```
Name: mazhipathippagam-shop
Root Directory: shop
Build Command: npm run build
Output Directory: dist
Environment Variables:
  VITE_API_BASE = (leave empty for now, update after API is deployed)
```

**Project 2: Admin**
```
Name: mazhipathippagam-admin
Root Directory: admin
Build Command: npm run build
Output Directory: dist
Environment Variables:
  VITE_API_BASE = (leave empty for now, update after API is deployed)
```

**Project 3: API**
```
Name: mazhipathippagam-api
Root Directory: server
Framework Preset: Other
Environment Variables (add these):
  JWT_SECRET = (generate a strong secret)
  SENDGRID_API_KEY = (optional, for emails)
  EMAIL_FROM = no-reply@yourdomain.com
  TWILIO_ACCOUNT_SID = (optional, for SMS)
  TWILIO_AUTH_TOKEN = (optional)
  TWILIO_FROM = (optional, e.g., +12025551234)
  TWILIO_WHATSAPP_FROM = (optional, e.g., whatsapp:+14155238886)
  DEFAULT_COUNTRY_CODE = +91
```

### Step 3: Add Vercel Postgres

In your **API project**:
1. Go to Storage tab
2. Click "Create Database"
3. Select "Postgres"
4. Vercel auto-injects `DATABASE_URL`

### Step 4: Update Frontend URLs

After API deploys, copy its URL (e.g., `https://mazhipathippagam-api.vercel.app`)

Update environment variables in **both frontend projects**:
```
VITE_API_BASE = https://mazhipathippagam-api.vercel.app
```

Redeploy frontends (Vercel → Deployments → three dots → Redeploy)

### Step 5: Run Database Migrations

**Option A: From Vercel CLI** (recommended if local install fails)
```powershell
npm install -g vercel
vercel login
vercel link  # select your API project
vercel env pull .env

cd server
npx prisma migrate deploy
node scripts/migrate-json-to-db.js
```

**Option B: From Vercel Dashboard**
- Go to API project → Settings → Environment Variables
- Copy `DATABASE_URL` value
- Run locally:
```powershell
cd server
$env:DATABASE_URL="your-copied-url"
npx prisma migrate deploy
node scripts/migrate-json-to-db.js
```

### Step 6: Test

1. Visit shop URL → Register → Add products to cart → Place order
2. Visit admin URL → Login (`admin@local` / `admin`) → View/update orders
3. Check email/SMS if you configured Twilio/SendGrid

## 🔧 Environment Variables Summary

### API (server)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Auto-injected by Vercel Postgres |
| `JWT_SECRET` | Yes | Strong secret for JWT signing |
| `SENDGRID_API_KEY` | Optional | For email notifications |
| `EMAIL_FROM` | Optional | Sender email address |
| `TWILIO_ACCOUNT_SID` | Optional | For SMS/WhatsApp |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio auth token |
| `TWILIO_FROM` | Optional | Twilio phone number |
| `TWILIO_WHATSAPP_FROM` | Optional | WhatsApp sender |
| `DEFAULT_COUNTRY_CODE` | Optional | Phone prefix (e.g., +91) |

### Shop & Admin
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE` | Yes | API URL (e.g., https://your-api.vercel.app) |

## 🎯 Post-Deployment

- [ ] Add custom domains
- [ ] Test order flow end-to-end
- [ ] Configure SendGrid/Twilio for production
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Add rate limiting
- [ ] Configure CORS for production domains

## 📝 Notes

- Local Prisma install fails due to network/SSL issues → This is fine, Vercel will install it
- JSON files in `server/data/` are backups → Migrate them once with the script
- Admin seeded user: `admin@local` / `admin` → Change password after first login
- All write endpoints require `DATABASE_URL` → Reads work without it (fallback to JSON)

## 🆘 Troubleshooting

**"Cannot find module @prisma/client"**
- Run `npx prisma generate` after migrations
- Vercel does this automatically via postinstall script

**503 on create/update endpoints**
- DATABASE_URL not set
- Verify Vercel Postgres is linked to API project

**CORS errors**
- Add frontend domains to CORS whitelist in `server/app.js`

**Notifications not sending**
- Check SENDGRID_API_KEY / TWILIO credentials
- Review logs in Vercel dashboard for error details
