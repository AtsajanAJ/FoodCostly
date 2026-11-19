FoodCostly --- Development Plan
Product planning document. This is the source of truth for
implementation scope and delivery order. Status: Draft v1.1 | Last
updated: 2026-11-19

1. Product Overview
FoodCostly is a multi-tenant SaaS web application for food
businesses to manage ingredient purchasing, stock movements, recipes,
menu costs, sales channels, and profitability.

The first real-world use case is a small restaurant selling sourdough
and sandwiches. The product must be generic enough to support other
restaurants later without adding restaurant-specific assumptions to the
core domain.
Product goals
1. Record ingredient purchases and supplier details.
2. Convert purchase units into consistent inventory base units.
3. Track stock on hand through an auditable inventory ledger.
4. Build recipes from ingredients and calculate recipe/menu costs.
5. Record sales from in-store and delivery channels.
6. Calculate contribution margin and provide useful reports.
7. Support multiple independent restaurant businesses (tenants) with strict data isolation.
8. Provide Thai and English user interfaces with a language switcher.
Non-goals for the MVP
- Direct GrabFood, LINE MAN, POS, accounting, or banking integrations.
- Automated OCR receipt scanning.
- Public marketplace or ingredient supplier marketplace.
- Advanced manufacturing, batch production, or multi-stage kitchen
  workflows.
- Native mobile applications.
- Paid subscription billing, payment collection, coupons, and metered usage. Start with a free plan; add paid plans after MVP.
- Microservices architecture.
These may be considered after the MVP is stable and validated.
2. Confirmed Technology Stack
  Area                                Technology
  Web framework                       Next.js App Router

  Language                            TypeScript (strict mode)

  UI                                  Tailwind CSS + shadcn/ui

  Database                            Neon PostgreSQL

  ORM                                 Prisma ORM v7

  Authentication                      Better Auth, including
Organizations

  Validation                          Zod

  Forms                               React Hook Form

  Tables                              TanStack Table

  Charts                              Recharts

  Icons                               Lucide React

  Date utilities                      date-fns

  Unit/integration tests              Vitest

  End-to-end tests                    Playwright

  Deployment                          Vercel

  File storage                        Cloudflare R2 (when receipt/image
upload is implemented)

  Error monitoring                    Sentry (before public production
launch)

  Background jobs                     Defer initially; evaluate Inngest
when asynchronous work is required
Package manager                     bun (official; commit bun.lock;
do not use npm/yarn/pnpm)
Use Next.js Route Handlers for external/public REST endpoints. Keep
domain logic in server-side application services, not in React
components or route handlers.
3. Architecture Principles
- Start as a modular monolith. Do not split into microservices.
- Use a single Neon PostgreSQL database with shared schema and tenant
  ownership on business data.
- Use Better Auth Organizations as the organization/member foundation.
  Do not create a duplicate organization membership system without a
  documented reason.
- Every tenant-owned record must be scoped to an organization/tenant.
- MVP supports one operating location per organization. The data model must not expose branch selection or branch-level stock workflows in MVP; multi-branch support is a future product decision.
- Resolve the active organization from the authenticated server-side
  session and verify membership/role on every operation.
- Never trust an organization ID supplied by the browser without
  server-side authorization.
- Use Prisma for persistence and database transactions.
- Use Zod at all external input boundaries.
- Use Decimal types for money and measured quantities; never use
  JavaScript floating-point arithmetic for financial calculations.
- Preserve historical purchase prices, recipe versions, and sale-time
  cost snapshots.
- Treat the inventory transaction ledger as the audit source for stock
  movements.
- Use database transactions for multi-record operations such as
  receiving a purchase or posting a sale.
- Prefer soft deletion/archive for referenced master data. Do not
  hard-delete financial or stock history.
4. Core Domain Modules
4.1 Accounts and Organizations
- User authentication and sessions.
- Organization creation and switching.
- Organization profile, currency, timezone, and locale.
- Organization members, invitations, and roles.
- Roles for MVP: Owner, Admin, Staff, Viewer.
- Each organization represents one restaurant/business location in MVP.
- The initial plan is Free. Paid subscription billing and payment-provider integration are deferred until after MVP; avoid building a complex billing system now.
4.2 Ingredients and Units
- Ingredient categories.
- Ingredients with a canonical base unit.
- Units and unit conversion rules.
- Minimum stock threshold.
- Active/archive status.
- Latest purchase cost and current valuation cost must be clearly
  distinguished.
