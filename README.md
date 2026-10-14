# Fruit Turf

Fruit Turf is a Laravel 13, React, TypeScript, Inertia.js and Tailwind CSS 4 fruit shop. It includes a customer storefront, guest checkout, optional account creation, a customer area, and an authenticated operations dashboard.

## Start locally

Requirements: PHP 8.3+, Composer, Node.js 22+, npm, and MySQL 8+.

1. Copy `.env.example` to `.env`, set the MySQL database name and local credentials, and configure a strong admin password. Never commit `.env`.
2. Install dependencies and initialize the app:

   ```powershell
   composer install
   php artisan key:generate
   npm install
   php artisan migrate --seed
   php artisan storage:link
   ```

3. Set `FRUIT_TURF_ADMIN_NAME`, `FRUIT_TURF_ADMIN_EMAIL`, and `FRUIT_TURF_ADMIN_PASSWORD` in `.env` before seeding to create the first admin account. If the database is already seeded, run `php artisan db:seed` after setting those values.
4. Start Laravel, Vite, and a queue worker in separate terminals:

   ```powershell
   php artisan serve
   npm run dev
   php artisan queue:work
   ```

   Order confirmation email is queued. Configure a real mail transport before deploying; the local default writes mail to the application log.

`FRUIT_TURF_CURRENCY` controls displayed and stored order currency (defaults to `BDT`). The sample catalog uses demo fruit imagery hosted by Unsplash; replace it with your own product photos in production.

## What works

- **Storefront:** searchable, sortable and category-filtered fruit catalog, product details, persistent basket and responsive checkout.
- **Checkout:** guest orders or optional account creation; captures full name, email and delivery address, with optional phone and delivery note. Stock is checked and locked inside a transaction before an order is committed.
- **Customer area:** profile, saved delivery addresses, order history, printable order invoices and item-level refund requests.
- **Admin:** role-protected revenue dashboard, fruit/category management, product image uploads, stock adjustments, order processing, payment ledger, customer account controls, refund review and CSV reports.
- **Payments:** checkout starts with cash on delivery. The manual settlement strategy records a payment only after an operator enters a real collection reference. No card gateway is configured.
- **Refunds:** only delivered, settled orders can be refunded. The manual refund strategy records an externally completed payout and its reference; opted-in items are restocked and an inventory movement is recorded in the same database transaction.

## Architecture and learning path

The app follows the Inertia request path:

`React page → Laravel route → Form Request → thin controller → service → repository / Eloquent → MySQL`

- **Schema and relationships:** `database/migrations` defines customers and their address book, categories, soft-deletable products, order and item snapshots, transactions, refunds, refund items, and inventory movements. Foreign keys preserve historical order details when a product is archived; composite indexes support dashboard, status and customer-history queries.
- **Repositories:** `app/Contracts` and `app/Repositories` isolate catalog and order reads from Eloquent query details. Bindings live in `AppServiceProvider`.
- **Factory and services:** `OrderFactory` assembles a consistent order model; `CheckoutService` owns the stock-safe, transactional checkout; `OrderStatusService` enforces legal status transitions; `PaymentSettlementService` and `RefundService` isolate settlement rules from controllers.
- **Strategies:** `PaymentStrategy` and `RefundStrategy` provide replaceable settlement handlers. The included manual implementations are deliberately honest about not connecting to a payment provider.
- **Validation and authorization:** Form Requests validate checkout, profile, address, catalog, payment and refund input. `EnsureAdmin` protects every management route; customer order and address lookups are scoped to the authenticated user.
- **Frontend:** `resources/js/Pages` contains typed Inertia pages; shared layouts, basket state, formatting and pagination live in `resources/js/components`, `contexts`, and `lib`.

For a productive study sequence, trace one checkout from `Checkout.tsx` to `CheckoutRequest`, `CheckoutController`, `CheckoutService`, the repositories and models, then read the checkout tests. Next follow the payment/refund services and their strategies, then inspect the admin screens and reports. This moves from a user action through validation, business rules, persistence and measurable tests.

## Quality checks

```powershell
php artisan test
npx tsc --noEmit
npm run build
vendor\bin\pint --test
```

The feature tests use an in-memory SQLite database; they do not migrate or modify the configured MySQL database.
