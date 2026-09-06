# Task / Sprint Plan — Detailed

## E-commerce Store — Nest.js (Backend) + Next.js (Frontend)

Task-by-task breakdown of every sprint. Check items off as you go. Order within each sprint is suggested — backend task before its matching frontend task, so you always have something to test against.

---

## Sprint 0 — Setup

**Backend**

- [ ] `nest new backend`, clean up default files
- [ ] Install & configure TypeORM/Prisma, connect to PostgreSQL
- [ ] Create `.env` and `.env.example` (from the Environment Variables doc)
- [ ] Set up `@nestjs/config` with startup validation (fail fast if a required var is missing)
- [ ] Set up global `ValidationPipe`, `HttpExceptionFilter`
- [ ] Set up Swagger at `/api/docs`
- [ ] Create a `GET /health` route, confirm it responds

**Frontend**

- [ ] `create-next-app frontend` (App Router, TypeScript, Tailwind)
- [ ] Set up `.env.local` (`NEXT_PUBLIC_API_URL`, etc.)
- [ ] Install React Query, Zustand, React Hook Form, Zod
- [ ] Set up `lib/api/client.ts` (base fetch/axios wrapper)
- [ ] Set up root `layout.tsx` with React Query provider

**Both**

- [ ] Confirm frontend can call `GET /health` on the backend successfully
- [ ] Git repo initialized, first commit pushed

---

## Sprint 1 — Authentication

**Backend**

- [ ] Create `User` entity + migration
- [ ] `auth` module: `register`, `login` endpoints
- [ ] Password hashing with bcrypt
- [ ] JWT access + refresh token issuing
- [ ] `JwtStrategy`, `AuthGuard`
- [ ] `RolesGuard` + `@Roles()` decorator
- [ ] `POST /auth/refresh`, `POST /auth/logout`
- [ ] Write e2e tests for register/login (happy path + duplicate email)

**Frontend**

- [ ] `authStore` (Zustand) — user, accessToken, setAuth/clearAuth
- [ ] `/register` page + form (React Hook Form + Zod)
- [ ] `/login` page + form
- [ ] `lib/api/auth.api.ts` — register, login, refresh, logout calls
- [ ] Silent refresh on app load
- [ ] `middleware.ts` — redirect unauthenticated users away from customer/admin routes
- [ ] Navbar shows login/register vs account menu based on auth state

**Milestone check:** Register → login → hit a protected test route → get blocked when logged out.

---

## Sprint 2 — Products Module

**Backend**

- [ ] `Product` entity + migration
- [ ] `storage` module — Cloudinary/S3 upload service
- [ ] `GET /products` with pagination, search, filter, sort
- [ ] `GET /products/:id`
- [ ] `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` (Admin-guarded)
- [ ] e2e tests for CRUD + search/filter edge cases (empty results, invalid price range)

**Frontend**

- [ ] `lib/api/products.api.ts`
- [ ] `useProducts(filters)` hook (React Query)
- [ ] `ProductCard`, `ProductFilters` components
- [ ] `/products` listing page
- [ ] `/products/[id]` details page
- [ ] Admin: `ProductForm` component
- [ ] Admin: `/admin/products` (table), `/admin/products/new`, `/admin/products/[id]/edit`

**Milestone check:** Admin adds a product with an image → shows correctly on storefront → search/filter work.

---

## Sprint 3 — Cart Module

**Backend**

- [ ] `Cart`, `CartItem` entities + migrations
- [ ] `GET /cart` (auto-create empty cart if none exists)
- [ ] `POST /cart/items` (with stock validation)
- [ ] `PATCH /cart/items/:itemId`
- [ ] `DELETE /cart/items/:itemId`
- [ ] e2e tests: add beyond stock, add same product twice (should increment)

**Frontend**

