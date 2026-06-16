# Nexus AI — Backend Documentation

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 (TypeORM, `synchronize: true`) |
| Object Storage | MinIO (S3-compatible via `@aws-sdk/client-s3`) |
| Auth | JWT (access token) + httpOnly refresh token cookie |
| Payments | Stripe Checkout + Webhooks |
| LLM | Groq API (script generation) |
| Image AI | Pollinations.ai (free, no API key required) |
| Video | FFmpeg (zoompan filter, local processing) |
| Email | Nodemailer (SMTP) |
| Rate limiting | Custom `TierThrottleGuard` (in-memory Map) |
| API docs | Swagger (`@nestjs/swagger`) at `/api/docs` |

---

## Module Map

```
src/
├── app.module.ts              # Root — wires all modules + TypeORM + Throttler
├── common/
│   ├── config.ts              # Env vars (DATABASE_URL, JWT_SECRET, STRIPE_*, …)
│   ├── jwt-auth.guard.ts      # JwtAuthGuard — validates Bearer token
│   ├── api-key.guard.ts       # ApiKeyGuard — X-Nexus-API-Key or Bearer nx_…
│   ├── tier-throttle.guard.ts # TierThrottleGuard — per-user per-tier rate limit
│   └── throttle.decorator.ts  # @ThrottleTier('generate') decorator
├── entities/
│   └── index.ts               # All 13 TypeORM entities in one file
├── auth/                      # JWT register/login/refresh + profile/password/API key
├── billing/                   # Stripe Checkout, webhooks, plans, credit packages
├── generate/                  # Image generation (Pollinations.ai + MinIO)
├── video/                     # Video generation (FFmpeg + MinIO), async job queue
├── script/                    # Script generation (Groq LLM)
├── character/                 # Character vault (CRUD)
├── store/                     # Product catalog + Stripe orders
├── analytics/                 # User dashboard + admin KPIs + audit logs
├── notification/              # In-app notifications
├── admin/                     # Admin CRUD: users, roles, resources, products
├── user/                      # Single endpoint: GET /api/user/credits
└── public/                    # Public API (API key auth, tier rate-limited)
```

---

## Entities

### User
```
id, email, hashed_password, credits (default 10), plan (default 'Free'),
role (default 'user'), permissions (default 'generate:image'),
display_name, avatar_url, email_verified, email_verify_token,
reset_password_token, reset_password_expires, stripe_customer_id,
api_key (unique), created_at
```

### Role
```
id, name (unique), permissions (comma-separated), description
```

### SubscriptionPlan
```
id, name (unique), price_usd, monthly_credits, features (JSON string), stripe_price_id
```

### Payment
```
id, user_id, amount, credits_added, status, stripe_session_id, description, invoice_url, created_at
```

### Generation
```
id, user_id, prompt, result_url, cost, width (default 1024), height (default 1024), created_at
```

### CharacterProfile
```
id, user_id, name, prompt_injection, seed, created_at
```

### VideoGeneration
```
id, user_id, prompt, result_url, status (default 'completed'), cost (default 20), created_at
```

### Script
```
id, user_id, title, content (text), created_at
```

### Product
```
id, name, description, price, image_url, inventory (default 100), created_at
```

### Order
```
id, user_id, total_amount, status (default 'pending'), shipping_address, stripe_session_id, created_at
```

### OrderItem
```
id, order_id, product_id, quantity, price_at_time
```

### AuditLog
```
id, user_id, user_email, action, resource, meta (JSON text), ip_address, created_at
```

### Notification
```
id, user_id, title, message (text), type (info/success/warning/error),
is_read (default false), link, created_at
```

---

## Auth Module

**Base path:** `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register. Sends verification email. Returns `{ message }` |
| GET | `/verify-email?token=` | — | Verifies email token, sets `email_verified = true` |
| POST | `/login` | — | Returns `{ access_token, user }`, sets httpOnly `refresh_token` cookie |
| POST | `/forgot-password` | — | Sends password reset link via email |
| POST | `/reset-password` | — | Resets password using token from email |
| GET | `/me` | JWT | Returns current user object |
| PUT | `/me/profile` | JWT | Update `display_name`, `avatar_url` |
| POST | `/me/change-password` | JWT | Change password (requires `current_password`) |
| GET | `/me/api-key` | JWT | Returns `{ api_key }` |
| POST | `/me/api-key/regenerate` | JWT | Generates new `nx_*` API key via `uuid.v4()` |
| POST | `/refresh` | Cookie | Reads `refresh_token` cookie, issues new `access_token` |
| POST | `/logout` | — | Clears `refresh_token` + `csrf_token` cookies |

**JWT strategy:** RS256 or HS256 (configured via `JWT_SECRET`). Access token expires in 15 minutes. Refresh token in httpOnly cookie expires in 7 days.

**Email flows:**
- Verification: token stored in `email_verify_token`, expires on use
- Password reset: token in `reset_password_token`, expires `reset_password_expires`

---

## Billing Module

**Base path:** `/api/billing`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/plans` | — | List subscription plans |
| GET | `/credit-packages` | — | List the 3 fixed credit packages |
| GET | `/history` | JWT | User's payment history |
| POST | `/plans` | JWT (admin) | Create plan |
| PUT | `/plans/:id` | JWT (admin) | Update plan |
| DELETE | `/plans/:id` | JWT (admin) | Delete plan |
| POST | `/subscribe?plan_id=N` | JWT | Create Stripe Checkout session for subscription |
| POST | `/buy-credits` | JWT | Create Stripe Checkout session for credit top-up |
| POST | `/verify-subscription?session_id=` | JWT | Verify and apply subscription after payment |
| POST | `/verify-credits?session_id=` | JWT | Verify and credit top-up after payment |
| POST | `/webhook` | — (Stripe sig) | Handle Stripe webhook events |

