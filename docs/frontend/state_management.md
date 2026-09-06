# State Management Plan
## E-commerce Store — Next.js Frontend

Splits state into two categories that are handled very differently: **server state** (data owned by the Nest.js API) and **client state** (data that only exists in the browser).

---

## 1. Server State — React Query (or SWR)

Anything that comes from the backend: products, cart contents (persisted per user), orders, admin stats.

**Tool:** React Query (`@tanstack/react-query`) — recommended over plain `useEffect` + `useState` because it gives you caching, automatic refetching, loading/error states, and mutation handling for free.

| Data | Query Key | Notes |
|---|---|---|
| Product list | `['products', filters]` | Refetch when filters/page change |
| Product details | `['products', id]` | |
| Cart | `['cart']` | Refetch after add/update/remove mutations |
| Orders (customer) | `['orders']` | |
| Order details | `['orders', id]` | Poll or refetch after checkout for payment status |
| Admin stats | `['admin', 'stats']` | Refetch on dashboard mount |
| Admin orders | `['admin', 'orders', filters]` | |

**Pattern:** wrap each in a custom hook (per the Folder Structure doc) — e.g. `useProducts(filters)`, `useCart()`, `useOrders()` — so components never call `lib/api/*` directly.

```ts
// hooks/useCart.ts
export function useCart() {
  return useQuery({ queryKey: ['cart'], queryFn: cartApi.getCart });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}
```

---

## 2. Client State — Zustand (lightweight global store)

Only for state that's **not** just a mirror of server data.

| State | Store | Notes |
|---|---|---|
| Current logged-in user + access token | `authStore` | Also drives Navbar (guest/customer/admin view) and route protection |
| UI-only cart drawer open/closed | `uiStore` (optional) | Pure UI state, not persisted |
| Checkout in-progress step | Local `useState` in the checkout page | Doesn't need to be global |

**Why Zustand over Context API:** Context re-renders every consumer on every change, which gets expensive for something like auth state read in many components (Navbar, guards, etc.). Zustand avoids that with selective subscriptions, and needs far less boilerplate than Redux for a project this size.

```ts
// store/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, token) => set({ user, accessToken: token }),
  clearAuth: () => set({ user: null, accessToken: null }),
}));
```

---

## 3. Important: Cart Is a Hybrid Case

The cart is **server state**, not client state — it's persisted in the database per the ERD (`Cart`/`CartItem` tables), not `localStorage`. This means:
- Use React Query for it (`useCart()`), not Zustand.
- Every add/update/remove is a mutation that hits the backend and invalidates the `['cart']` query.
- No need to sync cart between tabs manually — React Query's refetch-on-focus handles it reasonably well, or you can add a manual "refresh" on cart-affecting actions.

This is a common mistake to avoid: don't build a separate `cartStore` in Zustand that duplicates what the backend already tracks — you'll end up with two sources of truth that can drift out of sync.

---

## 4. Form State — React Hook Form + Zod

For all forms (register, login, address, checkout, admin product form): **React Hook Form** for form state/validation wiring, **Zod** for schema validation (matching `lib/validators/*.schema.ts` from the Folder Structure doc).

- Keeps validation rules in one typed place, reusable between the form and (optionally) double-checking data shape before sending to the API.
- Avoids re-rendering the whole form on every keystroke, unlike plain controlled `useState` per field.

---

## 5. Summary Table

| State type | Examples | Tool |
|---|---|---|
| Server state | Products, Cart, Orders, Admin stats | React Query |
| Global client state | Auth user/token | Zustand |
| Local UI state | Checkout step, modal open/closed | `useState` |
| Form state | Login, register, address, product forms | React Hook Form + Zod |

---

## 6. Auth Token Handling Note

- Store the **access token** in memory (Zustand state), not `localStorage`, to reduce XSS exposure.
- Store the **refresh token** in an httpOnly cookie (set by the backend), so client-side JS can't read it directly.
- On app load, attempt a silent refresh (`POST /auth/refresh`) to restore the session before rendering protected content.
