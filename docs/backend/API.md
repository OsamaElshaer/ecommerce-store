# API Documentation

## E-commerce Store — Nest.js Backend

Base URL: `/api/v1`
Auth: `Bearer <access_token>` in the `Authorization` header, unless marked **Public**.
Roles: **Customer**, **Admin** — enforced via Nest.js Guards.

> Note: This doc is a manual reference. In the actual project, generate/maintain this automatically via **Swagger** (`@nestjs/swagger`) so it stays in sync with the code.

---

## 1. Auth

### `POST /auth/register` — Public

Register a new customer.

- **Body:** `{ email, password, full_name }`
- **Response 201:** `{ id, email, full_name, role }`
- **Errors:** `409` email already exists, `400` validation error

### `POST /auth/login` — Public

- **Body:** `{ email, password }`
- **Response 200:** `{ access_token, refresh_token, user: { id, email, role } }`
- **Errors:** `401` invalid credentials

### `POST /auth/refresh` — Public (requires refresh token)

- **Body:** `{ refresh_token }`
- **Response 200:** `{ access_token }`
- **Errors:** `401` invalid/expired refresh token

### `POST /auth/logout` — Customer/Admin

- **Response 200:** `{ message: "Logged out" }`
- **Effect:** invalidates refresh token server-side

---

## 2. Products

### `GET /products` — Public

Query params: `page`, `limit`, `search`, `minPrice`, `maxPrice`, `sort` (`price_asc` | `price_desc` | `newest`)

- **Response 200:**

```json
{
  "data": [ { "id", "name", "price", "stock", "image_url", "is_active" } ],
  "meta": { "page": 1, "limit": 20, "total": 57 }
}
```

### `GET /products/:id` — Public

- **Response 200:** `{ id, name, description, price, stock, image_url, is_active }`
- **Errors:** `404` not found

### `POST /products` — Admin only

- **Body:** `{ name, description, price, stock, image_url }`
- **Response 201:** created product object
- **Errors:** `400` validation error

### `PATCH /products/:id` — Admin only

- **Body:** any subset of product fields
- **Response 200:** updated product object
- **Errors:** `404` not found

### `DELETE /products/:id` — Admin only

- **Response 200:** `{ message: "Product deleted" }`
- **Note:** soft-delete recommended (`is_active = false`) to avoid breaking past `OrderItem` references

---

## 3. Cart

All endpoints below require Customer auth and operate on **the logged-in user's cart**.

### `GET /cart`

- **Response 200:**

```json
{
  "id": "cart-uuid",
  "items": [ { "id", "product": { "id", "name", "price", "image_url" }, "quantity" } ],
  "total": 450.00
}
```

### `POST /cart/items`

Add a product to the cart (or increase quantity if it already exists).

- **Body:** `{ product_id, quantity }`
- **Response 201:** updated cart object
- **Errors:** `400` quantity exceeds stock, `404` product not found

### `PATCH /cart/items/:itemId`

Update quantity of a specific cart item.

- **Body:** `{ quantity }`
- **Response 200:** updated cart object
- **Errors:** `400` quantity exceeds stock

### `DELETE /cart/items/:itemId`

- **Response 200:** updated cart object

---

## 4. Addresses

### `GET /addresses` — Customer

- **Response 200:** array of the user's saved addresses

### `POST /addresses` — Customer

- **Body:** `{ street, city, country, phone, is_default }`
- **Response 201:** created address object

### `PATCH /addresses/:id` — Customer

- **Body:** any subset of address fields
- **Response 200:** updated address object

### `DELETE /addresses/:id` — Customer

- **Response 200:** `{ message: "Address deleted" }`

---

## 5. Checkout & Payment

Payment is a separate step after checkout. The flow is:
`POST /orders/checkout` → `POST /payments` → customer pays on the gateway page → webhook confirms → `GET /orders/:id/payment-status`.

### `POST /orders/checkout` — Customer

Creates an order from the current cart.