**Credit packages (hardcoded):**
```
credits_100  → 100 credits, $5
credits_500  → 500 credits, $20
credits_1000 → 1000 credits, $35
```

**Security (IDOR / price manipulation prevention):**
- `verifyCredits` and `verifySubscription` read plan/credits **from Stripe session metadata**, never from client input
- `client_reference_id` is compared to `user.id` — mismatch throws `ForbiddenException`
- Payment deduplication: `stripe_session_id` stored in `payments` table; duplicate calls return `{ message: 'Already processed' }`

**Stripe webhook events handled:**
- `checkout.session.completed` → credits/plan applied
- `charge.refunded` → credits deducted

---

## Generate Module

**Base path:** `/api/generate` and `/api/resources`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/generate` | JWT | Generate image (5 credits) |
| GET | `/api/history` | JWT | Last 10 generations |
| GET | `/api/resources/generations` | JWT | Paginated + searchable archive |
| DELETE | `/api/resources/generations/:id` | JWT | Delete own generation |

**Image generation flow:**
1. Validate user has ≥ 5 credits
2. Deduct 5 credits, save user
3. If `character_id` provided, fetch `CharacterProfile`, inject `prompt_injection` and use `seed`
4. Call `https://image.pollinations.ai/prompt/{encoded_prompt}?...`
5. Upload result to MinIO (`nexus-generations` bucket)
6. Save `Generation` record

**Paginated endpoint:**
```
GET /api/resources/generations?page=1&limit=20&q=dragon
→ { items: [...], total: 150, page: 1, limit: 20, pages: 8 }
```

---

## Video Module

**Base path:** `/api/video`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/video/generate` | JWT | Start video job (20 credits) |
| GET | `/api/video/:id/status` | JWT | Poll job status |
| GET | `/api/video/history` | JWT | All user's video jobs |

**Video generation flow (non-blocking):**
1. Validate user has ≥ 20 credits
2. Validate: at least one of `prompt` or `image_url` required
3. Deduct 20 credits, create `VideoGeneration` with `status = 'processing'`
4. Return `{ job_id, status: 'processing', message: 'Poll /api/video/:id/status' }` immediately
5. Fire-and-forget: `processVideoJob(job, user, body)` runs asynchronously
   - Downloads or fetches image
   - Runs FFmpeg zoompan filter (4-second video)
   - Uploads to MinIO
   - Updates job `status = 'completed'` / `'failed'`
   - On failure: refunds 20 credits to user

**Status values:** `processing` | `completed` | `failed`

---

## Script Module

**Base path:** `/api/scripts`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/scripts/generate` | JWT | Generate script via Groq (2 credits) |
| GET | `/api/scripts` | JWT | List user's scripts |

Calls Groq API with the `llama-3.3-70b-versatile` model. On failure, refunds 2 credits.

---

## Character Module

**Base path:** `/api/characters`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/characters` | JWT | List user's characters |
| POST | `/api/characters` | JWT | Create character (name, prompt_injection, seed) |
| PUT | `/api/characters/:id` | JWT | Update character |
| DELETE | `/api/characters/:id` | JWT | Delete character |

Characters are referenced by `character_id` in image generation — the `prompt_injection` string is appended to the prompt and the `seed` overrides the request seed.

---

## Store Module

**Base path:** `/api/store`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/store/products` | — | List all products |
| POST | `/api/store/create-order` | JWT | Create order + Stripe Checkout session |
| POST | `/api/store/verify-order?session_id=&order_id=` | JWT | Verify payment, mark order paid, reduce inventory |
| GET | `/api/store/orders` | JWT | User's own orders |

---

## Analytics Module

**Base path:** `/api/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/dashboard` | JWT | User dashboard: totals + 7-day chart + recent payments |
| GET | `/api/analytics/admin` | JWT (admin) | KPIs: total users, revenue, plan distribution, top users |
| GET | `/api/analytics/audit-logs` | JWT (admin) | Paginated audit trail |
| POST | `/api/analytics/audit-logs` | JWT | Create audit log entry |

**User dashboard response:**
```json
{
  "total_images": 42,
  "total_videos": 5,
  "total_scripts": 12,
  "credits_spent": 260,
  "chart_data": [{ "date": "2026-06-10", "images": 3, "videos": 1 }, ...],
  "recent_payments": [...]
}
```

