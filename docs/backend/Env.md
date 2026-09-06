# Environment Variables Documentation

## E-commerce Store — Nest.js Backend

This file documents every environment variable the backend needs. Keep an actual `.env.example` (with placeholder values, no secrets) committed to the repo, and a real `.env` (git-ignored) for local values.

---

## 1. App

| Variable       | Description                                  | Example                      |
| -------------- | -------------------------------------------- | ---------------------------- |
| `NODE_ENV`     | Environment mode                             | `development` / `production` |
| `PORT`         | Port the Nest.js server listens on           | `3000`                       |
| `API_PREFIX`   | Global route prefix                          | `api/v1`                     |
| `FRONTEND_URL` | Next.js app URL, used for CORS + email links | `http://localhost:3001`      |

---

## 2. Database

| Variable      | Description                                                 | Example        |
| ------------- | ----------------------------------------------------------- | -------------- |
| `DB_HOST`     | Database host                                               | `localhost`    |
| `DB_PORT`     | Database port                                               | `5432`         |
| `DB_USERNAME` | Database user                                               | `postgres`     |
| `DB_PASSWORD` | Database password                                           | `********`     |
| `DB_NAME`     | Database name                                               | `ecommerce_db` |
| `DB_SYNC`     | Auto-sync schema (TypeORM) — **never `true` in production** | `false`        |

---

## 3. Auth / JWT

| Variable                 | Description                                               | Example    |
| ------------------------ | --------------------------------------------------------- | ---------- |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens                          | `********` |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime                                     | `15m`      |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens (different from access) | `********` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                                    | `7d`       |

---

## 4. Payment Gateway (Stripe or Paymob — Test Mode)

Pick the set matching whichever gateway you go with.

### Stripe

| Variable                | Description                          | Example       |
| ----------------------- | ------------------------------------ | ------------- |
| `STRIPE_SECRET_KEY`     | Server-side secret key (test mode)   | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming webhook signatures | `whsec_...`   |

### Paymob

| Variable                | Description                            | Example    |
| ----------------------- | -------------------------------------- | ---------- |
| `PAYMOB_API_KEY`        | Server-side API key (test mode)        | `********` |
| `PAYMOB_INTEGRATION_ID` | Payment integration ID                 | `********` |
| `PAYMOB_HMAC_SECRET`    | Verifies webhook callback authenticity | `********` |

---

## 5. File Storage (Product Images)

### Cloudinary

| Variable                | Description             | Example           |
| ----------------------- | ----------------------- | ----------------- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `your-cloud-name` |
| `CLOUDINARY_API_KEY`    | API key                 | `********`        |
| `CLOUDINARY_API_SECRET` | API secret              | `********`        |

### (Alternative) AWS S3

| Variable                | Description    | Example                    |
| ----------------------- | -------------- | -------------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM access key | `********`                 |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | `********`                 |
| `AWS_REGION`            | Bucket region  | `eu-central-1`             |
| `AWS_S3_BUCKET`         | Bucket name    | `ecommerce-product-images` |

---

## 6. Email Service (Order Confirmations)

| Variable        | Description            | Example                     |
| --------------- | ---------------------- | --------------------------- |
| `MAIL_HOST`     | SMTP host              | `smtp.mailgun.org`          |
| `MAIL_PORT`     | SMTP port              | `587`                       |
| `MAIL_USER`     | SMTP username          | `postmaster@yourdomain.com` |
| `MAIL_PASSWORD` | SMTP password          | `********`                  |
| `MAIL_FROM`     | Default "from" address | `no-reply@yourstore.com`    |

---

## 7. `.env.example` Template

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=ecommerce_db
DB_SYNC=false

# Auth
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

# Payment Gateway (Stripe example)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# File Storage (Cloudinary example)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=no-reply@yourstore.com
```

---

## 8. Notes

- **Never commit `.env`** — only `.env.example` with empty/placeholder values.
- Add a **startup validation step** (e.g. using `Joi` or `class-validator` with `@nestjs/config`) so the app fails fast with a clear error if a required variable is missing, instead of failing later at runtime.
- Use different secrets per environment (dev / staging / production) — never reuse `JWT_ACCESS_SECRET` or gateway keys across environments.
- Keep `DB_SYNC=false` outside local development; use migrations instead once the schema stabilizes.
