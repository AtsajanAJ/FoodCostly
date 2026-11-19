# FoodCostly release checklist

## Pre-deploy

1. Copy `.env.example` → production env on Vercel (and never commit `.env`).
2. Set:
   - `DATABASE_URL` (Neon pooled)
   - `DATABASE_URL_UNPOOLED` (Neon direct, for migrations)
   - `BETTER_AUTH_SECRET` (≥32 random chars)
   - `BETTER_AUTH_URL` (production origin, e.g. `https://your-app.vercel.app`)
3. Run migrations against production with the unpooled URL:
   ```bash
   bunx prisma migrate deploy
   bunx prisma generate
   ```
4. Seed system units if this is a fresh database:
   ```bash
   bun run db:seed-units
   ```
5. Local gate before merge/release:
   ```bash
   bun run lint
   bun run typecheck
   bun run test
   bun run build
   bun run test:e2e
   ```

## Backup / recovery (Neon)

- Neon provides point-in-time recovery / branching for the project database.
- Before risky schema work: create a Neon branch or snapshot.
- Restore procedure: restore/branch from Neon console → update `DATABASE_URL*` → `bunx prisma migrate deploy` if needed → verify login + one purchase receive + one sale post.
- Application data is tenant-scoped in Postgres; there is no separate object store in MVP.

## Observability

- Vercel runtime logs capture `reportError` JSON from `src/lib/safe-log.ts` (secrets redacted).
- Do not log passwords, session tokens, or connection strings.
- Optional later: wire `reportError` to Sentry (not required for MVP).

## Index / performance review (Sprint 8)

Hot paths already have org-scoped indexes:

- Purchases: `(organizationId, status)`, `(organizationId, purchasedAt)`
- Inventory ledger: `(organizationId, ingredientId, occurredAt)`, reference uniqueness for idempotency
- Sales: `(organizationId, status, soldAt)`, `(organizationId, channelId)`
- Sale lines/consumptions: org + parent FKs
- Stock balance: unique `ingredientId`, `(organizationId, ingredientId)`

Outbound stock uses `SELECT … FOR UPDATE` on `stock_balance` to prevent concurrent oversell.

## Post-deploy smoke

1. Sign up / sign in
2. Create organization
3. Add ingredient → supplier → receive purchase
4. Create recipe + publish version → menu item
5. Post sale → confirm stock drop
6. Cancel sale → confirm stock restore
7. Open dashboard reports / CSV export
