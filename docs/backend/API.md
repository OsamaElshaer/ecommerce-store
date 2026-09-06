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

### `POST /checkout`

Initiates checkout from the current cart.

- **Body:** `{ address_id }`
- **Response 200:**

```json
{
    "order_id": "order-uuid",
    "payment": { "client_secret": "...", "provider": "stripe" }
}
```

- **Effect:** creates `Order` (status `pending`) + `OrderItem`s from current cart, creates a `Payment` record, returns whatever the gateway (Stripe/Paymob) needs to complete payment client-side
- **Errors:** `400` cart is empty, `400` insufficient stock on one or more items

### `POST /payments/webhook` — Public (gateway-signed)

Receives payment confirmation from Stripe/Paymob.

- **Effect:** updates `Payment.status` and `Order.status` based on gateway result; decrements product stock on success
- **Errors:** `400` invalid signature

### `GET /orders/:id/payment-status` — Customer (own order only)

- **Response 200:** `{ status: "pending" | "succeeded" | "failed" }`

---

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
