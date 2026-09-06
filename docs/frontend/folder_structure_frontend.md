# Folder / Project Structure — Frontend (Next.js)

Uses the Next.js **App Router**, with route groups to separate public, customer, and admin areas — mirroring the roles from the PRD.

---

## 1. Directory Tree

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (fonts, providers)
│   │   ├── page.tsx                     # Home page
│   │   ├── globals.css
│   │   │
│   │   ├── (public)/
│   │   │   ├── products/
│   │   │   │   ├── page.tsx             # Product listing (search/filter/sort)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Product details
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (customer)/
│   │   │   ├── layout.tsx               # Wraps with AuthGuard (customer)
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx             # Order history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Order details
│   │   │   └── account/
│   │   │       ├── page.tsx
│   │   │       └── addresses/
│   │   │           └── page.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx               # Wraps with AuthGuard (admin) + AdminSidebar
│   │   │   ├── page.tsx                 # Dashboard / stats
│   │   │   ├── products/
│   │   │   │   ├── page.tsx             # Product list (admin table)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   └── orders/
│   │   │       ├── page.tsx
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/
│   │       └── (only if you need Next.js route handlers, e.g. webhook proxying — otherwise skip, since Nest.js is the real backend)
│   │
│   ├── components/
│   │   ├── ui/                          # Generic, reusable (Button, Input, Modal, Spinner...)
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductFilters.tsx
│   │   ├── cart/
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   ├── checkout/
│   │   │   ├── AddressForm.tsx
│   │   │   └── PaymentForm.tsx
│   │   ├── orders/
│   │   │   └── OrderStatusBadge.tsx
│   │   ├── admin/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── ProductForm.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                # Axios/fetch wrapper, attaches JWT, base URL
│   │   │   ├── auth.api.ts
│   │   │   ├── products.api.ts
│   │   │   ├── cart.api.ts
│   │   │   ├── orders.api.ts
│   │   │   └── payments.api.ts
│   │   ├── validators/                  # zod/yup schemas for forms
│   │   │   ├── auth.schema.ts
│   │   │   └── address.schema.ts
│   │   └── utils/
│   │       ├── formatPrice.ts
│   │       └── formatDate.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   └── useProducts.ts               # wraps React Query/SWR calls
│   │
│   ├── store/                           # Client state (Cart, Auth) — see State Management doc
│   │   ├── authStore.ts
│   │   └── cartStore.ts
│   │
│   ├── types/
│   │   ├── product.types.ts
│   │   ├── order.types.ts
│   │   └── user.types.ts
│   │
│   └── middleware.ts                    # Route protection (redirect if not authed/not admin)
│
├── public/
│   └── images/                          # Static assets only (not product images — those come from Cloudinary/S3)
│
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. Route Groups Explained

| Group | Purpose | Access |
|---|---|---|
| `(public)/` | Browsing, login, register | Public |
| `(customer)/` | Cart, checkout, orders, account | Logged-in customers |
| `admin/` | Dashboard, product/order management | Admins only |

Route groups `(public)` and `(customer)` use parentheses so they don't affect the URL path — only `admin/` shows up literally in the URL (`/admin/...`), since it needs a clearly separate namespace.

---

## 3. Conventions

| Item | Convention |
|---|---|
| Components | PascalCase, one component per file (`ProductCard.tsx`) |
| `components/ui/` | Generic, no business logic, reusable anywhere |
| `components/<feature>/` | Feature-specific, can use hooks/store for that feature |
| `lib/api/` | One file per backend module — mirrors the Nest.js API doc exactly (`products.api.ts` ↔ `/products` endpoints) |
| `hooks/` | Custom hooks wrapping data-fetching or shared logic — components should rarely call `lib/api` directly |
| `types/` | Shared TypeScript types/interfaces, matching the ERD entities |

---

## 4. Why This Structure

- **Route groups mirror the PRD's user roles** (Customer/Admin) — makes access rules obvious just from folder placement, and `middleware.ts` can protect `(customer)` and `admin` groups with one rule each.
- **`lib/api/` mirrors the backend API doc 1:1** — when an endpoint changes, you know exactly which frontend file to update.
- **`components/` split into `ui/` vs feature folders** avoids the common trap of dumping everything into one flat `components/` folder as the project grows.
- **`store/` is separate from `hooks/`** — `store` holds actual client state (cart contents, auth user), while `hooks` mostly wraps server state fetching (React Query/SWR) or reads from the store. See the State Management doc for the reasoning behind this split.
