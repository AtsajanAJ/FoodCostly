# Sprint 8 security and tenant isolation review

Date: 2026-11-19 · Scope: MVP modular monolith

## Controls in place

| Area | Finding |
| --- | --- |
| Auth | Better Auth email/password; session cookie gate in `proxy.ts` for `/dashboard` and `/onboarding` |
| Tenant context | `requireTenantContext()` resolves active org from server session, not client body |
| Authorization | Write roles checked via `assertCanWriteMasterData`; viewers cannot mutate |
| Query scope | Repositories use `organizationId` on find/list/updateMany for tenant data |
| Isolation tests | Org access, ingredient isolation, sale isolation |
| Money/stock | Decimal.js; sale post + cancel in transactions; stock lock on outbound |
| Secrets | `.env` gitignored; `.env.example` has placeholders only |
| Errors | `reportError` redacts password/secret/token keys; actions return safe messages |

## Hardening fixes in Sprint 8

- Sale channel seeding uses `createMany({ skipDuplicates: true })` to avoid upsert races on new orgs.
- Recharts contribution chart mounts client-side only (avoids ResponsiveContainer SSR crash).

## Residual risks / follow-ups

1. Re-enable GitHub Actions auto-CI after billing unlock (workflow is manual `workflow_dispatch` only).
2. Expand isolation tests to purchases/recipes/menus as defense-in-depth (pattern already established).
3. Add third-party APM/error product when traffic warrants it; keep using `reportError` as the single sink.
4. Thai/English UI dictionaries remain a product requirement; copy is still mostly English in MVP screens.

## Critical-path e2e covered

- Public home/demo/auth pages
- Unauthenticated dashboard/onboarding redirect
- Register → create organization → dashboard

No known critical cross-tenant read/write defect at Sprint 8 close.
