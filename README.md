# Offerlu Backend (Admin + Public API)

This backend is implemented to match the current Offerlu frontend contract:

- Cookie session auth for admin routes
- Offer CRUD with soft-delete (`isInactive`)
- Master-data CRUD with soft-delete (`status = inactive`)
- Image upload support for offers/categories/merchants/banks
- Public `site-content` delivery endpoint

## Tech Stack

- Node.js 18+
- Express 5
- Sequelize 6 + MySQL
- Joi validation
- Multer (memory uploads)

## Quick Start

1. Install:

```bash
npm install
```

2. Create env:

```bash
cp .env.example .env
```

3. Configure `.env` (`DB_*`, `API_PREFIX`, CORS, and admin session settings).

4. Recreate DB schema (destructive):

```bash
npm run db:setup
```

5. Start server:

```bash
npm run dev
```

## API Groups

All endpoints are under `${API_PREFIX}`.

### Admin Auth

- `POST /admin/auth/login` body `{ "password": "..." }` -> `204`
- `POST /admin/auth/logout` -> `204`
- `GET /admin/auth/session` -> `200 { authenticated: true }` or `401 { authenticated: false }`

Cookie used: `offerlu_admin_session` (`HttpOnly`, `SameSite=Lax`, `Path=/`, 7 days, `Secure` in production).

### Admin Offers

Multipart fields:

- **Text:** `title`, `description`, `startDate`, `endDate` (ISO dates), optional `companyName` (or omit and derive from first selected merchant), optional `offerDetails`, optional `companyLogoUrl` (string; ignored if you upload a logo file).
- **Files:** `heroImageFile` (required on **POST**), `companyLogoFile` (optional on POST/PATCH).
- **Relations (arrays):** `offerTypeIds`, `categoryIds`, `merchantIds`, `paymentIds`, `bankIds`, `locationIds` — repeat keys, comma-separated strings, JSON arrays, **or bracket-style names** (`merchantIds[]`, `offerTypeIds[]`, …) as sent by many HTML forms and Next.js actions. Bracket keys are normalized before Joi so they are not dropped by `stripUnknown`.

**JSON errors (4xx/5xx):** Responses include top-level `message` (same text as `error.message`), nested `error: { code, message, fields? }`, and for validation failures a flat `errors` object (field → message) alongside `error.fields` for compatibility with different admin clients.

**`companyName`:** Not required on create; if omitted and `merchantIds` are present, the service fills `companyName` / logo from the first merchant.

Endpoints:

- `POST /admin/offers` (multipart)
- `PATCH /admin/offers/:id` (multipart; `heroImageFile` / `companyLogoFile` optional)
- `GET /admin/offers`
- `GET /admin/offers/:id`
- `DELETE /admin/offers/:id` (soft delete only)

**Limits:** Multer rejects any single file over `MAX_UPLOAD_SIZE_MB` (default 10 MB). After upload, hero and company logo are validated again to `HERO_IMAGE_MAX_SIZE_MB` (default 5 MB) and must be JPEG/PNG/WebP/GIF with a matching binary signature. Bodies are still subject to the Express urlencoded/json limits for non-file parts.

**Vercel:** The deploy tree (`/var/task`) is **read-only**. If `UPLOAD_DIR` resolves under the project or `/var/task`, the server **automatically writes new uploads under** `os.tmpdir()/offerslu-uploads` instead (so `mkdir` does not fail). That storage is **ephemeral** (and a different path per invocation); use **S3 / Vercel Blob / Cloudinary** for production-persistent images. Set `PUBLIC_ASSET_BASE_URL` so `/uploads/...` URLs resolve to this API host.

Dashboard list query params:
`q`, `status`, `category`, `offerType`, `merchant`, `bank`, `location`, `sort`, `page`, `pageSize`.

### Admin Master Data

`GET|POST|PATCH|DELETE /admin/master-data/:entity`

Entities:

- `offer-types`
- `categories`
- `merchants`
- `payments`
- `banks`
- `locations`

Image fields:

- categories: `bannerImageFile`
- merchants: `logoImageFile`
- banks: `logoImageFile`

Same MIME/size rules as other admin uploads (`MAX_UPLOAD_SIZE_MB` per file, then signature check).

### Public read API (SSR-friendly)

