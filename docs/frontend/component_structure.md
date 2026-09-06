# Component / UI Structure Document
## E-commerce Store — Next.js Frontend

Lists the core pages and reusable components, and which components repeat across multiple pages.

---

## 1. Pages Overview

| Page | Route | Key Components Used |
|---|---|---|
| Home | `/` | `Navbar`, `ProductCard` (featured), `Footer` |
| Product Listing | `/products` | `Navbar`, `ProductFilters`, `ProductCard` (grid), `Pagination` |
| Product Details | `/products/[id]` | `Navbar`, `ImageGallery`, `AddToCartButton`, `StockBadge` |
| Login | `/login` | `AuthForm` |
| Register | `/register` | `AuthForm` |
| Cart | `/cart` | `CartItem`, `CartSummary`, `EmptyState` |
| Checkout | `/checkout` | `AddressForm`, `AddressList`, `PaymentForm`, `CartSummary` |
| Order History | `/orders` | `OrderStatusBadge`, `OrderCard` |
| Order Details | `/orders/[id]` | `OrderStatusBadge`, `OrderItemsList` |
| Account | `/account` | `AccountForm`, `AddressList` |
| Admin Dashboard | `/admin` | `AdminSidebar`, `StatsCard` |
| Admin Products | `/admin/products` | `AdminSidebar`, `DataTable`, `ProductForm` (in new/edit) |
| Admin Orders | `/admin/orders` | `AdminSidebar`, `DataTable`, `OrderStatusBadge`, `StatusSelect` |

---

## 2. Shared/Reusable Components (`components/ui/`)

Generic components with no business logic — used across almost every page.

| Component | Used In |
|---|---|
| `Button` | Everywhere |
| `Input` / `TextField` | Auth forms, address form, admin product form |
| `Modal` | Confirm delete (admin), image preview |
| `Spinner` / `Skeleton` | Any data-loading state |
| `Toast` / `Notification` | Success/error feedback (add to cart, order placed, etc.) |
| `Badge` | `StockBadge`, `OrderStatusBadge` build on this |
| `Pagination` | Product listing, admin tables |
| `DataTable` | Admin products list, admin orders list |
| `EmptyState` | Empty cart, no orders yet, no products found |

---

## 3. Feature Components

### Product (`components/product/`)
- **`ProductCard`** — image, name, price, "Add to Cart" button. Used on Home, Product Listing.
- **`ProductFilters`** — price range, sort dropdown. Used on Product Listing.
- **`ImageGallery`** — product images on the details page.
- **`StockBadge`** — "In Stock" / "Out of Stock" indicator. Reused on `ProductCard` and Product Details.

### Cart (`components/cart/`)
- **`CartItem`** — single row: image, name, quantity stepper, remove button.
- **`CartSummary`** — subtotal, total. Reused on Cart page and Checkout page (read-only mode).

### Checkout (`components/checkout/`)
- **`AddressForm`** — add/edit address. Reused on Checkout and Account > Addresses.
- **`AddressList`** — pick a saved address. Used on Checkout.
- **`PaymentForm`** — wraps Stripe.js/Paymob elements.

### Orders (`components/orders/`)
- **`OrderCard`** — summary row in order history.
- **`OrderStatusBadge`** — colored badge per status (pending/shipped/delivered/cancelled). Reused in customer order views AND admin order table.
- **`OrderItemsList`** — line items on order details.

### Admin (`components/admin/`)
- **`AdminSidebar`** — nav links (Dashboard, Products, Orders). Used in `admin/layout.tsx`.
- **`StatsCard`** — single metric display. Used on Admin Dashboard.
- **`ProductForm`** — create/edit product, reused for both `new` and `edit` routes.
- **`StatusSelect`** — dropdown to change an order's status.

### Layout (`components/layout/`)
- **`Navbar`** — different content for guest / customer / admin (cart icon, account menu, admin link).
- **`Footer`**

---

## 4. Components That Repeat Across Multiple Pages

Worth building these carefully first since changes to them ripple everywhere:

| Component | Appears In |
|---|---|
| `ProductCard` | Home, Product Listing |
| `CartSummary` | Cart page, Checkout page |
| `OrderStatusBadge` | Order History, Order Details, Admin Orders |
| `AddressForm` | Checkout, Account > Addresses |
| `Button`, `Input`, `Spinner`, `Toast` | Nearly every page |

---

## 5. Suggested Build Order

1. `components/ui/*` (generic primitives) — everything else depends on these
2. `ProductCard`, `ProductFilters` → Product Listing/Details pages
3. `CartItem`, `CartSummary` → Cart page
4. `AddressForm`, `PaymentForm` → Checkout page
5. `OrderStatusBadge`, `OrderCard`, `OrderItemsList` → Order pages
6. `AdminSidebar`, `StatsCard`, `DataTable`, `ProductForm`, `StatusSelect` → Admin pages last, since they depend on most other data already being modeled