Base unit examples: - Weight: gram (g) - Volume: millilitre (ml) -
Count: piece (pcs)

Conversions must be dimensionally valid. Do not convert weight to volume
unless an ingredient-specific density conversion is explicitly
configured.
4.3 Suppliers and Purchases
- Supplier directory.
- Purchase document with date, supplier, invoice/reference number,
  discount, tax, shipping, and status.
- Purchase line items with entered purchase quantity/unit, unit price,
  converted base quantity, and allocated cost.
- Draft and received states.
- Receiving a purchase must be idempotent: the same purchase must not
  increase stock twice.
- Purchase cost allocation rules for shipping/discount/tax must be
  explicit and tested.
4.4 Inventory
- Inventory transaction ledger.
- Current stock balance for fast reads.
- Stock adjustment and stock count workflows.
- Waste/spoilage records.
- Purchase receipt adds stock.
- Recipe usage or posted sale consumes stock according to the
  configured MVP workflow.
- Stock corrections must create compensating transactions; do not
  rewrite historical ledger entries.
- Negative stock is strictly prohibited for every user and workflow.
- A stock-consuming operation must fail atomically if any required ingredient quantity is unavailable. No partial sale or partial stock deduction is allowed.
4.5 Recipes and Menus
- Recipe and recipe items.
- Menu item and menu pricing.
- Recipe yield/portion information.
- Recipe cost calculated from ingredient valuation cost.
- Recipe version/history so old sales retain their historical cost.
- Support optional ingredients/add-ons only when their behavior is
  clearly defined.
- Track edible yield/waste factor where relevant; do not silently
  assume 100% usable yield.
4.6 Sales and Channels
- Sales channels: In-store, GrabFood, LINE MAN, Other.
- Manual sale entry is the MVP input method.
- Sale header and sale line items.
- Sale-time unit price, discount, fees, ingredient cost snapshot,
  packaging cost, and other variable costs.
- Channel fee configuration can support percentage and fixed fees.
- Distinguish platform fee charged to the merchant from customer
  delivery fees and customer-paid amounts.
- Saving/recording a sale immediately creates stock consumption records in the same database transaction. There is no separate stock-deduction toggle in MVP.
- If any ingredient is insufficient, reject the entire sale and leave both sale records and stock unchanged.
- Protect against concurrent sales so two simultaneous requests cannot consume the same remaining stock.
- Cancel/refund must use reversal records rather than deleting posted
  sales.
4.7 Reports
- Purchase totals by date range and supplier.
- Current stock and stock valuation.
- Stock movement history.
- Ingredient cost history.
- Recipe/menu cost and food-cost percentage.
- Sales by channel.
- Contribution margin by menu item and channel.
- Reports must disclose assumptions and excluded costs.
4.8 Localization
- MVP interface languages are Thai and English.
- Provide a user-selectable language preference; do not duplicate pages per language.
- Keep UI text in translation dictionaries and avoid hard-coded user-facing strings in feature components.
- Format dates, numbers, quantities, and currency using locale-aware utilities while keeping stored values locale-neutral.
- Organization currency and timezone are business settings, not inferred from the selected UI language.
5. Costing Policy --- MVP Default
Default method: Moving Weighted Average Cost (MWAC).

When new stock is received:

new_average_cost = (existing_stock_value + received_stock_value) / (existing_quantity + received_base_quantity)

Important: - Use the current remaining inventory quantity/value, not the
total quantity ever purchased. - Consumption reduces quantity and
inventory value using the applicable average cost. - Handle zero stock,
returns, adjustments, discounts, tax, and shipping explicitly. - Store
enough immutable transaction data to reconstruct stock quantity and
value. - Do not retroactively change cost snapshots on already-posted
sales.

