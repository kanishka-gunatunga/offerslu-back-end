# OffersLu Admin Back-End

A Node.js + Express.js + MySQL (Sequelize) backend for the OffersLu admin panel.
Single-admin authentication, offer management (CRUD + search + filters),
categories & merchants as lookup resources, and file-attachment support.

> Status: initial scaffold. APIs and models are intentionally conservative until
> the UI designs and full requirements land.

## Tech Stack

- **Runtime:** Node.js 18+ (tested on 22)
- **Framework:** Express 4
- **ORM:** Sequelize 6 (MySQL)
- **Auth:** JWT (stateless), bcrypt password hashing
- **Validation:** Joi
- **Uploads:** Multer (disk storage)
- **Logging:** Winston + Morgan
- **Security:** Helmet, CORS, express-rate-limit
- **Tooling:** ESLint, Prettier, Nodemon

## Project Structure

```
offerslu-back-end/
├── src/
│   ├── config/          # env, database, logger
│   ├── controllers/     # HTTP handlers (thin)
│   ├── middlewares/     # auth, validate, upload, error
│   ├── models/          # Sequelize models + associations
│   ├── routes/          # Express routers
│   ├── services/        # Business logic
│   ├── utils/           # ApiError, asyncHandler, pagination, responses
│   ├── validators/      # Joi schemas
│   ├── scripts/         # One-off scripts (seed admin)
│   ├── app.js           # Express app (no listen)
│   └── server.js        # Bootstrap + graceful shutdown
├── uploads/             # Uploaded attachments (gitignored)
├── logs/                # Winston log files (gitignored)
├── .env.example
├── .eslintrc.json
├── .prettierrc.json
├── nodemon.json
└── package.json
```

## Getting Started

### 1. Prerequisites

- Node.js `>=18`
- MySQL `>=8.0` (or compatible MariaDB)
- An empty database, e.g.:

  ```sql
  CREATE DATABASE offerslu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

**Important:** set a strong `JWT_SECRET` and change `ADMIN_PASSWORD` before running
the seed. Never commit `.env`.

### 4. Create the admin user

This script ensures the single admin account exists. Safe to run multiple times.

```bash
npm run db:seed
```

To force-reset the admin password to the one in `.env`:

```bash
node src/scripts/seedAdmin.js --reset-password
```

### 5. Run the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:4000` by default. API base: `http://localhost:4000/api/v1`.

## API Overview

All endpoints are prefixed by `API_PREFIX` (default `/api/v1`).
All endpoints except `POST /auth/login` and `GET /health` require a Bearer token.

### Auth

| Method | Path                    | Description                       |
| ------ | ----------------------- | --------------------------------- |
| POST   | `/auth/login`           | Login (username, password)        |
| GET    | `/auth/me`              | Get current admin user            |
| POST   | `/auth/change-password` | Change the admin's password       |
| POST   | `/auth/logout`          | No-op on the server (stateless)   |

### Offers

| Method | Path           | Description                                                   |
| ------ | -------------- | ------------------------------------------------------------- |
| GET    | `/offers`      | List offers (pagination, search, filters, sort)               |
| GET    | `/offers/:id`  | Get offer with merchant & categories                          |
| POST   | `/offers`      | Create offer (multipart/form-data, field `attachment` optional) |
| PATCH  | `/offers/:id`  | Update offer (multipart/form-data; `removeAttachment=true` supported) |
| DELETE | `/offers/:id`  | Delete offer (also removes attachment file)                   |

**List filters (query params):**
`page`, `limit`, `search`, `merchantId`, `categoryId`, `status` (`active`|`inactive`),
`expired` (`true`|`false`), `expiryFrom`, `expiryTo`, `sortBy`
(`createdAt`|`updatedAt`|`expiryDate`|`title`), `sortOrder` (`ASC`|`DESC`).

**Offer create/update body (multipart):**

- `title` — string, required on create
- `description` — string, required on create
- `merchantId` — integer, required on create
- `categoryIds` — array or comma-separated string (e.g. `1,2,3`), required on create
- `expiryDate` — ISO date, required on create
- `status` — `active` (default) | `inactive`
- `attachment` — file (optional)
- `removeAttachment` — boolean (update only)

### Categories

| Method | Path              | Description       |
| ------ | ----------------- | ----------------- |
| GET    | `/categories`     | List / search     |
| GET    | `/categories/:id` | Get by id         |
| POST   | `/categories`     | Create            |
| PATCH  | `/categories/:id` | Update            |
| DELETE | `/categories/:id` | Delete            |

### Merchants

| Method | Path             | Description      |
| ------ | ---------------- | ---------------- |
| GET    | `/merchants`     | List / search    |
| GET    | `/merchants/:id` | Get by id        |
| POST   | `/merchants`     | Create           |
| PATCH  | `/merchants/:id` | Update           |
| DELETE | `/merchants/:id` | Delete           |

### Dashboard

| Method | Path                | Description                               |
| ------ | ------------------- | ----------------------------------------- |
| GET    | `/dashboard/stats`  | Totals: offers (all/active/expired/soon), merchants, categories |

### Uploads

Files are served at `/uploads/<filename>`. The offer object returns
`attachmentPath` (relative, e.g. `uploads/xxx.pdf`), `attachmentName` (original
filename) and `attachmentMimeType`.

## Response Envelope

All endpoints use a consistent shape:

```json
{
  "success": true,
  "message": "...",
  "data": { },
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 1 }
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": { "fields": [{ "field": "title", "message": "\"title\" is required" }] }
}
```

## Scripts

| Command              | Purpose                                 |
| -------------------- | --------------------------------------- |
| `npm run dev`        | Start server with nodemon               |
| `npm start`          | Start server (production)               |
| `npm run db:seed`    | Create/ensure the admin user            |
| `npm run lint`       | ESLint check                            |
| `npm run lint:fix`   | ESLint auto-fix                         |
| `npm run format`     | Prettier format                         |

## Notes & Next Steps

- In development, the server calls `sequelize.sync({ alter: false })` so tables
  are created if missing. For production deployments prefer real migrations
  (e.g. `sequelize-cli`) — this will be added once the schema stabilizes.
- The attachment upload is a single file per offer; switch to `upload.array()`
  if multiple attachments are later required.
- Search is implemented as `LIKE %term%` on `title` and `description`. If the
  offer list grows large, consider a dedicated full-text index or a search
  service.
- Only one admin is assumed for now. If multi-user admin is required, the
  `User.role` enum and the auth middleware already leave room for expansion.
