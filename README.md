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

3. Configure `.env` (`DB_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `API_PREFIX`).

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

- `POST /admin/offers` (multipart, `heroImageFile` required)
- `PATCH /admin/offers/:id` (multipart, `heroImageFile` optional)
- `GET /admin/offers`
- `GET /admin/offers/:id`
- `DELETE /admin/offers/:id` (soft delete only)

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

### Public

- `GET /public/site-content`

Returns:
`siteName`, `hero`, `categories`, `promotionSections`, `promotions`, `banks`, `about`, `socialLinks`.

## Scripts

- `npm run dev` - start development server
- `npm start` - start production server
- `npm run db:setup` - recreate schema and seed default admin/site content
- `npm run db:seed` - seed/reset admin account only
- `npm run lint` - run eslint
- `npm run format` - run prettier

## Important Notes

- `db:setup` currently uses `sequelize.sync({ force: true })` to recreate schema.
- Upload validation checks MIME type and file signature.
- Offer list filters/sorting/pagination are executed server-side.