- [ ] `lib/api/cart.api.ts`
- [ ] `useCart()`, `useAddToCart()`, `useUpdateCartItem()`, `useRemoveCartItem()` hooks
- [ ] "Add to Cart" button on `ProductCard` and Product Details
- [ ] `/cart` page — `CartItem`, `CartSummary`
- [ ] Cart icon/count in Navbar

**Milestone check:** Build a cart, change quantities, see accurate live total.

---

## Sprint 4 — Checkout & Payments

_(Highest-risk sprint — consider splitting into 4a: Addresses + Order creation, and 4b: Payment integration)_

**Backend — 4a**

- [ ] `Address` entity + migration
- [ ] `GET/POST/PATCH/DELETE /addresses`
- [ ] `Order`, `OrderItem` entities + migrations
- [ ] `POST /checkout` — creates Order + OrderItems from cart (status `pending`), validates stock again at this point

**Backend — 4b**

- [ ] `Payment` entity + migration
- [ ] Integrate chosen gateway SDK (Stripe or Paymob), test mode keys
- [ ] `payments` module — create payment intent inside `POST /checkout`
- [ ] `POST /payments/webhook` — verify signature, update `Payment`/`Order` status, decrement stock on success
- [ ] `GET /orders/:id/payment-status`
- [ ] e2e test: full checkout flow with a test-mode payment

**Frontend — 4a**

- [ ] `AddressForm`, `AddressList` components
- [ ] `/checkout` page — address step

**Frontend — 4b**

- [ ] `PaymentForm` component (Stripe.js/Paymob elements)
- [ ] Wire checkout submission → payment confirmation
- [ ] `/orders/[id]` confirmation view, polling `payment-status` until resolved

**Milestone check:** Full test-mode purchase works end-to-end: cart → address → pay → webhook confirms → order created → confirmation shown.

---

## Sprint 5 — Order Management

**Backend**

- [ ] `GET /orders` (customer — own orders only)
- [ ] `GET /orders/:id` (customer: own only / admin: any)
- [ ] `GET /orders` admin variant with `status` filter + pagination
- [ ] `PATCH /orders/:id/status` (Admin) with valid-transition checks
- [ ] e2e tests: customer can't access another user's order, invalid status transition rejected

**Frontend**

- [ ] `lib/api/orders.api.ts`
- [ ] `useOrders()`, `useOrder(id)` hooks
- [ ] `/orders` — `OrderCard` list
- [ ] `/orders/[id]` — `OrderStatusBadge`, `OrderItemsList`
- [ ] Admin: `/admin/orders` — `DataTable` + status filter
- [ ] Admin: `/admin/orders/[id]` — `StatusSelect` to update status

**Milestone check:** Customer sees order status update (on refresh) as admin changes it.

---

## Sprint 6 — Admin Dashboard

**Backend**

- [ ] `admin` module — `GET /admin/stats` (aggregation query: total orders, total sales, total products, orders by status)

**Frontend**

- [ ] `lib/api` call for admin stats
- [ ] `StatsCard` component
- [ ] `/admin` dashboard page

**Milestone check:** Dashboard shows accurate live counts.

---

## Sprint 7 — Testing & Polish

- [ ] e2e tests: full auth flow, full product CRUD, full checkout-to-delivery flow
- [ ] Edge cases: empty-cart checkout, concurrent stock depletion (two users buying the last item)
- [ ] Responsive pass on all customer-facing pages (mobile/tablet/desktop)
- [ ] Loading states (`Skeleton`/`Spinner`) and error states across every data-fetching page
- [ ] Cross-check API doc vs actual Swagger output, fix drift
- [ ] Basic deployment: backend + frontend + DB to a staging environment
- [ ] Smoke test the deployed staging environment end-to-end

**Milestone check:** Someone unfamiliar with the project can register and buy something on staging without hitting a dead end.

---

## Notes

- Check off items as you go — this doubles as a progress tracker, not just a plan.
- If a sprint is taking noticeably longer than the others, that's a signal to split it further (like Sprint 4 already is) rather than pushing through — small checkable tasks keep momentum better than one big vague sprint.
