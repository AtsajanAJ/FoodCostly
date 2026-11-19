FoodCostly --- Engineering and Product Rules
Mandatory constraints for developers and AI coding agents. If a
proposed implementation conflicts with this file, stop and resolve the
conflict before proceeding. Status: Draft v1.1 | Last updated:
2026-11-19

1. Scope Rules --- What Must Not Be Built in MVP
Do not add these without explicit product approval:
- Direct GrabFood, LINE MAN, POS, accounting, banking, or payment
  integrations.
- Receipt OCR or AI-based invoice extraction.
- Supplier marketplace or public ingredient catalog.
- Native iOS/Android applications.
- Microservices or event-driven distributed architecture.
- Paid subscription billing, payment collection, coupons, metered billing, or affiliate systems in MVP. The initial product is Free; paid plans are post-MVP.
- Manufacturing/production planning, recipe scheduling, or multi-stage
  kitchen workflows.
- Features unrelated to restaurant purchasing, inventory, recipe
  costing, sales, and profitability.
Do not turn the initial sourdough shop use case into hard-coded product
logic. The product must remain restaurant-generic.
2. Security Rules --- Never Do These
- NEVER trust tenant/organization IDs received from the browser as
  authorization.
- NEVER query or mutate tenant-owned data without verifying
  authenticated membership and permissions.
- NEVER expose another tenant's records, even in search, exports,
  autocomplete, error messages, or background jobs.
- NEVER put database credentials, Better Auth secrets, API keys, or
  storage secrets in client-side code.
- NEVER commit .env files or secrets.
- NEVER disable authentication or authorization to make a feature
  work.
- NEVER use dangerouslySetInnerHTML with untrusted content.
- NEVER log passwords, session tokens, authorization headers, payment
  secrets, or unnecessary personal data.
- NEVER use raw SQL with untrusted string interpolation.
- NEVER rely on UI hiding as the only permission control.
- NEVER skip cross-tenant authorization tests for tenant-owned
  endpoints.
3. Database and Data Integrity Rules
- Every tenant-owned business record must have an organization/tenant
  ownership relationship.
- Use foreign keys and appropriate indexes.
- Use unique constraints that include organization scope when
  uniqueness is tenant-specific (for example, ingredient name if the
  product requires it to be unique per organization).
- Use database transactions for multi-step financial or inventory
  operations.
- Do not perform external network calls inside a database transaction.
- Do not hard-delete posted purchases, inventory movements, or posted
  sales.
- Prefer archive/status fields for master data referenced by
  historical records.
- Do not silently change the meaning of existing fields or enum
  values.
- Every schema change must be represented by a Prisma migration.
- Do not edit an already-applied migration to change production
  history; create a new migration.
- Avoid nullable fields unless null has a clear business meaning.
- Use explicit status transitions and validate allowed transitions.
4. Money, Cost, and Quantity Rules
- NEVER use floating-point arithmetic for money or inventory quantity
  calculations.
- Use Decimal-compatible types end-to-end and define precision/scale
  intentionally.
- Do not round each intermediate calculation unnecessarily; round at
  documented output/accounting boundaries.
- Store currency explicitly.
- Do not assume all organizations use THB.
- Do not confuse package quantity with base quantity.
- Do not convert between weight, volume, and count without a valid
  conversion rule.
- Do not use current ingredient cost to rewrite historical recipe or
  sale costs.
- Do not call contribution margin "net profit".
- Do not hide platform fees, packaging, discounts, waste, or other
  cost assumptions in a single unexplained number.
- Do not silently assume 100% edible yield for ingredients that have
  preparation loss.
5. Inventory Rules
- NEVER update stock balance without creating the corresponding
  inventory ledger movement.
- NEVER edit or delete a posted ledger movement to correct stock.
- Use reversal/compensating entries for corrections.
- Receiving the same purchase twice must not add stock twice.
- Posting the same sale twice must not deduct stock twice.
- Use transactions and concurrency controls for stock-changing
  operations.
- Inventory balance must be reconcilable to ledger entries.
- Negative stock is strictly forbidden. No role may override this rule.
- Any operation that consumes stock must verify sufficient available quantity inside the same transaction that writes its ledger movements and balance updates.
- Sale creation immediately deducts stock. If any ingredient is insufficient, roll back the entire sale and all stock changes. Never create a partial sale.
- Concurrency controls must prevent two simultaneous transactions from consuming the same available quantity.
- Record a reason/reference for adjustments, waste, returns, and
  reversals.
