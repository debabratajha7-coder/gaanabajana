# Gaanabajana — what you need to do

Copy `.env.example` to `.env.local` and fill keys in this order.

**Do now** → MongoDB, JWT, Cloudinary, Resend, Twilio → seed → run locally  
**Then** → GitHub → host  
**Later** → PhonePe + Shiprocket (need your live website URL for webhooks / return URLs)

Checkout already errors clearly if PhonePe keys are empty; Shiprocket is skipped until credentials are set.

Signup: phone OTP (Twilio) → profile + password → email OTP (Resend).  
Admin login: email + password → SMS OTP. Main admin assigns staff panel permissions under Admin → Users & staff.

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
4. Used for signup email OTP + order emails

### 4b. Twilio SMS (phone OTP + admin 2FA)

1. [console.twilio.com](https://console.twilio.com) → Account SID, Auth Token, and a From number
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
3. Set `ADMIN_PHONE=+91XXXXXXXXXX` before `npm run seed` so the main admin can receive login OTPs
4. Without Twilio in local/dev, OTPs are printed in the server console (and shown on-screen in development)

### 5. Seed and run locally

```bash
cp .env.example .env.local
# fill MONGODB_URI, JWT_SECRET, CLOUDINARY_*, RESEND_*, TWILIO_* (PhonePe/Shiprocket can stay empty)
npm run seed
npm run dev
```

Default admin (change after first login):

- Email: `admin@gaanbajana.com`
- Password: `ChangeMe123!`
- Phone: whatever you set in `ADMIN_PHONE`

- Store: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Then: GitHub + host

1. Push the repo to GitHub (do **not** commit `.env.local`)
2. Import in Vercel (or similar) → add env vars you filled for now:
   - `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `RESEND_*`, `TWILIO_*`, `EMAIL_FROM`, `ADMIN_*` if needed
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

## Before PhonePe approval

Your live site must look complete (not under construction):

1. Run `npm run prepare:policies` (upserts Terms, Privacy, Refund/Cancellation, Shipping, Contact + restocks products if the catalog is thin)
2. Confirm footer links work on production: Contact, Shipping, Refund & Cancellation, Privacy, Terms
3. Confirm Contact shows phone, email, and address
4. Confirm products show clear prices and Add to cart / Checkout works
5. Then apply in PhonePe Business with your live domain

---

## Later (after live URL): PhonePe + Shiprocket

Fill these when the site is live and you have a public domain.

### PhonePe payments

1. Sign up at [business.phonepe.com](https://business.phonepe.com) / [developer.phonepe.com](https://developer.phonepe.com)
2. Payment Gateway → create app → copy **Client ID**, **Client Secret**, **Client Version** (start in **Sandbox**)
3. Set:
   - `PHONEPE_CLIENT_ID`
   - `PHONEPE_CLIENT_SECRET`
   - `PHONEPE_CLIENT_VERSION=1`
   - `PHONEPE_ENV=sandbox` (then `production` for live)
4. Configure S2S callback URL → `https://YOUR_DOMAIN/api/webhooks/phonepe`
5. Optional (recommended): set callback username/password in dashboard → `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD`
6. Enable UPI, cards, netbanking on the PhonePe checkout page

### Shiprocket shipping

1. Seller account at [shiprocket.in](https://www.shiprocket.in)
2. Settings → **Pickup Address** → note the **exact pickup location name**
3. Settings → API → **Create API User**
4. Set `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`
5. After a **paid** PhonePe order, the app creates a Shiprocket adhoc order
6. Admin → Orders → **Push Shiprocket** to retry if needed

#### Tracking webhooks + email updates

1. Invent a long random token → `SHIPROCKET_WEBHOOK_TOKEN` in `.env.local` / Vercel
2. Shiprocket → Settings → API → **Webhooks**:
   - URL: `https://YOUR_DOMAIN/api/webhooks/fulfillment`  
     (do **not** put “shiprocket”, “sr”, or “kr” in the path — Shiprocket rejects those)
   - Auth type: Authorization (or x-api-key) → paste the **same** token
   - Enable → Save → Test Webhook
3. On each **new** courier status, the order timeline updates and the customer gets an email via Resend
4. Customers track at `/track-order` (order number + checkout phone)

---

## Admin checklist after seed

| Task | Where |
|------|--------|
| Change hero text / phone / free shipping | Admin → CMS |
| Edit About, FAQs, policies | Admin → CMS → page content |
| Upload product photos | Admin → Media (or paste URLs on products) |
| Add real catalog | Admin → Products / Categories |
| Approve reviews | Admin → Reviews |
| Add comments on a product | Admin → Add a product → Step 5 · Comments |
| Retry shipping (after Shiprocket keys) | Admin → Orders → Push Shiprocket |

## Flow reminder (once PhonePe + Shiprocket are live)

Cart → Checkout → PhonePe pay page → webhook / success page verifies → order marked **paid** → Shiprocket order created → customer tracks via Account or Track Order.
