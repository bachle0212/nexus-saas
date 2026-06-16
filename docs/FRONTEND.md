# Nexus AI — Frontend Documentation

## Stack

| Layer | Library | Version |
|---|---|---|
| Framework | React | 19 |
| Build tool | Vite | 5 |
| Routing | React Router | v7 |
| Server state | @tanstack/react-query | v5 |
| Client state | Zustand + persist | v4 |
| Styling | Tailwind CSS | v3 |
| HTTP client | Axios | latest |
| Animations | Framer Motion | v11 |
| Icons | Lucide React | latest |
| Toasts | React Toastify | latest |

---

## Project Structure

```
ui/src/
├── main.jsx                  # Entry — wraps App with React 19 createRoot
├── App.jsx                   # Router + QueryClientProvider
├── lib/
│   └── api.js                # Axios instance + interceptors
├── store/
│   └── authStore.js          # Zustand persisted auth store
├── layouts/
│   └── DashboardLayout.jsx   # Auth guard + sidebar + desktop top bar
├── components/
│   ├── LandingPage.jsx
│   ├── Login.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── EmailVerify.jsx
│   ├── Sidebar.jsx
│   ├── NotificationCenter.jsx
│   ├── OnboardingModal.jsx
│   ├── ProfileSettings.jsx
│   └── AnalyticsDashboard.jsx
└── pages/
    ├── StudioPage.jsx
    ├── GalleryPage.jsx
    ├── VideoPage.jsx
    ├── ScriptsPage.jsx
    ├── CharactersPage.jsx
    ├── BillingPage.jsx
    ├── BuyCreditsPage.jsx
    ├── BillingHistoryPage.jsx
    ├── AnalyticsPage.jsx
    ├── ProfilePage.jsx
    ├── ApiKeysPage.jsx
    ├── StorePage.jsx
    ├── MyOrdersPage.jsx
    └── admin/
        ├── AdminDashboard.jsx
        ├── UsersPage.jsx
        ├── RolesPage.jsx
        ├── PlansPage.jsx
        ├── AllOrdersPage.jsx
        ├── ModerationPage.jsx
        ├── ProductsPage.jsx
        ├── AdminAnalyticsPage.jsx
        └── AuditLogsPage.jsx
```

---

## Routing

All routes are defined in `App.jsx`. Protected dashboard routes share `DashboardLayout` as the parent — it acts as an auth guard, redirecting to `/login` when there's no token.

```
/                           → LandingPage
/login                      → Login
/forgot-password            → ForgotPassword
/reset-password             → ResetPassword (reads ?token= from URL)
/verify-email               → EmailVerify (reads ?token= from URL)

/dashboard                  → redirect → /dashboard/studio
/dashboard/studio           → StudioPage
/dashboard/gallery          → GalleryPage
/dashboard/video            → VideoPage
/dashboard/scripts          → ScriptsPage
/dashboard/characters       → CharactersPage
/dashboard/billing          → BillingPage
/dashboard/billing/buy-credits → BuyCreditsPage
/dashboard/billing/history  → BillingHistoryPage
/dashboard/analytics        → AnalyticsPage
/dashboard/profile          → ProfilePage
/dashboard/api-keys         → ApiKeysPage
/dashboard/store            → StorePage
/dashboard/my-orders        → MyOrdersPage

/dashboard/admin            → AdminDashboard (navigation hub)
/dashboard/admin/users      → UsersPage
/dashboard/admin/roles      → RolesPage
/dashboard/admin/plans      → PlansPage
/dashboard/admin/orders     → AllOrdersPage
/dashboard/admin/moderation → ModerationPage
/dashboard/admin/products   → ProductsPage
/dashboard/admin/analytics  → AdminAnalyticsPage
/dashboard/admin/audit-logs → AuditLogsPage

*                           → redirect → /
```

---

## Auth Store (`authStore.js`)

Uses Zustand with `persist` middleware, stored under key `nexus_auth` in `localStorage`.

```js
{
  token: string | null,       // JWT access token
  user: {
    id, email, plan, role,
    permissions, credits,
    display_name, avatar_url
  } | null,
  credits: number,            // mirrored for sidebar display

  // Actions
  login(token, user),
  logout(),
  updateUser(partial),
  hasPerm(permString): boolean
}
```

`hasPerm(perm)` checks if `user.permissions` (comma-separated string) contains the given permission key, e.g. `'generate:image'`, `'users:read'`, `'roles:manage'`.

---

## API Client (`lib/api.js`)

Axios instance pointing to `https://api-nexus.bachdev.bond`.

**Request interceptor:**
1. Reads JWT from Zustand persisted state (`nexus_auth` → `.state.token`)
2. Falls back to legacy key `nexus_token`
3. Attaches `Authorization: Bearer <token>`
4. Reads CSRF token from `csrf_token` cookie and attaches `X-CSRF-Token` on non-GET requests

**Response interceptor (401 retry):**
1. On 401, calls `POST /api/auth/refresh` (httpOnly cookie carries the refresh token)
2. Updates the new access token in both Zustand persisted state and legacy key
3. Retries the original request once
4. On refresh failure: clears all auth keys, redirects to `/login`

---

## DashboardLayout

Handles:

- **Auth guard** — `useEffect` watching `token`, navigates to `/login` when missing
- **Dark mode** — toggles `document.documentElement.classList('dark')`, persists in `localStorage('nexus_dark')`
- **Onboarding modal** — shows once if `nexus_onboarded` not in localStorage
- **Stripe redirect handling** — reads `?success=true&type=...&session_id=...` from URL after Stripe checkout:
  - `type=subscription` → `POST /api/billing/verify-subscription`
  - `type=credits` → `POST /api/billing/verify-credits`
  - `type=order` → `POST /api/store/verify-order`
