# Routing Map
## E-commerce Store — Next.js Frontend

Every route, its access level, and its purpose. Matches the route groups defined in the Folder Structure doc.

---

## 1. Public Routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Home page, featured products | Public |
| `/products` | Product listing with search/filter/sort | Public |
| `/products/[id]` | Product details | Public |
| `/login` | Login form | Public (redirect to `/` if already logged in) |
| `/register` | Registration form | Public (redirect to `/` if already logged in) |

---

## 2. Customer Routes

All require a valid session; redirect to `/login` if not authenticated.

| Route | Purpose | Access |
|---|---|---|
| `/cart` | View/edit cart | Customer |
| `/checkout` | Address + payment | Customer |
| `/orders` | Order history | Customer |
| `/orders/[id]` | Order details + status | Customer (own orders only — enforced by backend too) |
| `/account` | Profile info | Customer |
| `/account/addresses` | Manage saved addresses | Customer |

---

## 3. Admin Routes

All require an authenticated **admin** user; redirect non-admins (even logged-in customers) to `/` or a 403 page.

| Route | Purpose | Access |
|---|---|---|
| `/admin` | Dashboard stats | Admin |
| `/admin/products` | Product list (table view) | Admin |
| `/admin/products/new` | Create product | Admin |
| `/admin/products/[id]/edit` | Edit product | Admin |
| `/admin/orders` | All orders (filterable by status) | Admin |
| `/admin/orders/[id]` | Order details + status update | Admin |

---

## 4. Access Control Enforcement

Enforced at **two layers** — never rely on the frontend alone:

1. **`middleware.ts`** (Next.js) — redirects before the page even renders:
   - No token → block `(customer)` and `admin` routes, redirect to `/login`
   - Token present but role ≠ `admin` → block `admin/*`, redirect to `/`
2. **Nest.js backend Guards** — the real enforcement. Every protected endpoint checks the JWT and role server-side regardless of what the frontend allows, since a user could bypass the frontend entirely.

---

## 5. Redirect Rules Summary

| Condition | Redirect To |
|---|---|
| Unauthenticated user visits a customer route | `/login?redirect=<original-path>` |
| Authenticated customer visits `/login` or `/register` | `/` |
| Non-admin visits any `/admin/*` route | `/` (or a 403 page) |
| Successful login | Wherever `redirect` query param points, else `/` |
| Successful checkout | `/orders/[id]` (the new order's confirmation) |

---

## 6. Route ↔ API Mapping Quick Reference

| Frontend Route | Primary API Calls |
|---|---|
| `/products` | `GET /products` |
| `/products/[id]` | `GET /products/:id` |
| `/cart` | `GET /cart`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` |
| `/checkout` | `GET /addresses`, `POST /checkout` |
| `/orders` | `GET /orders` |
| `/orders/[id]` | `GET /orders/:id`, `GET /orders/:id/payment-status` |
| `/admin` | `GET /admin/stats` |
| `/admin/products` | `GET /products`, `DELETE /products/:id` |
| `/admin/products/new` | `POST /products` |
| `/admin/products/[id]/edit` | `GET /products/:id`, `PATCH /products/:id` |
| `/admin/orders` | `GET /orders` (admin variant) |
| `/admin/orders/[id]` | `GET /orders/:id`, `PATCH /orders/:id/status` |
