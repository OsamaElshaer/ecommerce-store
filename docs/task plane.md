# Task / Sprint Plan — E-commerce Store

**Backend:** NestJS + TypeORM + PostgreSQL  
**Frontend:** Next.js + TypeScript

**Legend:**

- [ ] Done
- [ ] Pending (implementation, verification, or testing)

---

## Sprint 0 — Setup

### Backend

- [ ] Configure TypeORM and PostgreSQL connection
- [ ] Configure `@nestjs/config` and environment variables
- [ ] Configure structured logging with Pino (`nestjs-pino`)
- [ ] Verify startup environment validation and fail-fast behavior
- [ ] Verify global `ValidationPipe` and `HttpExceptionFilter`
- [ ] Verify Swagger at `/api/docs`
- [ ] Verify `GET /health`
- [ ] Final setup verification and cleanup

### Frontend

- [ ] Create Next.js app with App Router, TypeScript, and Tailwind
- [ ] Configure `.env.local`
- [ ] Install React Query, Zustand, React Hook Form, and Zod
- [ ] Set up `lib/api/client.ts`
- [ ] Configure root `layout.tsx` and React Query provider

### Both

- [ ] Verify frontend can call `GET /health`
- [ ] Confirm Git repository and initial project commits

---

## Sprint 1 — Authentication

### Backend

- [ ] `User` entity and migration
- [ ] Register and login endpoints
- [ ] Password hashing with bcrypt
- [ ] JWT access and refresh token issuing
- [ ] `JwtStrategy` and `JwtAuthGuard`
- [ ] `RolesGuard` and `@Roles()` decorator
- [ ] `POST /auth/refresh` and `POST /auth/logout`
- [ ] Refresh token rotation and selector-based lookup
- [ ] Refresh token cleanup cron job
- [ ] Structured request and authentication event logging
- [ ] Password reset token infrastructure
- [ ] Mail service integration with Gmail SMTP
- [ ] Reset-password service logic
- [ ] Verify `POST /auth/forgot-password` endpoint is registered in the controller
- [ ] Complete Google OAuth strategy and endpoints
- [ ] Review password-hash null handling for OAuth users
- [ ] Add e2e tests for register/login and duplicate email
- [ ] Decide on test database strategy

### Frontend

- [ ] `authStore` using Zustand
- [ ] `/register` page and form
- [ ] `/login` page and form
- [ ] `lib/api/auth.api.ts`
- [ ] Silent refresh on app load
- [ ] Authentication-aware route protection
- [ ] Navbar authentication state

### Milestone

- [ ] Register → login → access protected route → verify unauthenticated requests are rejected

---

## Sprint 2 — Products Module

### Backend

- [ ] `Product` entity and migration
- [ ] `ProductImage` entity and migration/relationships
- [ ] Local image uploads using Multer
- [ ] Multiple product image upload
- [ ] Product image management — add/delete images
- [ ] `GET /products` with pagination, search, filtering, and sorting
- [ ] `GET /products/:id`
- [ ] Product create, update, and delete endpoints
- [ ] Admin guards for product mutations
- [ ] Product DTO validation and error handling
- [ ] Swagger documentation and Bearer authentication
- [ ] Verify physical image files are deleted when products/images are deleted
- [ ] Add e2e tests for CRUD, search, filtering, and sorting
- [ ] Test edge cases: empty results and invalid price ranges
- [ ] Review image storage abstraction for future Cloudinary/S3 support

### Frontend

- [ ] `lib/api/products.api.ts`
- [ ] `useProducts(filters)` hook
- [ ] `ProductCard` and `ProductFilters`
- [ ] `/products` listing page
- [ ] `/products/[id]` details page
- [ ] Admin `ProductForm`
- [ ] Admin product listing, creation, and editing pages

### Milestone

- [ ] Admin creates a product with images → storefront displays it → search and filters work

---

## Sprint 3 — Cart and Category Modules

### Backend — Cart

- [ ] `Cart` entity and migration
- [ ] `CartItem` entity and migration
- [ ] One cart per user constraint
- [ ] Unique `(cart_id, product_id)` constraint
- [ ] `GET /cart` with empty-cart creation
- [ ] `POST /cart/items` with stock validation
- [ ] `PATCH /cart/items/:itemId`
- [ ] `DELETE /cart/items/:itemId`
- [ ] Transactions and pessimistic cart locking for cart mutations
- [ ] Pino logging for cart operations
- [ ] Verify concurrent cart creation is handled correctly
- [ ] Verify database constraints match the migrations
- [ ] Test adding the same product twice
- [ ] Test quantity greater than stock
- [ ] Test updating and deleting another user's cart item
- [ ] Test concurrent cart modifications

### Backend — Category

- [ ] `Category` entity and migration
- [ ] Connect `Category 1:N Product` and add `category_id`
- [ ] `CategoriesModule`, service, and controller
- [ ] Category DTOs and validation
- [ ] CRUD endpoints
- [ ] Admin guards for create/update/delete
- [ ] Prevent duplicate category names and slugs
- [ ] Add category filter to `GET /products`
- [ ] Swagger documentation
- [ ] Pino logging
- [ ] Tests and error handling
- [ ] Conventional commit

