# Entity Relationship Diagram (ERD)

## E-commerce Store — Nest.js (Backend) + Next.js (Frontend)

Based on the PRD and User Stories: single product category, Customer + Admin roles, cart persisted per user, checkout via a real payment gateway (test mode).

---

## 1. Diagram

```mermaid
erDiagram
    USER ||--o| CART : has
    USER ||--o{ ORDER : places
    USER ||--o{ ADDRESS : owns
    USER ||--o{ REFRESH_TOKEN : has
    CART ||--o{ CART_ITEM : contains
    CART_ITEM }o--|| PRODUCT : references
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER_ITEM }o--|| PRODUCT : references
    ORDER ||--|| PAYMENT : has
    ORDER }o--|| ADDRESS : "ships to"

    USER {
        uuid id PK
        string email UK
        string password_hash "nullable - null for OAuth-only users"
        string full_name
        string role "customer | admin"
        timestamp created_at
    }

    ADDRESS {
        uuid id PK
        uuid user_id FK
        string street
        string city
        string country
        string phone
        boolean is_default
    }

    PRODUCT {
        uuid id PK
        string name
        text description
        decimal price
        int stock
        string image_url
        boolean is_active
        timestamp created_at
    }

    CART {
        uuid id PK
        uuid user_id FK
        timestamp updated_at
    }

    CART_ITEM {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        int quantity
    }

    ORDER {
        uuid id PK
        uuid user_id FK
        uuid address_id FK
        decimal total_price
        string status "pending | shipped | delivered | cancelled"
        timestamp created_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }

    PAYMENT {
        uuid id PK
        uuid order_id FK
        string provider "stripe | paymob"
        string status "pending | succeeded | failed"
        string transaction_ref
        decimal amount
        timestamp created_at
    }
    REFRESH_TOKEN {
        uuid id PK
        uuid user_id FK
        string selector "unique"
        string token_hash
        boolean is_revoked "default false"
        timestamp expires_at
        timestamp created_at
    }
```

---

## 2. Entities Overview

| Entity        | Purpose                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| **User**      | Customers and Admins (differentiated by `role`)                                                                   |
| **Address**   | Shipping addresses linked to a user                                                                               |
| **Product**   | Store items (single category, so no separate Category table needed)                                               |
| **Cart**      | One active cart per user                                                                                          |
| **CartItem**  | Products inside a user's cart, with quantity                                                                      |
| **Order**     | A confirmed purchase, snapshot of cart at checkout time                                                           |
| **OrderItem** | Line items of an order, storing `unit_price` at time of purchase (so later price changes don't affect old orders) |
| **Payment**   | Payment attempt/result tied to an order                                                                           |

---

## 3. Key Design Decisions

- **`unit_price` is duplicated in `OrderItem`** instead of always reading from `Product`, so historical orders stay accurate even if the product price changes later.
- **`Cart` is one-to-one with `User`** (a user has a single active cart) — simpler than session-based carts since all customers are logged in.
- **`Order` and `Payment` are one-to-one** — one payment attempt per order in this phase. If you later support retries, this can become one-to-many.
- **No `Category` table** — since the store sells a single product category, this avoids unnecessary complexity for phase 1. Easy to add later if the store expands.
- **`Address` is a separate table** (not embedded in `Order`) so users can save and reuse multiple addresses, while `Order.address_id` still snapshots which one was used.

---

## 4. Relationships Summary

- One `User` → one `Cart`
- One `User` → many `Address`
- One `User` → many `Order`
- One `Cart` → many `CartItem`
- One `Order` → many `OrderItem`
- One `Order` → one `Payment`
- `CartItem` and `OrderItem` each reference one `Product`