- Do not implement FIFO or multiple valuation methods unless approved;
  MVP default is Moving Weighted Average Cost.
6. Architecture Rules
- Use Bun as the only package manager. Commit `bun.lock`. Do not use
  npm, yarn, or pnpm install commands in this repository.
- Keep the application as a modular monolith for MVP.
- Do not introduce microservices.
- Do not put business logic in React components.
- Keep Route Handlers thin: authenticate, authorize, validate, call
  service, return response.
- Keep database access out of presentation components.
- Use the established service/repository conventions.
- Avoid circular dependencies between features.
- Do not create generic frameworks or abstractions without a
  demonstrated need.
- Do not add a new dependency when the existing stack can solve the
  problem safely.
- Do not introduce a second ORM or database client.
7. Product Configuration Rules
- MVP has one operating location per organization. Do not build branch management, branch stock, or inter-branch transfers.
- The interface must support Thai and English. Use translation dictionaries and a locale switcher; do not hard-code UI copy in feature components.
- Start with a Free plan. Do not implement paid billing, payment provider integration, subscription checkout, or entitlement enforcement in MVP.
- A future change to branches, stock deduction timing, negative stock, or billing requires explicit product approval and updates to all three project documents.
8. Frontend and UX Rules
- Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.
- Prefer accessible shadcn/ui primitives and semantic HTML.
- Every form must have validation and clear error messages.
- Every data view must handle loading, empty, error, and success
  states.
- Destructive actions require confirmation.
- Do not show fake metrics or hard-coded production dashboard data.
- Seed/demo data must be clearly identified as demo data.
- Do not expose server-only code or secrets in Client Components.
- Keep responsive layouts usable on desktop and mobile.
- Avoid unnecessary animations and visual clutter.
- Use consistent currency, date, number, and unit formatting.
9. API and Validation Rules
- Validate all untrusted input on the server.
- Use Zod schemas at API/action boundaries.
- Do not rely only on client-side validation.
- Return consistent error shapes and appropriate HTTP status codes.
- Do not expose raw database errors or stack traces to users.
- Use pagination for potentially large lists.
- Use idempotency protection for stock-changing and financial posting
  operations.
- Do not accept client-supplied calculated totals as authoritative;
  recompute them on the server.
10. Testing Rules
- Add unit tests for unit conversion, cost calculations, fee
  calculations, yield calculations, and rounding.
- Add integration tests for purchase receiving, inventory movements,
  recipe costing, sale creation with immediate stock deduction,
  insufficient-stock rollback, concurrent sale attempts, cancellation,
  and refunds.
- Add tenant-isolation tests for all tenant-owned data access
  patterns.
- Add Playwright tests for critical user journeys.
- Test edge cases: zero stock, insufficient stock, fractional quantities, price changes, duplicate requests, concurrent sales, archived ingredients, and invalid unit conversions. Verify no operation can make stock negative.
- Do not claim a feature is complete if its critical business rules
  are untested.
- Do not remove or weaken a failing test just to make CI pass;
  investigate the defect.
11. AI Agent Rules
- Read plan.md, agent.md, and this rule.md before substantial
  work.
- Work only on the current milestone unless asked to expand scope.
- Do not silently change the stack, architecture, costing method, or
  business rules.
- Do not invent APIs, environment variables, schema fields, or library
  capabilities; inspect installed versions and official documentation.
- Do not upgrade major dependencies without approval.
- Do not rewrite unrelated files or perform broad refactors without a
  reason.
- Do not mark tasks complete without running relevant checks.
- If blocked by a missing business decision, ask a concise question
  rather than guessing.
- Clearly disclose assumptions, incomplete work, and test failures.
12. Change Management
Before changing an established rule: 1. Explain the reason and impact.
2. Identify affected modules, data, and tests. 3. Propose a
migration/backward-compatibility approach. 4. Obtain approval for
material product or financial behavior changes. 5. Update plan.md,
agent.md, and/or this file as appropriate.
13. Release Safety
Before production release: - Verify tenant isolation. - Verify
authorization and session handling. - Verify database migrations and
rollback/recovery strategy. - Verify backup and restore procedures. -
Verify secrets and environment configuration. - Verify error monitoring
and privacy-safe logs. - Verify critical Playwright journeys. - Verify
that no demo data or debug endpoints are exposed.