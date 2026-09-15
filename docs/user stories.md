# User Stories Document
## E-commerce Store — Nest.js (Backend) + Next.js (Frontend)

Format: **As a [role], I want to [action], so that [benefit].**
Each story includes basic acceptance criteria.

---

## 1. Authentication & Account

### US-01 — Customer Registration
As a **customer**, I want to create an account with my email and password, so that I can access personalized features (cart, orders).
- **Acceptance Criteria:**
  - Email must be unique and valid format.
  - Password must be hashed (bcrypt) before storing.
  - Return a clear error if email already exists.

### US-02 — Login

As a **customer**, I want to log in with my email and password, so that I can access my account.

* **Acceptance Criteria:**

  * Successful login returns an **access token** and a **refresh token**.
  * The refresh token is stored securely as a **hash** in the database.
  * The refresh token has an expiration time.
  * Invalid credentials return a **generic authentication error** without revealing whether the email or password is incorrect.
  * The returned access token can be used to access protected endpoints.

### US-03 — Refresh Session

As a **logged-in user**, I want my session to be refreshed using my refresh token, so that I can continue using the application without logging in again.

* **Acceptance Criteria:**

  * A valid refresh token returns a **new access token** and a **new refresh token**.
  * When a refresh token is successfully used, the old refresh token is **revoked** and can no longer be used.
  * The new refresh token is stored securely as a **hash** in the database.
  * An expired refresh token is rejected and requires the user to log in again.
  * An invalid, revoked, or unknown refresh token is rejected and requires the user to log in again.
  * A refresh token that has expired in the database is rejected.


### US-04 — Logout
As a **logged-in user**, I want to log out, so that my session is securely ended.
- **Acceptance Criteria:**
  - Refresh token is invalidated server-side.

### US-05 — Admin Login
As an **admin**, I want to log in through the same login system but access admin-only routes, so that I can manage the store.
- **Acceptance Criteria:**
  - Role-based guard blocks non-admin users from admin routes.

---

## 2. Product Browsing

### US-06 — View Product List
As a **customer**, I want to see a list of available products with images, name, and price, so that I can browse what's for sale.
- **Acceptance Criteria:**
  - List is paginated.
  - Only in-stock or all products shown depending on filter.

### US-07 — View Product Details
As a **customer**, I want to view a single product's full details, so that I can decide whether to buy it.
- **Acceptance Criteria:**
  - Page shows images, description, price, and available stock.
  - Out-of-stock products are clearly marked.

### US-08 — Search Products
As a **customer**, I want to search products by name, so that I can quickly find what I'm looking for.
- **Acceptance Criteria:**
  - Search is case-insensitive and matches partial names.

### US-09 — Filter & Sort Products
As a **customer**, I want to filter products by price range and sort by price/newest, so that I can narrow down my choices.
- **Acceptance Criteria:**
  - Filters can be combined with search.

---

## 3. Cart

### US-10 — Add to Cart
As a **customer**, I want to add a product to my cart, so that I can purchase it later.
- **Acceptance Criteria:**
  - Cart is tied to the logged-in user and persisted in the database.
  - Adding the same product increases quantity instead of duplicating.

### US-11 — Update Cart Quantity
As a **customer**, I want to change the quantity of an item in my cart, so that I can adjust how much I want to buy.
- **Acceptance Criteria:**
  - Quantity cannot exceed available stock.
  - Total price updates automatically.

### US-12 — Remove from Cart
As a **customer**, I want to remove an item from my cart, so that I only pay for what I actually want.
- **Acceptance Criteria:**
  - Removing an item updates the cart total immediately.

### US-13 — View Cart Summary
As a **customer**, I want to see all items in my cart with the total price, so that I know what I'm about to pay before checkout.
- **Acceptance Criteria:**
  - Shows item-level subtotal and cart-level total.

---

## 4. Checkout & Payment

### US-14 — Enter Shipping Address
As a **customer**, I want to enter or select a shipping address during checkout, so that my order can be delivered.
- **Acceptance Criteria:**
  - Required fields validated before proceeding to payment.

### US-15 — Pay for Order
As a **customer**, I want to pay for my order using a real payment gateway (test mode), so that I can complete my purchase.
- **Acceptance Criteria:**
  - Successful payment creates an order with status "Pending".
  - Failed payment does not create a confirmed order and shows a clear error.

### US-16 — Order Confirmation
As a **customer**, I want to receive a confirmation after a successful order, so that I know my purchase went through.
- **Acceptance Criteria:**
  - Confirmation shown on-screen and sent via email.

---

## 5. Order Management

### US-17 — View Order History
As a **customer**, I want to see a list of my past orders, so that I can track my purchases.
- **Acceptance Criteria:**
  - Each order shows date, items, total, and current status.

### US-18 — View Order Status
As a **customer**, I want to check the status of a specific order, so that I know if it has shipped or been delivered.
- **Acceptance Criteria:**
  - Status values: Pending / Shipped / Delivered / Cancelled.

### US-19 — Admin: View All Orders
As an **admin**, I want to see all customer orders, so that I can manage fulfillment.
- **Acceptance Criteria:**
  - List is filterable by status.

### US-20 — Admin: Update Order Status
As an **admin**, I want to update an order's status, so that customers know the progress of their delivery.
- **Acceptance Criteria:**
  - Status change is reflected immediately in the customer's order history.

---

## 6. Product Management (Admin)

### US-21 — Admin: Add Product
As an **admin**, I want to add a new product with images, price, and stock quantity, so that customers can purchase it.
- **Acceptance Criteria:**
  - Required fields validated (name, price, stock).

### US-22 — Admin: Edit Product
As an **admin**, I want to update a product's details, so that the store stays accurate (price changes, restock, etc.).
- **Acceptance Criteria:**
  - Changes reflect immediately on the storefront.

### US-23 — Admin: Delete Product
As an **admin**, I want to remove a product from the store, so that it's no longer available for purchase.
- **Acceptance Criteria:**
  - Deleting a product doesn't break existing past orders that reference it.

---

## 7. Admin Dashboard

### US-24 — View Store Stats
As an **admin**, I want to see a quick overview of total orders, sales, and product count, so that I can track store performance at a glance.
- **Acceptance Criteria:**
  - Stats reflect real-time or near-real-time data.