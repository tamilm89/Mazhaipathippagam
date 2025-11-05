# Mazhipathippagam — Book Seller and Publisher

This workspace contains three parts:

- `shop` — Customer-facing storefront (React + Vite)
- `admin` — Back-office admin panel (React + Vite)
- `server` — Simple Express API used for development (products, auth, orders)

How to run locally (Windows PowerShell)

1) Start the backend server

```powershell
cd d:\workspace\tamil\Mazhipathippagam\server
npm install
npm start
```

This will start the server on http://localhost:4000 and expose APIs under `/api/*`.

2) Start the shop frontend

```powershell
cd d:\workspace\tamil\Mazhipathippagam\shop
npm install
npm run dev
```

3) Start the admin frontend

```powershell
cd d:\workspace\tamil\Mazhipathippagam\admin
npm install
npm run dev
```

Notes

- The server uses simple JSON files in `server/data/` for persistence and performs server-side validation for shipping and payment during order creation. This is a development stub, not production-ready.
- Next steps: wire the frontends to call the server endpoints (I can update the shop/admin utils to use the API), add secure auth, and replace JSON-file persistence with a real database.

## Notifications (Email/SMS/WhatsApp)

The API now supports sending order notifications on creation and when admins update status/tracking. It integrates with SendGrid (email) and Twilio (SMS/WhatsApp). If credentials are not provided, it safely no-ops.

Environment variables (set where the API runs):

- SENDGRID_API_KEY
- EMAIL_FROM (e.g. no-reply@yourdomain.com)
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM (E.164 phone or Messaging Service SID)
- TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886)
- DEFAULT_COUNTRY_CODE (e.g. +91 — used to format 10-digit phones into E.164)

Behavior:

- On POST `/api/orders`, the server sends to the buyer:
	- Email to the authenticated user email
	- SMS/WhatsApp to `shipping.phone` if configured
- On PUT `/api/orders/:id` by admin (status or tracking changes), it notifies the buyer email and shipping phone.

Tip: For local testing without sending messages, leave env vars unset; logs will show that notifications were skipped.

## Deploy to Vercel (Frontends)

This repo has two Vite apps: `shop/` and `admin/`. Create two Vercel projects from the same repo.

1) Push the repo to GitHub/GitLab/Bitbucket
2) In Vercel → New Project → Import this repo
	 - Project A (Shop)
		 - Root Directory: `shop`
		 - Framework: Vite (auto-detected)
		 - Build Command: `npm run build`
		 - Output Directory: `dist`
		 - Environment Variables:
			 - `VITE_API_BASE` = your API URL (e.g., `https://api.yourdomain.com`)
	 - Project B (Admin)
		 - Root Directory: `admin`
		 - Same build/output; set `VITE_API_BASE` as above

Client-side routing is supported via `vercel.json` in each frontend (rewrites all paths to `/`).

## Backend hosting

Option A (quick): keep the Express API on Render/Railway/Cloud Run.

- Set env vars:
  - `DATABASE_URL` (Postgres connection string)
  - `PORT` (Render auto-provides)
  - `JWT_SECRET`
  - `SENDGRID_API_KEY`, `EMAIL_FROM`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `TWILIO_WHATSAPP_FROM`
  - `DEFAULT_COUNTRY_CODE`
- Point your Vercel frontends to it via `VITE_API_BASE`.

Option B (all-in Vercel): deploy the API as Serverless Functions.

- Create a third Vercel project with Root Directory: `server`
- The function entry is `server/api/index.js` (all `/api/*` are routed there via `server/vercel.json`)
- Env vars on Vercel (project: server):
  - `DATABASE_URL` (use Vercel Postgres or Neon)
  - `JWT_SECRET`
  - `SENDGRID_API_KEY`, `EMAIL_FROM`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `TWILIO_WHATSAPP_FROM`
  - `DEFAULT_COUNTRY_CODE`

## Database setup (Postgres + Prisma)

The API now uses Prisma with Postgres for production. Local dev can still use JSON files if `DATABASE_URL` is not set (reads work; writes are disabled).

### Setup Vercel Postgres

1. In your Vercel project (server), go to Storage → Create Database → Postgres
2. Vercel auto-injects `DATABASE_URL` into your serverless functions
3. Run migrations from your local machine (or CI):

```powershell
cd server
npm install
$env:DATABASE_URL="postgres://..."  # copy from Vercel dashboard
npx prisma migrate dev --name init
```

4. Import existing JSON data:

```powershell
node scripts/migrate-json-to-db.js
```

5. Deploy; the API will use Postgres on Vercel.

### Local dev with Postgres (optional)

Create `server/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mazhipathippagam"
JWT_SECRET="dev_secret"
```

Run migrations and start:

```powershell
cd server
npx prisma migrate dev
npm start
```

### Prisma commands

- `npx prisma migrate dev` — create and apply migrations
- `npx prisma studio` — open visual DB browser
- `npx prisma generate` — regenerate client after schema changes
