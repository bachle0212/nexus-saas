# Nexus AI — SaaS Platform

[![CI — Lint, Test & Build](https://github.com/bachle0212/nexus-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/bachle0212/nexus-saas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)

Full-stack AI content generation SaaS with image, video, and script generation, a credit/subscription billing system, a content marketplace, and a full admin panel.

---

## Features

### AI Studio
- **Image generation** — Pollinations.ai API, 5 credits per image, character injection, seed control
- **Video generation** — FFmpeg zoompan, async job queue, 20 credits per video
- **Script studio** — Groq LLaMA 3.3 70B, tone/length controls, 2 credits per script
- **Character vault** — Reusable style profiles (prompt injection + seed) for consistent image output
- **My Gallery** — Full paginated archive with debounced search across all generations

### Billing & Credits
- **Credit system** — All AI features cost credits; users start with 10 free credits
- **Credit top-up** — Three packages (100/$5, 500/$20, 1000/$35) via Stripe Checkout
- **Subscription plans** — Admin-managed plans (Free / Pro / Enterprise) with monthly credit grants
- **Low-credit alerts** — Automatic in-app notification when credits drop below 20
- **IDOR protection** — Plans and credits are always read from Stripe session metadata, never from client input

### Content Marketplace (Store)
- Product catalog with inventory management
- Stripe Checkout integration with automatic inventory deduction on payment
- Order history per user

### Admin Panel
- User management (CRUD, role assignment, credit adjustment)
- RBAC with fine-grained permissions (`generate:image`, `users:read`, `roles:manage`, …)
- Subscription plan management
- Order management across all users
- Content moderation (view and delete any user's generated content)
- Platform analytics (KPIs, plan distribution, top users by usage)
- Audit logs (every admin action recorded with IP)

### Auth & Security
- JWT access token (15 min) + httpOnly refresh token cookie (7 days)
- Email verification on registration
- Forgot / reset password flow (email token)
- CSRF protection on all non-GET requests
- Automatic token refresh with transparent retry (Axios interceptor)
- API keys for programmatic access (`nx_` prefix)

### Public API
- API key authentication (`X-Nexus-API-Key` header or `Bearer nx_...`)
- Per-tier rate limiting: Free 5/min · Pro 60/min · Enterprise 10,000/min
- Endpoint: `POST /api/public/generate`

### UX
- Dark mode (persisted in localStorage)
- Real-time notification bell (polls every 30 seconds)
- Onboarding modal for new users
- Skeleton loading states throughout
- Toast notifications for all async operations

---

## Architecture

```
nexus-saas/
├── api-nest/          # NestJS 10 backend (TypeScript)
├── ui/                # React 19 + Vite frontend
├── minio/             # MinIO data volume (local dev)
├── docs/
│   ├── BACKEND.md     # Full API reference
│   └── FRONTEND.md    # UI architecture and routing
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### System Overview

```
Browser
  │
  ├─ React SPA (Vite, port 3000 / 5173)
  │    ├─ Zustand (auth state, persisted)
  │    ├─ React Query (server state, 30s stale)
  │    └─ Axios (JWT + CSRF interceptors, auto-refresh)
  │
  └─ NestJS API (port 8791)
       ├─ PostgreSQL 16 (TypeORM, 13 entities)
       ├─ MinIO S3 (image + video storage)
       ├─ Stripe (checkout + webhooks)
       ├─ Groq API (LLM script generation)
       ├─ Pollinations.ai (image generation)
       └─ FFmpeg (video processing, local)
```

---

## Quick Start

### Prerequisites

- Docker + Docker Compose
- A Stripe account (test keys are fine)
- A Groq API key (free tier works)
- SMTP credentials (Gmail app password works)

### 1. Clone and configure

```bash
git clone <repo-url>
cd nexus-saas
cp .env.example .env
```

Edit `.env`:

```env
# Required
JWT_SECRET=change-me-to-a-long-random-string
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GROQ_API_KEY=gsk_...

# Email (for verification + password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password

# URLs (change for production)
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
VITE_API_BASE=http://localhost:8791
MINIO_PUBLIC_URL=http://localhost:9000
```

### 2. Start all services

```bash
docker compose up -d
```

| Service | Port | URL |
|---|---|---|
| UI (nginx) | 3000 | http://localhost:3000 |
| API (NestJS) | 8791 | http://localhost:8791 |
| PostgreSQL | 5432 | — |
| MinIO (S3) | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Swagger docs | — | http://localhost:8791/api/docs |

### 3. Create the MinIO bucket

Open MinIO Console (http://localhost:9001, login: `nexusadmin` / `NexusSecretMinio123!`), create a bucket named `nexus-generations`, and set its access policy to **public read**.

### 4. Create your first admin user

```bash
# Register via the UI at http://localhost:3000, then promote:
docker exec -it nexus_postgres psql -U postgres -d nexus_saas \
  -c "UPDATE users SET role='admin', permissions='roles:manage,users:read,generate:image' WHERE email='your@email.com';"
```

---

## Development

### Backend

```bash
cd api-nest
npm install
npm run start:dev      # http://localhost:8791/api/docs

# Tests
npm test
npm test -- --testPathPattern="billing"
```

### Frontend

```bash
cd ui
npm install
npm run dev            # http://localhost:5173
```

---

## API Reference

### Authentication

Protected endpoints require:
```
Authorization: Bearer <access_token>
```

Public API endpoints accept:
```
X-Nexus-API-Key: nx_your_api_key
# or
Authorization: Bearer nx_your_api_key
```

### Quick Example — Public API

```bash
curl -X POST https://your-api/api/public/generate \
  -H "X-Nexus-API-Key: nx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "a cyberpunk city at night, neon lights", "width": 1024, "height": 1024 }'
```

```json
{
  "id": 42,
  "result_url": "https://your-minio/nexus-generations/uuid.png",
  "prompt": "a cyberpunk city at night, neon lights",
  "created_at": "2026-06-16T07:00:00.000Z"
}
```

Full interactive docs: **http://localhost:8791/api/docs**

---

## Credit Costs

| Action | Credits |
|---|---|
| Generate image | 5 |
| Generate video | 20 |
| Generate script | 2 |

---

## Production Deployment

### Stripe Webhooks

Point your Stripe webhook to:
```
https://your-api-domain/api/billing/webhook
```

Events to subscribe:
- `checkout.session.completed`
- `charge.refunded`

### Environment

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
CORS_ORIGINS=https://your-frontend.com
MINIO_PUBLIC_URL=https://your-minio.com
```

### CI/CD

GitHub Actions at `.github/workflows/ci.yml` runs on every push: install → build → test.

---

## Documentation

- [Frontend Architecture](docs/FRONTEND.md) — routing, state management, component breakdown, React Query patterns
- [Backend API Reference](docs/BACKEND.md) — all endpoints, entities, guards, security model, test coverage