- **Layout structure**:
  - Mobile: fixed header with hamburger + notification bell + dark toggle
  - Desktop: sidebar (left) + sticky top bar (notification bell + dark toggle) + scrollable content

---

## Notifications (`NotificationCenter.jsx`)

- Polls `GET /api/notifications` every 30 seconds
- Shows unread count badge on bell icon
- Dropdown: mark single as read, mark all as read
- Mounted in both mobile header and desktop top bar

---

## Pages

### StudioPage — Image generation

- Form: prompt, width, height, seed, character selector
- Cost: **5 credits** per image
- Calls `POST /api/generate`
- Shows recent generations from `GET /api/history` (last 10)
- Download button, delete with confirmation

### GalleryPage — Full image archive

- Calls `GET /api/resources/generations?page=1&limit=20&q=...`
- Debounced search (300ms), resets to page 1 on search change
- Smooth pagination with `placeholderData: (prev) => prev` (no flash between pages)
- Shows max 7 page number buttons

### VideoPage — AI video generation

- Input: text prompt **or** image URL
- Cost: **20 credits**
- Job is fire-and-forget: server returns `{ job_id, status: 'processing' }` immediately
- Frontend polls `GET /api/video/:job_id/status` every 4 seconds until done/failed
- `useRef` tracks all active poll intervals; `useEffect` cleanup clears them all on unmount

### ScriptsPage — Script studio

- Form: topic, tone (Formal/Casual/Funny/Professional), length (short/medium/long)
- Cost: **2 credits**
- Calls `POST /api/scripts/generate`
- Script history shown below

### CharactersPage — Character vault

- Create characters with name, physical traits, seed
- Characters inject style into image generation (seed + prompt_injection)
- CRUD list with edit modal and delete confirmation

### BillingPage — Subscription plans

- Fetches plans from `GET /api/billing/plans`
- Calls `POST /api/billing/subscribe?plan_id=N` → Stripe Checkout redirect
- Feature list rendered from `JSON.parse(plan.features || '[]')` (try/catch safe)

### BuyCreditsPage — Credit top-up

- Fetches packages from `GET /api/billing/credit-packages`
- Three packages: 100/$5, 500/$20, 1000/$35
- Calls `POST /api/billing/buy-credits` → Stripe Checkout redirect

### BillingHistoryPage

- Calls `GET /api/billing/history`
- Lists payments: date, amount, credits added, description

### AnalyticsPage

- Wraps `AnalyticsDashboard` component
- Data from `GET /api/analytics/dashboard`
- Shows: total images, total videos, total scripts, credits spent, 7-day usage chart, recent payments

### ProfilePage

- Update display name + avatar URL → `PUT /api/auth/me/profile`
- Change password → `POST /api/auth/me/change-password`
- View/regenerate API key → `GET/POST /api/auth/me/api-key[/regenerate]`

### ApiKeysPage

- Shows current API key (masked)
- Copy to clipboard, regenerate with confirmation
- curl example for `POST /api/public/generate`

### StorePage — Content marketplace

- Products fetched from `GET /api/store/products`
- Purchase: `POST /api/store/create-order` → Stripe redirect

### MyOrdersPage

- `GET /api/store/orders` — user's own orders with items, totals, status

---

## Admin Pages

All admin pages check `user.role === 'admin'` in the sidebar. Some routes additionally check `hasPerm('users:read')` or `hasPerm('roles:manage')`.

| Page | API | Description |
|---|---|---|
| UsersPage | `GET/POST/PUT /api/admin/users` | Full user CRUD with role + credits |
| RolesPage | `GET/POST/PUT/DELETE /api/admin/roles` | RBAC permission matrix |
| PlansPage | `GET/POST/PUT/DELETE /api/billing/plans` | Subscription plan management |
| AllOrdersPage | `GET /api/admin/orders` | All orders across all users |
| ModerationPage | `GET /api/admin/resources`, `DELETE /api/admin/resources/:type/:id` | Remove generated content |
| ProductsPage | `GET/POST/PUT/DELETE /api/admin/products` | Store product management |
| AdminAnalyticsPage | `GET /api/analytics/admin` | KPIs, top users, plan distribution |
| AuditLogsPage | `GET /api/analytics/audit-logs` | Compliance trail |

---

## React Query Configuration

```js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,   // data stays fresh 30s — avoids refetch on tab focus
      retry: 1,
    },
  },
});
```

Key query patterns used:
- `placeholderData: (prev) => prev` — keeps old data visible during page change (replaces v4's `keepPreviousData: true`)
- `enabled: false` — lazy load (e.g. ModerationPage only loads on refresh click)
- `useMutation` with `onSuccess` calling `queryClient.invalidateQueries(...)` for cache busting

---

## Environment Variables

```env
# .env (Vite — must prefix VITE_)
VITE_API_BASE=https://api-nexus.bachdev.bond
```

The API base is also hardcoded as fallback in `lib/api.js`:
```js
export const API_BASE = 'https://api-nexus.bachdev.bond';
```

---

## Build & Dev

```bash
# Install
cd ui && npm install

# Dev server (port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Docker build uses nginx to serve the static files:
```bash
docker build --build-arg VITE_API_BASE=https://your-api.com -t nexus-ui .
```
