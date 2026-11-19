FoodCostly --- AI Agent Context
Read this file before planning, coding, reviewing, or modifying this
repository. This file explains what the product is and how an AI
coding agent should work. Status: Draft v1.1 | Last updated:
2026-11-19

1. What Is This Project?
FoodCostly is a multi-tenant SaaS web application for restaurants and
food businesses. Each organization represents one restaurant/business
location in the MVP; multi-branch operation is explicitly deferred.

It helps each business: - Record ingredient purchases and supplier
information. - Convert purchase units to inventory base units. - Track
stock and stock movements. - Create recipes and calculate menu costs. -
Record in-store and delivery sales. - Calculate food cost, channel fees,
and contribution margin. - Review purchase, inventory, and profitability
reports.

The initial pilot use case is a sourdough and sandwich shop. Do not
hard-code sourdough, sandwiches, Phuket, GrabFood, or any single
restaurant into the core system. These are example data/use cases, not
product constraints.
2. Product Scope
The product is a restaurant cost and inventory management platform,
not: - A food delivery marketplace. - A POS replacement in the first
release. - An accounting/tax filing system. - A supplier marketplace. -
A general-purpose ERP. - A recipe social network.

MVP sales are entered manually. External POS and delivery integrations
are future scope.

The detailed scope and milestones are in plan.md. Product prohibitions
and engineering constraints are in rule.md. Read both before making
significant changes.
3. Confirmed Technology Decisions
- Next.js App Router
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui
- Neon PostgreSQL
- Prisma ORM v7
- Better Auth with Organizations
- Zod
- React Hook Form
- TanStack Table
- Recharts
- Lucide React
- Vitest
- Playwright
- bun (official package manager; lockfile: bun.lock)
- Vercel deployment target
Do not silently replace these technologies. If a change appears
necessary, explain the trade-off and ask for approval before changing
the stack.
Use Bun for all package and script commands (`bun install`, `bun add`,
`bun remove`, `bun run …`, `bunx …`). Do not use npm, yarn, or pnpm in
this repository. Commit `bun.lock` with dependency changes.
4. Architecture
Use a modular monolith.
- src/app: routes, layouts, pages, and thin Route Handlers.
- src/features: feature-specific UI, schemas, types, and actions.
- src/server/services: business use cases and domain orchestration.
- src/server/repositories: database access/query composition.
- src/server/auth: authentication and session helpers.
- src/server/permissions: organization membership and role checks.
- src/lib: shared infrastructure such as Prisma client and
  utilities.
- prisma: schema and migrations.
Keep business rules out of React components. Route Handlers should
parse/validate input, authenticate/authorize, call a service, and map
the result to an HTTP response. Server Actions, if used, must follow the
same validation and authorization rules.
5. Multi-Tenancy Is a Security Boundary
The application serves multiple independent businesses.
- Use Better Auth Organizations as the organization/member foundation.
- Every business-owned record must be associated with an
  organization/tenant.
- Determine the active organization from the authenticated server-side
  session/context.
- Verify the user is a member and has the required role for every read
  and write.
- Never trust organizationId, tenantId, role, or user ID from
  client input as proof of authorization.
- Scope every tenant-owned query and mutation.
- Avoid unscoped findUnique, update, delete, or raw SQL for
  tenant-owned records.
- Add tests proving Organization A cannot access Organization B data.
- Do not expose secrets or cross-tenant data in errors, logs, or API
  responses.
A centralized tenant context/authorization helper should be used
consistently. If PostgreSQL Row Level Security is added, it is
defense-in-depth and must be configured and tested carefully; it does
not replace application authorization.
6. Core Domain Concepts
Ingredients
An ingredient has one canonical base unit, such as g, ml, or pcs.
Purchase and recipe units may differ, but conversions must be
dimensionally valid.
Purchases
A purchase records what was bought, from whom, when, in what
quantity/unit, and at what cost. Receiving a purchase increases
inventory exactly once.
Inventory
The inventory ledger is the auditable history of all stock movements.
Current balance is a derived/maintained projection and must reconcile
with the ledger.
Recipes
A recipe contains ingredient quantities and yield/portion information.
Recipe cost is derived from ingredient costs and yield rules.
Menus
A menu item is a sellable item that references a recipe or recipe
composition and has channel-specific selling prices where required.
Sales
Sales record the channel, menu items, quantities, discounts, fees, and
cost snapshots. Saving a sale immediately consumes inventory in the
same atomic transaction. If any ingredient is insufficient, reject the
whole sale without saving any part. Cancellation/refund uses reversal
records.
Costing
MVP costing method is Moving Weighted Average Cost (MWAC). Do not
implement FIFO unless explicitly approved.
7. Financial and Quantity Rules
- Use Prisma Decimal/decimal database columns for money and measured
  quantities.