### Frontend

- [ ] `lib/api/cart.api.ts`
- [ ] `useCart()`, `useAddToCart()`, `useUpdateCartItem()`, `useRemoveCartItem()`
- [ ] Add-to-cart buttons on product cards and details
- [ ] `/cart` page with `CartItem` and `CartSummary`
- [ ] Cart icon/count in Navbar

### Milestone

- [ ] Add products to cart, update quantities, remove items, and verify totals

---

## Sprint 4 — Addresses, Checkout, and Orders

### Backend — Addresses

- [ ] `Address` entity and migration
- [ ] Verify address CRUD endpoints
- [ ] Validate address ownership during checkout
- [ ] Test address ownership and deletion behavior

### Backend — Order Creation

- [ ] `Order` entity and migration
- [ ] `OrderItem` entity and migration
- [ ] `POST /orders/checkout`
- [ ] Build order items from the user's cart
- [ ] Store product name, image, and unit-price snapshots
- [ ] Store shipping-address snapshots
- [ ] Revalidate product availability and stock during checkout
- [ ] Lock cart and products inside a database transaction
- [ ] Decrement stock atomically during checkout
- [ ] Clear cart items after successful order creation
- [ ] Roll back database changes if checkout fails
- [ ] Test empty-cart checkout
- [ ] Test insufficient stock and inactive products
- [ ] Test concurrent checkouts for the last available item

### Backend — Order Management

- [ ] `GET /orders` — current user's orders with pagination
- [ ] `GET /orders/:id` — current user's order only
- [ ] `PATCH /orders/:id/cancel`
- [ ] Cancellation restricted to pending orders
- [ ] Restore stock when a pending order is cancelled
- [ ] Admin order listing with status filtering and pagination
- [ ] `PATCH /orders/:id/status` with admin authorization
- [ ] Validate allowed order-status transitions
- [ ] Pino logging for checkout and order operations
- [ ] Verify `OrdersModule` registers the correct controller class
- [ ] Verify `RolesGuard` is available in `OrdersModule`
- [ ] Test that customers cannot access other users' orders
- [ ] Test admin-only endpoints
- [ ] Test cancellation and stock restoration
- [ ] Test invalid status transitions
- [ ] Review behavior when a referenced product has been deleted
- [ ] Add e2e tests for checkout, cancellation, and order management

### Backend — Payments (Paymob, test mode)

- [ ] `Payment` entity and migration (one-to-many with `Order`)
- [ ] Swappable `PaymentProvider` abstraction (one active gateway via `PAYMENT_PROVIDER`)
- [ ] Paymob integration in test mode (payment intention + checkout URL)
- [ ] `POST /payments` with `Idempotency-Key` header
- [ ] Database-enforced one active payment per order (partial unique index)
- [ ] Webhook signature verification (HMAC-SHA512) and amount/currency check
- [ ] Idempotent webhook handling with row locks
- [ ] Payment and order status synchronization (`succeeded` → order `confirmed`)
- [ ] Stock is reserved at checkout, not at payment
- [ ] `GET /orders/:id/payment-status`
- [ ] Job to cancel unpaid pending orders, restore stock, and close their payments
- [ ] Handle refunds and voids from the gateway
- [ ] Handle order cancellation while a payment is in progress
- [ ] e2e tests for payments (create, idempotency, webhook) using a fake provider
- [ ] Test failed and cancelled payments

### Frontend

- [ ] Address form and address list
- [ ] Checkout page and address selection
- [ ] `lib/api/orders.api.ts`
- [ ] `useOrders()` and `useOrder(id)` hooks
- [ ] Orders list and details pages
- [ ] Order confirmation page
- [ ] Payment flow: call `POST /payments`, redirect to `checkoutUrl`, then poll `payment-status`

### Milestone

- [ ] Customer completes checkout → order is created → stock and cart update correctly → order can be viewed and cancelled according to its status

---

## Sprint 5 — Admin Dashboard

### Backend

- [ ] Create admin statistics endpoint: `GET /admin/stats`
- [ ] Aggregate total orders, sales, products, and orders by status
- [ ] Apply admin authorization
- [ ] Test aggregate results against database records

### Frontend

- [ ] Admin statistics API call
- [ ] `StatsCard` component
- [ ] `/admin` dashboard page

### Milestone

- [ ] Admin dashboard displays accurate statistics

---

## Sprint 6 — Testing and Polish

- [ ] e2e tests for authentication
- [ ] e2e tests for product CRUD
- [ ] e2e tests for cart and category modules
- [ ] e2e tests for checkout, cancellation, and order status
- [ ] Test concurrent stock depletion
- [ ] Test authorization and validation edge cases
- [ ] Review API responses and error handling
- [ ] Verify Swagger matches actual endpoints
- [ ] Responsive testing on mobile, tablet, and desktop
- [ ] Add loading, empty, and error states in the frontend
- [ ] Deploy backend, frontend, and database to staging
- [ ] Run end-to-end smoke tests in staging