- **Body:** `{ address_id }`
- **Effect:** creates `Order` (status `pending`) + `OrderItem`s from the cart, and reserves stock immediately
- **Errors:** `400` cart is empty, `400` insufficient stock on one or more items

### `POST /payments` — Customer (own order only)

Starts a payment for a pending order and returns the gateway checkout URL.

- **Headers:** `Idempotency-Key: <unique string>` (required, one per payment attempt)
- **Body:** `{ order_id }`
- **Response 201:**

```json
{
    "providerRef": "123456",
    "clientData": {
        "checkoutUrl": "https://eg.checkout.paymob.com/?publicKey=...&clientSecret=...",
        "clientSecret": "..."
    }
}
```

- **Effect:** creates a `Payment` (status `pending`) and a Paymob payment intention. The frontend redirects the customer to `clientData.checkoutUrl`.
- **Idempotency:** the same `Idempotency-Key` for the same order returns the same result and never creates a second payment. An order can have only one active (`pending` or `succeeded`) payment at a time.
- **Errors:** `400` missing `Idempotency-Key`, `404` order not found, `409` order is not pending / already paid / key already used, `502` gateway error

### `POST /payments/webhook` — Public (gateway-signed)

Called by Paymob (server to server). This is the source of truth for the payment result.

- **Security:** the `hmac` query parameter is verified with HMAC-SHA512 using `PAYMOB_HMAC_SECRET`. Amount and currency are checked against the stored payment.
- **Effect on success:** `Payment.status` → `succeeded` and `Order.status` → `confirmed`
- **Effect on failure:** only logged. The payment stays `pending` because the customer can retry on the same checkout page.
- **Response 200:** `{ received: true }` (repeated webhooks are safe and ignored)
- **Errors:** `400` invalid signature

### `GET /orders/:id/payment-status` — Customer (own order only)

Used by the frontend (polling) after the customer returns from the gateway.

- **Response 200:** `{ status: "pending" | "succeeded" | "failed" }`
- **Errors:** `404` order not found or has no payments
## 6. Orders

### `GET /orders` — Customer

Returns the logged-in customer's own orders.

- **Response 200:** array of `{ id, total_price, status, created_at, items: [...] }`

### `GET /orders/:id` — Customer (own order only) / Admin (any order)

- **Response 200:** full order details including items, address, and payment status
- **Errors:** `403` if a customer requests another user's order, `404` not found

### `GET /orders` — Admin

Admin variant with extra query params: `status`, `page`, `limit`

- **Response 200:** paginated list of all orders

### `PATCH /orders/:id/status` — Admin only

- **Body:** `{ status: "pending" | "shipped" | "delivered" | "cancelled" }`
- **Response 200:** updated order object
- **Errors:** `400` invalid status transition (e.g. can't go from `delivered` back to `pending`)

---

## 7. Admin Dashboard

### `GET /admin/stats` — Admin only

- **Response 200:**

```json
{
    "total_orders": 340,
    "total_sales": 125430.5,
    "total_products": 48,
    "orders_by_status": {
        "pending": 12,
        "shipped": 20,
        "delivered": 300,
        "cancelled": 8
    }
}
```

---

## 8. Common Error Format

All error responses follow this shape:

```json
{
    "statusCode": 400,
    "message": "Quantity exceeds available stock",
    "error": "Bad Request"
}
```

---

## 9. Auth Guards Summary

| Route group                            | Guard                           |
| -------------------------------------- | ------------------------------- |
| `/products` (GET)                      | Public                          |
| `/products` (POST/PATCH/DELETE)        | AdminGuard                      |
| `/cart/*`                              | AuthGuard (customer)            |
| `/addresses/*`                         | AuthGuard (customer)            |
| `/checkout`                            | AuthGuard (customer)            |
| `/orders` (customer view)              | AuthGuard (customer)            |
| `/orders` (admin view + status update) | AdminGuard                      |
| `/admin/*`                             | AdminGuard                      |
| `/payments/webhook`                    | Public + signature verification |
| `/payments`                            | AuthGuard (customer)            |
| `/orders/:id/payment-status`           | AuthGuard (customer)            |