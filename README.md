# Gaanbajana

Musical instruments ecommerce for India — Next.js + MongoDB + Cloudinary admin CMS. Cashfree and Shiprocket keys come after hosting (you need a live site URL).

## Quick start

```bash
npm install
cp .env.example .env.local
# add MONGODB_URI, JWT_SECRET, Cloudinary, Resend (leave Cashfree/Shiprocket empty for now)
npm run seed
npm run dev
```

Full key checklist: see [SETUP.md](./SETUP.md).

## Stack

- Next.js App Router + TypeScript + Tailwind
- MongoDB / Mongoose
- Cloudinary media
- Resend transactional email
- Cashfree Payment Gateway (deferred until live URL)
- Shiprocket shipping API (deferred until live URL)
