# MarketPlace — Multi-Vendor E-Commerce (MERN)

A full-stack multi-vendor e-commerce app: buyers shop a shared catalog from many
independent sellers, sellers manage their own products and fulfillment, and
admins manage users/products/orders platform-wide.

## Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT (HTTP-only cookie), bcryptjs
- **Frontend:** React, React Router DOM, Axios, Tailwind CSS, Vite

## Project structure

```
backend/    Express API (MVC-style: models, controllers, routes, middleware)
frontend/   React app (Vite)
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB deployment that supports **multi-document transactions** —
  a local replica set, or a free MongoDB Atlas cluster. Checkout and order
  cancellation use `session.withTransaction()`, which a standalone
  `mongod` does not support.

  Quickest option: create a free cluster at https://www.mongodb.com/cloud/atlas
  and use its connection string as `MONGO_URI`.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI (must support transactions) and JWT_SECRET
npm install
npm run dev        # nodemon, or `npm start` for a plain node run
```

The API runs on `http://localhost:5000` by default and health-checks at
`GET /api/v1/health`.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env   # defaults are fine for local dev
npm install
npm run dev
```

The app runs on `http://localhost:5173`. Vite proxies `/api/v1/*` to the
backend (see `vite.config.js`), so no CORS configuration is needed in
development.

## 4. Try it out

1. Sign up as a **Seller** (pick "Sell as a Seller" and give it a shop name),
   log in, and create a product or two under **My Products**.
2. Sign up as a **Buyer** in a second browser/incognito window, browse
   **Shop**, add items to your cart, and checkout with Cash on Delivery.
3. To get an **Admin** account: sign up as a buyer, then in MongoDB manually
   set that user's `role` to `"ADMIN"` (public signup can never create admins
   by design) — or use an existing admin's **Users** page to promote them.

## Notes on design decisions

- **Auth**: JWT lives only in an HTTP-only `token` cookie — never in
  localStorage. The frontend calls `GET /api/v1/auth/me` on load to restore
  session state, since it can't read the cookie directly.
- **Checkout**: `POST /api/v1/orders` runs inside a MongoDB transaction.
  Stock is checked and atomically decremented with a conditional
  `updateOne({ stock: { $gte: qty } }, { $inc: { stock: -qty } })`, so
  concurrent purchases of the last unit can't oversell. If anything fails,
  the whole transaction rolls back — no order, no stock change, cart intact.
- **Multi-vendor orders**: a single `Order` document holds items from
  multiple sellers; each item snapshots its own `seller`, `name`, and
  `price` at purchase time and carries its own `itemStatus`. Sellers only
  ever see/update the items that belong to them.
- **Google auth**: the schema and routes support `authProvider: "GOOGLE"`,
  but real token verification (`verifyGoogleToken` in
  `backend/controllers/authController.js`) is stubbed out — wire in
  `google-auth-library` and `GOOGLE_CLIENT_ID` before using it in production.
- **Payments**: only Cash on Delivery is implemented, as no gateway was
  requested. `paymentStatus` and `orderStatus` are kept as separate fields
  so a real gateway can be dropped in later without a schema change.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list.
