# Folder / Project Structure — Backend (Nest.js)

Modular structure, one module per domain, matching the modules in the Architecture and API docs.

---

## 1. Directory Tree

```
backend/
├── src/
│   ├── main.ts                      # App bootstrap (port, global pipes, Swagger setup)
│   ├── app.module.ts                # Root module, imports all feature modules
│   │
│   ├── config/
│   │   ├── configuration.ts         # Loads/validates env variables
│   │   └── database.config.ts       # TypeORM/Prisma connection config
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   └── dto/
│   │       └── pagination.dto.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       └── login.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       └── update-user.dto.ts
│   │
│   ├── addresses/
│   │   ├── addresses.module.ts
│   │   ├── addresses.controller.ts
│   │   ├── addresses.service.ts
│   │   ├── entities/
│   │   │   └── address.entity.ts
│   │   └── dto/
│   │       └── create-address.dto.ts
│   │
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── entities/
│   │   │   └── product.entity.ts
│   │   └── dto/
│   │       ├── create-product.dto.ts
│   │       ├── update-product.dto.ts
│   │       └── query-products.dto.ts
│   │
│   ├── cart/
│   │   ├── cart.module.ts
│   │   ├── cart.controller.ts
│   │   ├── cart.service.ts
│   │   ├── entities/
│   │   │   ├── cart.entity.ts
│   │   │   └── cart-item.entity.ts
│   │   └── dto/
│   │       ├── add-item.dto.ts
│   │       └── update-item.dto.ts
│   │
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   └── order-item.entity.ts
│   │   └── dto/
│   │       ├── create-order.dto.ts
│   │       └── update-status.dto.ts
│   │
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── providers/
│   │   │   ├── stripe.provider.ts
│   │   │   └── paymob.provider.ts
│   │   └── entities/
│   │       └── payment.entity.ts
│   │
│   ├── storage/
│   │   ├── storage.module.ts
│   │   └── storage.service.ts       # Cloudinary/S3 upload logic
│   │
│   ├── mail/
│   │   ├── mail.module.ts
│   │   └── mail.service.ts          # Order confirmation emails
│   │
│   └── admin/
│       ├── admin.module.ts
│       ├── admin.controller.ts
│       └── admin.service.ts         # Dashboard stats aggregation
│
├── test/
│   ├── auth.e2e-spec.ts
│   ├── products.e2e-spec.ts
│   └── orders.e2e-spec.ts
│
├── .env.example
├── .env
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. Conventions

| Item                 | Convention                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| Module folder name   | Plural, lowercase (`products`, `orders`)                                                                 |
| Controller           | `<name>.controller.ts` — routes only, no business logic                                                  |
| Service              | `<name>.service.ts` — all business logic lives here                                                      |
| Entity               | `entities/<name>.entity.ts` — one file per DB table                                                      |
| DTO                  | `dto/<action>-<name>.dto.ts` — one per request shape (`create-product.dto.ts`, not one giant shared DTO) |
| Shared/reusable code | Goes in `common/` (guards, decorators, filters, interceptors) — never duplicated inside a feature module |

---

## 3. Why This Structure

- **One module per domain** (auth, products, cart, orders, payments...) mirrors the modules in the Architecture doc — makes it easy to trace a feature from PRD → User Story → API endpoint → actual code.
- **`common/`** holds cross-cutting concerns (guards, decorators) so `AuthGuard`/`RolesGuard` aren't reimplemented per module.
- **`payments/providers/`** isolates the Stripe/Paymob-specific code behind a shared interface, so swapping or adding a gateway later doesn't touch the rest of the Payments module.
- **`storage/` and `mail/`** are separate infrastructure modules (not tied to one feature) since both Products (images) and Orders (confirmation emails) depend on them.
- **DTOs are per-action, not shared**, so validation rules for "create" vs "update" don't conflict (e.g. all fields required on create, all optional on update).