FIFO is not part of MVP unless explicitly approved. Keep the ledger
design extensible, but do not build multiple costing methods
prematurely.
6. MVP Delivery Roadmap
The schedule is an estimate for one developer and should be adjusted
after the first technical spike.
Sprint 0 --- Product and Technical Foundation
<small>Status: Done (2026-11-19) — foundation complete locally. GitHub Actions auto-CI deferred: account billing lock blocked runners. Workflow kept as manual `workflow_dispatch` only; re-enable push/PR triggers after billing is fixed. Local checks passed: lint, typecheck, test, build.</small>

Deliverables - Repository and project conventions. - Next.js,
TypeScript strict mode, Tailwind, shadcn/ui. - Neon development
database. - Prisma v7 configuration and first migration. - Environment
variable validation. - Basic application shell and error handling. - CI
workflow file present (auto-run deferred; see status note).

Acceptance criteria - App runs locally using documented commands. -
Database connection and migration work. - Secrets are not committed. -
Local lint/type/test/build pass. Remote CI green deferred until GitHub
billing is resolved.
Sprint 1 --- Authentication and Tenant Isolation
<small>Status: Done (2026-11-19) — Better Auth + Organizations, tenant context, protected dashboard, cross-tenant tests, and public /demo trial path.</small>

Deliverables - Better Auth setup. - Organization creation and
switching. - Organization membership and role checks. - Protected
dashboard route. - Server-side tenant context helper.

Acceptance criteria - User can register, sign in, create an
organization, and switch organizations. - User cannot read or mutate
another organization's records by changing request IDs. - Tests cover
cross-tenant read and write attempts. - All tenant-scoped queries use a
centralized authorization pattern.
Sprint 2 --- Ingredients and Units
<small>Status: Done (2026-11-19) — system units seeded, categories/ingredients CRUD + archive, conversion service + tenant isolation tests.</small>

Deliverables - Units and unit dimensions. - Ingredient categories. -
Ingredient CRUD and archive. - Base-unit configuration. - Unit
conversion service.

Acceptance criteria - An ingredient has exactly one base unit. -
Valid conversions work (e.g. 1 kg = 1,000 g). - Invalid dimension
conversions are rejected. - Decimal quantities and costs are preserved.
Sprint 3 --- Suppliers and Purchases
<small>Status: Done (2026-11-19) — suppliers, draft purchases, proportional header cost allocation (documented MVP assumption), atomic receive with ledger/MWAC, history/detail pages.</small>

Deliverables - Supplier CRUD. - Purchase draft and line items. -
Purchase totals. - Receive purchase workflow. - Purchase history and
detail page.

Acceptance criteria - Purchase quantity converts to base quantity
correctly. - Receiving a purchase creates stock ledger entries exactly
once. - Purchase and stock updates are atomic. - Historical purchase
price remains unchanged after later purchases.

