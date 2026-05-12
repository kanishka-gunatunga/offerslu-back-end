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

- **Text:** `title`, `description`, `startDate`, `endDate` (ISO dates), `companyName` (**required on POST**), optional `offerDetails`, optional `companyLogoUrl` (string; ignored if you upload a logo file).
- **Files:** `heroImageFile` (required on **POST**), `companyLogoFile` (optional on POST/PATCH).
- **Relations (arrays):** `offerTypeIds`, `categoryIds`, `merchantIds`, `paymentIds`, `bankIds`, `locationIds` (same names as before; repeat keys or comma-separated as supported by the parser).

Endpoints:

- `POST /admin/offers` (multipart)
- `PATCH /admin/offers/:id` (multipart; `heroImageFile` / `companyLogoFile` optional)
- `GET /admin/offers`
- `GET /admin/offers/:id`
- `DELETE /admin/offers/:id` (soft delete only)

**Limits:** Multer rejects any single file over `MAX_UPLOAD_SIZE_MB` (default 10 MB). After upload, hero and company logo are validated again to `HERO_IMAGE_MAX_SIZE_MB` (default 5 MB) and must be JPEG/PNG/WebP/GIF with a matching binary signature. Bodies are still subject to the Express urlencoded/json limits for non-file parts.

**Vercel:** Files are written under `UPLOAD_DIR` (defaults to `/tmp/...` on Vercel); this is **ephemeral** serverless storage unless you add external object storage (S3, etc.).

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

### Public

- `GET /public/site-content`

Returns:
`siteName`, `hero`, `categories`, `promotionSections`, `promotions`, `banks`, `about`, `socialLinks`.

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