All paths below are prefixed with `${API_PREFIX}` (default `/api`; production may use `/api/v1`).

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/health` | Small JSON `{ ok, timestamp }`. **Not counted** toward the global rate limit. |
| `GET` | `/public/site-content` | Homepage payload. **Not counted** toward the global rate limit. |
| `GET` | `/public/promotions` | Query: `category` (required). **Not counted** toward global limit. |
| `GET` | `/public/promotions/search` | Query params for search. **Not counted** toward global limit. |
| `GET` | `/public/promotions/search-filters` | Filter options. **Not counted** toward global limit. |
| `GET` | `/public/promotions/:id` | Single promotion. **Not counted** toward global limit. |

**`GET .../public/site-content` response contract** (always `200` + `Content-Type: application/json` on success):

- `siteName` (string)
- `hero` (object; may be empty `{}`)
- `categories` (array of `{ id, name, bannerImageUrl, offerCount }`)
- `promotionSections` (array; may be empty)
- `promotions` (array of promotion objects)
- `banks` (array of `{ id, name, logoUrl, offerCount }`)
- `about` (object; may be empty `{}`)
- `socialLinks` (array; may be empty)

Promotion objects in lists include at least: `id`, `title`, `description`, `offerBannerImageUrl`, `startDate`, `endDate`, `merchant`, `category`, `offerType`, `daysLeft`.

Errors from this API use the standard JSON error shape from `error.middleware` (`4xx`/`5xx` with `{ error: { code, message, ... } }`), not HTML.

## Rate limiting

**How requests are keyed:** The global limiter uses **express-rate-limit defaults** → primarily **per client IP** (`req.ip`), after `trust proxy` (enabled on Vercel so `X-Forwarded-For` is honored). There is no separate bucket per logged-in user on public routes.

**SSR / Vercel:** Next.js server-side `fetch` to this API often shares **one or a few egress IPs**. Without exemptions, many parallel `GET`s per page could exhaust a single shared bucket.

**What we do:**

1. **Global limit** (`RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS`, default **3000 / 15 minutes**) applies to routes that are **not** exempted below.
2. **Exempt from the global limiter** (no consumption of the global bucket):
   - `OPTIONS` (CORS preflight).
   - `GET`/`HEAD` `${API_PREFIX}/admin` and everything under it (session checks, master-data lists, offer lists, etc.). The admin UI issues **many parallel reads**; counting them toward the same cap as other traffic caused **429** responses that some clients treat like **auth failure** (empty dropdowns, “logged out” after refresh).
   - `GET`/`HEAD` `${API_PREFIX}/public` and everything under it (all public read endpoints above).
   - `GET`/`HEAD` `${API_PREFIX}/health`.
   - `GET`/`HEAD` `/uploads/...` (static images).
3. **Admin writes:** `POST` / `PATCH` / `PUT` / `DELETE` on `/admin/offers` and `/admin/master-data` use a **separate** limiter: `RATE_LIMIT_MAX_ADMIN_WRITE` per `RATE_LIMIT_ADMIN_WRITE_WINDOW_MS` (defaults **200 / 15 minutes** per IP). `GET` list/detail on those routers is not affected by this write limiter.
4. **Login:** `POST /admin/auth/login` keeps its own limiter (`LOGIN_RATE_LIMIT_MAX`, default **10** per window).

**429 responses:** All limiters return **JSON** `{ error: { code: "RATE_LIMITED", message, retryAfterSeconds } }` and an HTTP **`Retry-After`** header (seconds, whole window). Logs: `rate_limit_429`, `rate_limit_429_admin_write`, `rate_limit_429_login` with `path`, `method`, and `clientKeyHash` (SHA-256 of IP, truncated) for coarse observability without storing raw IPs in log lines.

**Env summary:**

| Variable | Default | Role |
|----------|---------|------|
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | Global + login window |
| `RATE_LIMIT_MAX` | `3000` | Global max hits per IP per window (non-exempt routes) |
| `RATE_LIMIT_MAX_ADMIN_WRITE` | `200` | Admin offer/master-data writes per IP per admin-write window |
| `RATE_LIMIT_ADMIN_WRITE_WINDOW_MS` | `900000` | Window for admin write limiter |
| `LOGIN_RATE_LIMIT_MAX` | `10` | Login attempts per window |

Tune `RATE_LIMIT_MAX` upward in production if needed; public and admin read traffic no longer consume the global bucket for the paths above.

## Scripts

- `npm run dev` - start development server
- `npm start` - start production server
- `npm run db:setup -- --force` - recreate schema (destructive)
- `npm run db:seed -- --email=<admin@email> --password=<password>` - create admin account
- `npm run db:seed -- --email=<admin@email> --password=<password> --reset-password` - reset admin password
- `npm run lint` - run eslint
- `npm run format` - run prettier

## Important Notes

- `db:setup` currently uses `sequelize.sync({ force: true })` to recreate schema.
- Upload validation checks MIME type and file signature.
- Offer list filters/sorting/pagination are executed server-side.