MVP allocation assumption (open decision #1, reversible): header
discount is allocated by lineGross share; tax and shipping are allocated
by share of (lineGross - discountShare).
Sprint 4 --- Inventory
<small>Status: Done (2026-11-19) — stock balances, ledger UI, waste/adjustment/stock-count compensating movements, low-stock indicator, negative-stock rejection tests.</small>

Deliverables - Stock balance view. - Inventory ledger. - Waste and
adjustment workflows. - Stock count workflow (basic). - Low-stock
indicator.

Acceptance criteria - Stock balance matches the sum of ledger movements. - Every movement has a reason and reference. - Corrections are compensating movements. - No user or workflow can make stock negative; insufficient stock operations are rejected atomically.
Sprint 5 --- Recipes and Menu Costing
<small>Status: Done (2026-11-19) — recipes/items, live MWAC costing, published version snapshots, menu channel prices, yield-at-recipe-item assumption.</small>

Deliverables - Recipe CRUD and recipe items. - Menu item CRUD and
pricing. - Recipe yield/portion support. - Cost calculation using
MWAC. - Recipe cost history/versioning.

Acceptance criteria - Recipe cost equals the sum of item quantities
multiplied by their applicable unit costs. - Unit conversion and yield
loss are handled correctly. - Updating current ingredient cost does not
rewrite old recipe/sale snapshots. - Tests cover rounding and fractional
quantities.

MVP yield assumption (open decision #2, reversible): edible yield % is
stored on each recipe item; required raw qty = baseQty / (yield%/100).
Sprint 6 --- Sales and Profitability
<small>Status: Done (2026-11-19) — channels with NONE/PERCENT/FIXED fees, manual sale post with sale-time snapshots, atomic stock deduction + idempotency key, cancel/reversal, contribution margin (not labeled net profit).</small>

Deliverables - Channel setup. - Manual sale entry. - Sale items and sale-time snapshots. - Percentage/fixed channel fees. - Immediate inventory deduction on sale save. - Cancellation and refund/reversal flow.

Acceptance criteria - In-store and delivery sales can be recorded. - Saving a sale immediately deducts its recipe ingredients in the same database transaction. - If any ingredient is insufficient, reject the entire sale and leave sale records and stock unchanged. - Concurrent sale attempts cannot drive stock below zero. - Duplicate requests are idempotent and cannot deduct stock twice. - Profit calculations clearly separate food cost, packaging, channel fees, discounts, and other variable costs. - Cancellation/refund reverses relevant stock and financial effects without deleting history.

MVP fee assumption (reversible): percent/fixed channel fees apply to net revenue (gross − discount).
Sprint 7 --- Dashboard and Reports
Deliverables - Dashboard KPIs. - Purchase reports. - Inventory and
stock valuation reports. - Food cost and menu profitability reports. -
Date and channel filters. - CSV export if time permits.

Acceptance criteria - Dashboard figures reconcile with source
records. - Report timezone and date boundaries are consistent. - Reports
identify whether figures are gross margin, contribution margin, or net
profit. - No report claims net profit unless operating expenses are
included.
Sprint 8 --- Hardening and Release
Deliverables - Playwright critical-path tests. - Security review and
tenant isolation review. - Performance review and database indexes. -
Error monitoring. - Backup/recovery and deployment checklist. - User
documentation.

Acceptance criteria - Critical workflows pass end-to-end. -
Production environment variables and migrations are documented. - No
known critical tenant-isolation defect. - Errors are observable without
exposing sensitive data.
7. MVP User Journeys
1. Register → create restaurant organization → enter dashboard.
2. Create units/categories → add ingredients.
3. Add supplier → create purchase → receive purchase → stock increases.
4. Record waste/adjustment → stock balance and ledger update.
5. Create recipe → add ingredients and quantities → see recipe cost.
6. Create menu item → set in-store and delivery prices.
7. Record a sale → calculate fees/margin → deduct recipe ingredients.
8. View stock, purchase, food-cost, and profitability reports.
8. Definition of Done
A feature is not complete until: - Requirements and edge cases are
understood. - Input is validated on the server. - Tenant authorization
is enforced server-side. - Decimal arithmetic is used where
appropriate. - Database writes are transactional when multiple records
are involved. - Loading, empty, success, and error states exist. -
Unit/integration tests cover business rules. - Relevant Playwright flow
is added for critical user journeys. - No secrets or personal data are
logged. - Documentation is updated.
9. Risks and Open Decisions
The following decisions remain open and must be confirmed before the
corresponding feature is implemented:
1. Purchase tax/discount/shipping cost allocation method.
   (Temporary MVP default in use: proportional by line value — see Sprint 3 note.)
2. Whether ingredient preparation loss is represented at ingredient level or recipe level.
   (Temporary MVP default in use: recipe-item yield percent — see Sprint 5 note.)
3. Exact roles/permission matrix and invitation policy.
4. Whether purchase documents need receipt image uploads in MVP.
Confirmed decisions: one operating location per organization in MVP;
negative stock is strictly prohibited; sales deduct stock immediately
when saved; the interface supports Thai and English; launch with a Free
plan and defer paid billing until after MVP.

Do not list confirmed decisions as open questions. If a confirmed rule
must change, document the impact and obtain explicit approval first.
10. Product Success Criteria
The MVP should let a restaurant owner answer these questions reliably: -
What did I buy, from whom, and at what unit cost? - How much stock
should I have now, and why? - What does one serving of each menu item
cost? - Which menu items and channels contribute the most margin? - How
have ingredient and menu costs changed over time?

The MVP is successful when these answers reconcile with purchase, stock,
recipe, and sale records.