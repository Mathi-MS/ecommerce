# Elowell Natural Products Store

## Overview

Full-stack ecommerce website for **Elowell** - a natural products brand selling coconut oil, honey, aloe vera gel, and similar natural wellness products. Inspired by Anveshan.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (wouter routing, zustand state, TanStack React Query)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (bcryptjs + jsonwebtoken)
- **Payments**: Razorpay integration

## Features

### User Side
1. Home page with hero banner, featured products, categories
2. Products listing with category filters
3. Single product page - multi-image carousel, reviews, ratings, referral code display, recommended products
4. Shopping cart with quantity controls
5. Checkout with referral code input and Razorpay payment
6. Sign in / Register flow
7. FAQ page with accordion
8. Order success page

### Admin Side
- Login: `/admin/login` with credentials: `admin@elowell.com` / `admin123`
- Dashboard with stats (total products, orders, revenue, users)
- Products management (add/edit/delete)
- Orders management with status updates
- Referral codes management

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── elowell-store/      # React + Vite frontend (at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## Database Schema

Tables:
- `users` - customers and admin users
- `categories` - product categories
- `products` - product catalog with images (JSON), pricing, referral codes
- `reviews` - product reviews and ratings
- `cart_items` - session-based cart (guest cart via sessionId)
- `orders` - customer orders
- `order_items` - individual order line items
- `referral_codes` - discount codes
- `faq` - FAQ entries

## API Routes

Base URL: `/api`

- `GET/POST /products` - List and create products
- `GET/PUT/DELETE /products/:id` - Single product CRUD
- `GET/POST /products/:id/reviews` - Product reviews
- `GET/POST /categories` - Categories
- `GET/POST/PUT/DELETE /cart` - Cart management
- `GET/POST /orders` - Orders
- `GET/PUT /orders/:id/status` - Order status updates
- `POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me`
- `POST /admin/login`, `GET /admin/dashboard`
- `GET/POST /referrals`, `POST /referrals/validate`
- `GET/POST /faq`
- `POST /payment/create-order`, `POST /payment/verify`

## Seed Data

- Admin: `admin@elowell.com` / `admin123`
- 8 products: Virgin Coconut Oil, Raw Forest Honey, Pure Aloe Vera Gel, Moringa Leaf Powder, Black Seed Oil, Himalayan Pink Salt, Neem Face Wash, Tulsi & Ginger Honey
- 4 categories: Oils & Extracts, Honey & Sweeteners, Skin Care, Superfoods
- Referral codes: `WELCOME10` (10%), `ELOWELL15` (15%), `NATURAL20` (20%)
- Sample reviews on products

## Payment Integration

Razorpay integration requires:
- `RAZORPAY_KEY_ID` environment variable
- `RAZORPAY_KEY_SECRET` environment variable

Without these, the checkout creates orders but skips the Razorpay payment step (orders go directly to pending).

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json`. Run `pnpm run typecheck` to check all packages.

- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Push DB schema: `pnpm --filter @workspace/db run push`
- Dev API: `pnpm --filter @workspace/api-server run dev`
- Dev frontend: `pnpm --filter @workspace/elowell-store run dev`