- Do not use JavaScript number arithmetic for financial calculations
  unless values are converted to integer minor units with a documented
  currency strategy. Prefer a decimal library and Prisma Decimal.
- Store currency explicitly at organization level; MVP default can be
  THB, but do not assume every future tenant uses THB.
- Store quantity and unit on purchase/recipe records and normalized
  base quantity for inventory calculations.
- Do not mix weight, volume, and count units without a valid
  conversion.
- Define rounding rules at the calculation boundary and test them.
- Distinguish purchase unit price, current inventory valuation cost,
  recipe cost, and sale-time cost snapshot.
- Never recalculate historical posted sale cost using today's
  ingredient cost.
- Distinguish gross margin, contribution margin, and net profit. Do
  not label contribution margin as net profit.
8. Inventory Rules
- All stock changes must create ledger entries.
- Never directly overwrite historical ledger entries.
- Use compensating/reversal transactions for corrections,
  cancellations, and refunds.
- Receiving a purchase and creating its stock movements must be
  atomic.
- Posting a sale and creating its stock consumption must be atomic.
- Make receiving/posting operations idempotent.
- Protect against concurrent stock updates using database transactions
  and appropriate locking/consistency checks.
- Keep stock balance reconciled with ledger movements.
- Negative stock is forbidden for all users and operations. Reject stock-consuming transactions that would produce a negative balance.
- Sales deduct stock immediately when saved; sale creation and all stock ledger/balance updates must commit or roll back together.
- Prevent race conditions with database-level transaction/locking or conditional updates and verify sufficient stock inside the transaction.
9. Confirmed Product Decisions
- One organization represents one restaurant location in MVP; no branch selector, branch transfers, or branch-level stock in this release.
- Stock must never become negative. No Owner/Admin override exists.
- A sale deducts stock immediately when saved. Insufficient stock rejects the entire sale atomically.
- The UI supports Thai and English with a selectable locale and translation dictionaries.
- Start with a Free plan. Paid subscriptions, payment provider integration, and billing automation are post-MVP.
10. AI Agent Workflow
Before coding: 1. Read agent.md, plan.md, and rule.md. 2. Inspect
the existing repository and package versions. Do not assume the project
is empty. 3. Identify the current milestone and only work on that scope.
4. Check existing patterns before creating new abstractions. 5. If
requirements conflict or a critical business rule is unknown, ask a
focused question or document a reversible assumption.

While coding: 1. Make the smallest coherent change. 2. Follow the
existing naming, formatting, and folder conventions. 3. Validate all
external input with Zod or the established validation layer. 4. Enforce
authentication and tenant authorization on the server. 5. Put domain
logic in services and persistence in repositories/data-access modules.
6. Add tests for calculations, permissions, and edge cases. 7. Avoid
unrelated refactors and dependency additions.

After coding: 1. Run relevant tests. 2. Run lint and TypeScript checks.
3. Run the production build when practical. 4. Report files changed,
behavior added, commands run, test results, and known limitations. 5.
Update documentation when architecture, schema, workflows, or decisions
change.
11. How to Handle Ambiguity
Do not invent business rules that affect stock, money, or historical
records.

Ask before implementing a non-reversible or financially significant
choice, including: - Tax, discount, and shipping cost allocation. -
Refund and cancellation behavior. - Ingredient yield and preparation
loss. - Exact role/permission matrix. - Whether receipt image uploads
are in MVP. Do not reopen confirmed decisions unless new evidence
reveals a material defect; explain the impact and request approval.

For low-risk UI choices, use a consistent, accessible default and
document it.
12. Current Project Stage
Sprint 0: Project Foundation is Done (2026-11-19). Confirmed product
decisions above remain requirements.

Note: GitHub Actions automatic CI is deferred because the GitHub account
is locked due to a billing issue. The workflow exists but runs only via
manual `workflow_dispatch` until billing is fixed. Until then, run
`bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build`
locally before merging. Those four commands passed when Sprint 0 closed.

Sprint 1: Authentication and Tenant Isolation is Done (2026-11-19).

Sprint 2: Ingredients and Units is Done (2026-11-19).

Sprint 3: Suppliers and Purchases is Done (2026-11-19).

Current milestone: Sprint 4: Inventory (balances, waste/adjustments,
stock count, low-stock).

Do not start sales, billing, or external integrations before inventory
workflows beyond purchase-receive are working and tested.