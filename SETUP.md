# Gaanbajana — what you need to do

Copy `.env.example` to `.env.local` and fill keys in this order.

**Do now** → MongoDB, JWT, Cloudinary, Resend → seed → run locally  
**Then** → GitHub → host  
**Later** → Cashfree + Shiprocket (need your live website URL for webhooks / return URLs)

Checkout already errors clearly if Cashfree keys are empty; Shiprocket is skipped until credentials are set.

---

## Do now

### 1. MongoDB Atlas (required)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Database Access → create user
3. Network Access → allow your IP (or `0.0.0.0/0` for Vercel)
4. Connect → Drivers → copy URI into `MONGODB_URI`

### 2. App secret + admin seed user

- `JWT_SECRET` — long random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — used only by `npm run seed`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local

### 2b. Google sign-in (optional)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth client (Web)
2. Authorized redirect URI: `{NEXT_PUBLIC_APP_URL}/api/auth/google/callback`  
   (local: `http://localhost:3000/api/auth/google/callback`, plus your Vercel URL)
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` (and Vercel)
4. Restart `npm run dev` — “Continue with Google” appears on Login / Register

Without these, email/password login still works; the Google button stays hidden.

### 3. Cloudinary (admin image upload)

1. [cloudinary.com](https://cloudinary.com) → Dashboard
2. Copy Cloud name, API Key, API Secret → `CLOUDINARY_*`

Without these, you can still paste image URLs on products.

### 4. Resend email (recommended)

1. [resend.com](https://resend.com) → API key
2. Verify a sending domain (or use onboarding domain for tests)
3. Set `RESEND_API_KEY` and `EMAIL_FROM`

### 5. Seed and run locally

```bash
cp .env.example .env.local
# fill MONGODB_URI, JWT_SECRET, CLOUDINARY_*, RESEND_* (Cashfree/Shiprocket can stay empty)
npm run seed
npm run dev
```

Default admin (change after first login):

- Email: `admin@gaanbajana.com`
- Password: `ChangeMe123!`

- Store: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Then: GitHub + host

1. Push the repo to GitHub (do **not** commit `.env.local`)
2. Import in Vercel (or similar) → add env vars you filled for now:
   - `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `RESEND_*`, `EMAIL_FROM`, `ADMIN_*` if needed
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for Google login
3. Set `NEXT_PUBLIC_APP_URL` to your live domain (e.g. `https://gaanabajana.vercel.app`)
   - If using Google, add the same live callback URI in Google Cloud
4. **MongoDB Atlas → Network Access → Add IP → Allow Access from Anywhere (`0.0.0.0/0`)**  
   Vercel uses many IPs; without this, catalog/API pages return errors.
5. Redeploy after saving env vars (Deployments → … → Redeploy)
6. Open `https://YOUR_DOMAIN/api/health` — `mongoOk` must be `true`
7. From your laptop (with the same Atlas `MONGODB_URI` in `.env.local`), run `npm run seed` once if the hosted DB is empty
8. Deploy and confirm products/categories appear on the home page

If pages say “This page couldn’t load”, catalog routes are crashing because Mongo is missing or blocked — fix steps 2–4 first.
---

## Later (after live URL): Cashfree + Shiprocket

Fill these when the site is live and you have a public domain.

### Cashfree payments

1. Sign up at [merchant.cashfree.com](https://merchant.cashfree.com)
2. Developers → API Keys → **App ID** + **Secret Key** (start in **Sandbox**)
3. Set:
   - `CASHFREE_APP_ID`
   - `CASHFREE_SECRET_KEY`
   - `CASHFREE_ENV=sandbox` (then `production` for live)
4. Webhooks → `https://YOUR_DOMAIN/api/webhooks/cashfree`
5. Optional: `CASHFREE_WEBHOOK_SECRET`
6. Enable UPI (includes PhonePe as a customer UPI app), cards, netbanking

### Shiprocket shipping

1. Seller account at [shiprocket.in](https://www.shiprocket.in)
2. Settings → **Pickup Address** → note the **exact pickup location name**
3. Settings → API → **Create API User**
4. Set `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`
5. After a **paid** Cashfree order, the app creates a Shiprocket adhoc order
6. Admin → Orders → **Push Shiprocket** to retry if needed

---

## Admin checklist after seed

| Task | Where |
|------|--------|
| Change hero text / phone / free shipping | Admin → CMS |
| Edit About, FAQs, policies | Admin → CMS → page content |
| Upload product photos | Admin → Media (or paste URLs on products) |
| Add real catalog | Admin → Products / Categories |
| Approve reviews | Admin → Reviews |
| Retry shipping (after Shiprocket keys) | Admin → Orders → Push Shiprocket |

## Flow reminder (once Cashfree + Shiprocket are live)

Cart → Checkout → Cashfree pay → webhook / success page verifies → order marked **paid** → Shiprocket order created → customer tracks via Account or Track Order.
