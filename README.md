# FoodCostly

Multi-tenant SaaS for restaurant ingredient purchasing, inventory, recipe costing, sales, and profitability.

## Package manager

**Bun** is the official package manager for FoodCostly.

- Lockfile: `bun.lock` (commit it)
- Use `bun add` / `bun remove` only
- Do not use `npm install`, `yarn`, or `pnpm` in this project

Recommended: latest stable Bun.

## Getting started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env` and fill in Neon connection strings before running Prisma.

## Common commands

| Task | Command |
| --- | --- |
| Install | `bun install` |
| Add package | `bun add package-name` |
| Add dev package | `bun add -d package-name` |
| Remove package | `bun remove package-name` |
| Dev server | `bun dev` |
| Build | `bun run build` |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` |
| Unit tests | `bun run test` |
| E2E tests | `bun run test:e2e` |
| Prisma generate | `bunx prisma generate` |
| Prisma migrate | `bunx prisma migrate dev` |

## CI note

GitHub Actions auto-CI is **deferred** (account billing lock). The workflow
file remains at `.github/workflows/ci.yml` but only supports manual
`workflow_dispatch` until billing is fixed. Until then, run lint,
typecheck, test, and build locally before merging.

## Stack

Next.js App Router · TypeScript · Tailwind CSS · shadcn/ui · Neon PostgreSQL · Prisma ORM v7 · Bun · Vercel
