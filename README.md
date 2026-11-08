# Wonderlust — AI-Powered Travel & Adventure Platform

Next.js 15 (App Router) + TypeScript travel platform. Phase 1 delivered the
frontend; **Phase 2 adds the PostgreSQL database, authentication and a real
backend API** consumed by the existing pages.

## Stack

| Layer          | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js 15.3 (App Router, React 19)                |
| Language       | TypeScript (strict)                                |
| Database       | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)     |
| Auth           | Auth.js / NextAuth v5 (Credentials + bcrypt + JWT) |
| Validation     | zod                                                |
| Styling        | Tailwind CSS v4                                    |

Supabase is not used: the project talks to PostgreSQL directly through Prisma.

## Getting started

```bash
npm install
cp .env.example .env          # then set DATABASE_URL and AUTH_SECRET
npm run db:migrate            # apply prisma/migrations
npm run db:seed               # optional: destinations + admin account
npm run dev                   # http://localhost:3000
```

Generate a secret with `openssl rand -base64 32`.

### Scripts

| Script              | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Development server                         |
| `npm run build`     | Production build                           |
| `npm run types`     | `tsc --noEmit`                             |
| `npm run lint`      | ESLint (flat config)                       |
| `npm run db:generate` | Regenerate the Prisma client            |
| `npm run db:migrate`  | `prisma migrate deploy`                 |
| `npm run db:seed`     | Seed destinations + admin user          |
| `./scripts/api-smoke.sh` | End-to-end API tests against a running server |

## Data model

`prisma/schema.prisma` defines:

- **User** — email, bcrypt `passwordHash`, name, avatar, role, timestamps
- **Profile** — bio/website, one-to-one with a user
- **Destination** — slug, country, continent, category, rating, review count
- **Trip** — owner (`userId`), destination, dates, travellers, budget, price
- **TripItinerary** — day-by-day activities for a trip
- **SavedDestination** — unique (user, destination) pair
- **Booking** — trip, travellers, server-computed total, status lifecycle
- **Review** — rating 1–5 and comment; unique per (user, destination)

Migrations live in `prisma/migrations/` and are applied with
`npm run db:migrate`.

## Authentication

- Registration: `POST /api/auth/register` hashes the password with bcrypt
  (cost 12) and creates the user plus an empty profile.
- Login/logout/session: Auth.js endpoints under `/api/auth/*`
  (`callback/credentials`, `session`, `csrf`, `signout`).
- Sessions are signed HttpOnly JWT cookies (30 days, `AUTH_SECRET`).
- Passwords are never returned by any endpoint.
- Server helpers in `lib/auth.server.ts` (`getSessionUser`, `requireAuth`,
  `requireRole`) are the only way routes determine the current user.

## API

All routes validate input with zod and return `{ error, code }` on failure.

| Method | Route | Auth | Notes |
| ------ | ----- | ---- | ----- |
| GET | `/api/destinations` | public | filters: category, continent, search, limit, offset |
| GET | `/api/destinations/:slug` | public | includes latest reviews |
| GET | `/api/trips` | public | featured/public trips |
| GET | `/api/trips?mine=1` | session | the caller's trips |
| POST | `/api/trips` | session | owner taken from session |
| GET | `/api/trips/:id` | optional | private trips: owner/admin only |
| PUT/DELETE | `/api/trips/:id` | session | owner or admin |
| GET/PUT | `/api/users` | session | the caller's own profile |
| GET | `/api/saved/destinations` | session | caller's saved list |
| POST | `/api/saved/destinations` | session | 409 if already saved |
| DELETE | `/api/saved/destinations/:id` | session | owner only |
| GET | `/api/bookings` | session | caller's bookings (admin: `scope=all`) |
| POST | `/api/bookings` | session | price computed server-side, status `pending` |
| GET/PATCH/DELETE | `/api/bookings/:id` | session | owner or admin; customers may only cancel |
| GET | `/api/reviews` | public | filter by destination/trip/user |
| POST | `/api/reviews` | session | one review per destination per user |
| DELETE | `/api/reviews/:id` | session | author or admin |
| POST | `/api/auth/register` | public | rate limited |
| POST | `/api/auth/forgot-password` | public | rate limited, generic response, emails reset link |
| POST | `/api/auth/reset-password` | public | consumes single-use token, sets new password |

## Password reset

1. `POST /api/auth/forgot-password` creates a 256-bit token, stores **only its
   SHA-256 hash** with a 30-minute expiry, and emails
   `/reset-password?token=…`.
2. `POST /api/auth/reset-password` claims the token atomically (single use),
   re-hashes the new password with bcrypt and invalidates any other outstanding
   tokens for that account.

Delivery uses SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
`EMAIL_FROM`), so any provider works. In development without SMTP configured,
the link is logged to the server console and returned as `devResetUrl`;
production never returns it and never pretends an email was sent.

Note: existing JWT sessions are not revoked when a password is reset — they
remain valid until they expire. Session revocation is planned for a later phase.

## Security model

- **No client-supplied identity.** Every authenticated query derives the user
  from the session cookie; `user_id`/token headers are not trusted.
- **Ownership checks** on trips, saved destinations, bookings and reviews.
  Unauthorized private resources return 404 so their existence is not leaked.
- **Server-computed values** for booking totals, trip duration and review
  aggregates — clients cannot set prices or confirm their own bookings.
- **Validation** with zod on every write endpoint (types, ranges, dates,
  enums); Prisma parameterises all SQL.
- **Rate limiting** on registration (10 per 15 min per IP), password-reset
  requests (3 per 15 min per IP and 3 per hour per address) and reset
  completion (5 per 15 min per IP); counters are in-process, so back them with
  a shared store for multi-instance deployments.
- **Reset tokens** are random 256-bit values stored only as SHA-256 hashes,
  expire after 30 minutes, are single-use, and are superseded when a new one is
  requested.
- **Secrets** live only in `.env` (gitignored); no service-role keys or
  database credentials are exposed to the browser.

## Known gaps (Phase 3+)

- SMTP credentials must be supplied to deliver reset emails; without them
  development logs the link and production logs a delivery failure.
- Password reset does not revoke existing JWT sessions.
- Rate-limit counters are per-process (no Redis yet).
- No email verification, 2FA or OAuth providers.
- Payment capture for bookings is not implemented; bookings stay `pending`.
