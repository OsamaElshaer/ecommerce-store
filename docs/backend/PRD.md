# Product Requirements Document (PRD)

## E-commerce Store — Nest.js (Backend) + Next.js (Frontend)

---

## 1. Overview

An e-commerce store selling products from a **single category**. Customers can browse products, add them to a cart, and complete purchases via online payment. The store is managed through a dedicated Admin dashboard.

**Project Goals:**

- Build a complete full-stack project using Nest.js and Next.js.
- Apply core concepts: authentication, authorization, order management, and payments.

---

## 2. User Roles

| Role         | Permissions                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------- |
| **Customer** | Browse products, search & filter, manage cart, checkout, track orders, manage personal account |
| **Admin**    | Manage products (CRUD), manage orders, manage users, view sales overview                       |

---

## 3. Scope

### 3.1 In Scope

- Customer & Admin registration/login (JWT-based Auth)
- Product listing & product details pages
- Search, filtering, and sorting for products
- Shopping cart
- Checkout via a real payment gateway in Test/Sandbox Mode
- Order management (for both Customer and Admin)
- Admin dashboard for managing products and orders
- Basic notifications (order confirmation email)

### 3.2 Out of Scope — Phase 1

- Multi-vendor / Seller accounts
- Mobile app
- Advanced review/rating system (can be added later)
- Multi-language support (i18n)

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

- Customer registration
- Login / Logout
- Role-based route protection (Nest.js Guards)
- Refresh Token for session renewal

### 4.2 Product Management

- Product listing with pagination
- Product details page (images, description, price, stock)
- Search by name + filters (price, availability)
- (Admin) Create / Update / Delete products
- (Admin) Upload product images

### 4.3 Cart

- Add / remove product from cart
- Update quantity
- Auto-calculated total
- Cart persisted in the database for logged-in users (not just local storage)

### 4.4 Checkout & Payments

- Enter / select shipping address
- Payment via a real gateway (Stripe or Paymob) in Test Mode
- Order confirmation after successful payment
- Handling failed payment cases

### 4.5 Order Management

- (Customer) View order history and status
- (Admin) View all orders and update their status (Pending / Shipped / Delivered / Cancelled)

### 4.6 Admin Dashboard

- Basic stats (number of orders, sales, number of products)
- Manage products and orders from a single place

---

## 5. Non-Functional Requirements

- **Security:** Password hashing (bcrypt), SQL Injection protection via ORM (TypeORM/Prisma), rate limiting on sensitive APIs
- **Performance:** Pagination for large lists, optional caching for product pages
- **Scalability:** Modular Nest.js architecture to allow easy addition of new features
- **UX:** Fully responsive UI via Next.js

---

## 6. Tech Stack

| Layer        | Technology                                |
| ------------ | ----------------------------------------- |
| Frontend     | Next.js, TypeScript, Tailwind CSS         |
| Backend      | Nest.js, TypeScript                       |
| Database     | PostgreSQL (or MySQL)                     |
| ORM          | TypeORM or Prisma                         |
| Auth         | JWT + Refresh Tokens                      |
| Payment      | Stripe / Paymob (Test Mode)               |
| File Storage | Cloudinary or AWS S3 (for product images) |
| API Docs     | Swagger (built into Nest.js)              |

---

## 7. High-Level Milestones

1. **Setup** — Initialize both projects (Nest.js + Next.js) + database connection
2. **Authentication** — Register / Login / Route protection
3. **Products Module** — Full CRUD + display on the frontend
4. **Cart Module** — Cart logic (Backend + Frontend)
5. **Checkout & Payments** — Payment gateway integration
6. **Orders Module** — Order tracking (Customer + Admin)
7. **Admin Dashboard** — Dashboard and stats
8. **Testing & Polish** — Full testing + UI/UX improvements

---

## 8. Success Criteria

- A customer can register, browse products, add to cart, and complete a full purchase successfully.
- The Admin can manage products and orders from a separate dashboard.
- All APIs are documented via Swagger.
- The project runs without major security gaps (auth guards, validation).
