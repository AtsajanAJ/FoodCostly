# FoodCostly user guide (MVP)

FoodCostly helps one restaurant location track purchases, stock, recipe cost, sales, and contribution margin.

## 1. Account and organization

1. Create an account, then create your restaurant organization.
2. MVP = one location per organization (no branches).
3. Switch organizations from the dashboard if you belong to more than one.

## 2. Ingredients and purchases

1. Add ingredients with a base unit (g, ml, or pcs).
2. Add suppliers, create a draft purchase, then **Receive** it.
3. Receiving increases stock once and updates moving weighted average cost (MWAC).

## 3. Inventory

1. View balances and the ledger under Inventory.
2. Record waste, adjustments, or stock counts as compensating movements.
3. Stock can never go negative.

## 4. Recipes and menus

1. Create a recipe with ingredient lines and edible yield %.
2. Publish a cost version to freeze today’s MWAC into a snapshot.
3. Create menu items with in-store and delivery prices (optionally pin a version).

## 5. Sales

1. Configure channel fees (none / percent / fixed) on the Sales page.
2. Post a sale — stock for recipe ingredients is deducted immediately.
3. If stock is insufficient, the whole sale is rejected.
4. Cancel a sale to reverse stock with a ledger reversal (history is kept).

## 6. Reports

1. Dashboard KPIs use your organization timezone.
2. Filter by date range and channel.
3. Figures show **contribution margin**, not net profit (operating expenses are out of scope).
4. Export CSV from report pages when available.

## Demo

Visit `/demo` to explore sample UI without saving data.