---

## Notification Module

**Base path:** `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | JWT | `{ items: [...], unread: N }` |
| POST | `/api/notifications/:id/read` | JWT | Mark single as read |
| POST | `/api/notifications/read-all` | JWT | Mark all as read |

`NotificationService.checkAndAlertLowCredits(user)` is called after credit deductions — sends a warning notification when credits drop below 20.

Notification types: `info` | `success` | `warning` | `error`

---

## Admin Module

**Base path:** `/api/admin`

All endpoints require JWT. CRUD operations require `roles:manage` permission.

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/admin/users` | `users:read` | List all users |
| POST | `/api/admin/users` | `roles:manage` | Create user |
| PUT | `/api/admin/users/:id` | `roles:manage` | Update user (email, role, credits, password) |
| GET | `/api/admin/orders` | `roles:manage` | All orders |
| GET | `/api/admin/resources` | — | All generations + videos |
| DELETE | `/api/admin/resources/:type/:id` | — | Delete image or video |
| GET | `/api/admin/roles` | — | List roles |
| POST | `/api/admin/roles` | `roles:manage` | Create role |
| PUT | `/api/admin/roles/:id` | `roles:manage` | Update role |
| DELETE | `/api/admin/roles/:id` | `roles:manage` | Delete role |
| POST | `/api/admin/products` | `roles:manage` | Create product |
| PUT | `/api/admin/products/:id` | `roles:manage` | Update product |
| DELETE | `/api/admin/products/:id` | `roles:manage` | Delete product |

---

## Public API Module

**Base path:** `/api/public`

Authenticated via `ApiKeyGuard` (not JWT). No dashboard login required.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/public` | — | API info, rate limits, credit costs |
| POST | `/api/public/generate` | API Key + Tier Throttle | Generate image (same as `/api/generate`) |

**API key formats accepted:**
- Header: `X-Nexus-API-Key: nx_your_key`
- Bearer: `Authorization: Bearer nx_your_key`

**Rate limits by plan:**
| Plan | generate tier | strict tier |
|---|---|---|
| Free | 5 req/min | 3 req/min |
| Pro | 60 req/min | 3 req/min |
| Enterprise | 10,000 req/min | 3 req/min |

---

## Guards & Security

### JwtAuthGuard
Validates `Authorization: Bearer <token>` header using NestJS Passport JWT strategy. Attaches decoded user to `req.user`.

### ApiKeyGuard
1. Checks `X-Nexus-API-Key` header first
2. Falls back to `Authorization: Bearer nx_...` (only if value starts with `nx_`)
3. Looks up `User` by `api_key` field
4. Throws `UnauthorizedException` if not found

### TierThrottleGuard
In-memory `Map<string, { count, resetAt }>`. Key is `${userId}:${tier}`. Resets every 60 seconds. Throws `429 Too Many Requests` with `{ statusCode, limit, plan }` body on exceed.

### CSRF Protection
Every non-GET request checks `X-CSRF-Token` header against the `csrf_token` cookie. Cookie is set at login.

### Global Exception Filter
Catches all unhandled exceptions, normalizes to `{ statusCode, message, timestamp, path }` JSON response. Never leaks stack traces in production.

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexus_saas
JWT_SECRET=your-secret-key

# MinIO / S3
MINIO_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_ACCESS_KEY=nexusadmin
MINIO_SECRET_KEY=NexusSecretMinio123!
MINIO_BUCKET=nexus-generations

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Groq (script generation)
GROQ_API_KEY=gsk_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password

# URLs
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Server
HOST=0.0.0.0
PORT=8791
NODE_ENV=production
```

---

## Running the API

```bash
cd api-nest

# Install
npm install

# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Tests
npm test
npm test -- --testPathPattern="spec"
```

**Swagger UI:** `http://localhost:8791/api/docs`

---

## Test Coverage

6 spec files, 57 tests total:

| File | Tests | Covers |
|---|---|---|
| `auth.service.spec.ts` | 13 | Register, login, refresh, logout, duplicate email |
| `billing.service.spec.ts` | 15 | Plans CRUD, credit packages, IDOR/price manipulation prevention |
| `generate.service.spec.ts` | 5 | Credit check, deduction, pagination, delete |
| `video.service.spec.ts` | 9 | Credit check, non-blocking, status, history |
| `api-key.guard.spec.ts` | 6 | Header auth, Bearer extraction, JWT rejection, precedence |
| `tier-throttle.guard.spec.ts` | 9 | Free/Pro/Enterprise limits, strict tier, IP fallback |

Key mocking notes:
- Stripe is an ES default export — requires `jest.mock('stripe', () => ({ __esModule: true, default: jest.fn() }))`
- uuid v14 is ESM-only — requires explicit mock in all transitive callers
- `jest.mock('fs')` must spread `jest.requireActual('fs')` to avoid breaking TypeORM's `path-scurry` dependency
