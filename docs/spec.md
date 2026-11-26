# Build spec — "Hearth Ledger" household budget site

Build a complete household-budget web app as **plain static files under `app/`** (ES modules, no build step, no framework, no external network requests of any kind). Working directory is the repo root; everything you write goes under `app/`.

## Brand
Original name: **Hearth Ledger**. Tagline: "Your home's money, in one warm view." Original design: warm cream/paper background (#faf6ef), deep green primary (#2f5d50), terracotta accent (#c96f4a), soft card shadows, rounded 12px cards. System font stack. Original SVG inline icons only (small hand-written paths). No images fetched from anywhere; any decorative graphic is inline SVG.

## Architecture (files with one job each)
- `app/index.html` — shell: header with brand + `<nav>` links (Dashboard, Transactions, Budgets, Goals, Reports), `<main id="view">`, footer. Links are hash routes (`#/`, `#/transactions`, `#/budgets`, `#/goals`, `#/reports`). Loads `style.css` and `js/main.js` as module.
- `app/css/style.css` — all styles, including a full mobile layout (`@media (max-width: 640px)`: nav becomes a bottom bar or wrap, cards stack, tables become readable rows).
- `app/js/main.js` — entry module: wires hash router to views, calls `store.init()`.
- `app/js/store.js` — data layer: seeded demo data + localStorage persistence (`hearth-ledger-v1`), exports `store` with `init`, `getState`, `addTransaction`, `deleteTransaction`, `updateTransaction`, `setBudget`, `addGoal`, `contributeGoal`, derived helpers (`monthSummary`, `categoryTotals`, `upcomingBills`).
- `app/js/format.js` — currency/date formatting helpers (`fmtUSD`, `fmtDate`, `monthLabel`).
- `app/js/charts.js` — dependency-free SVG chart builders: `barChart(series)`, `donutChart(parts)`, `lineChart(points)`, each returning an SVG string.
- `app/js/views/dashboard.js`, `transactions.js`, `budgets.js`, `goals.js`, `reports.js` — one render(state) function each returning an HTML string, plus event binding.

## Pages — every control must work, nothing placeholder
1. **Dashboard** — greeting, month picker (prev/next arrows), four stat cards (income, spent, remaining, savings rate) computed from real data; donut of spend by category; upcoming bills list (dates, amounts, "paid" checkboxes that mark the bill paid); recent 5 transactions with links.
2. **Transactions** — full list with search box (filters as you type), category + month filter selects, sort selector, add-transaction form (date, payee, amount, category, type) that appends and persists, delete buttons per row, edit inline (amount/category). Total shown for the filtered set.
3. **Budgets** — per-category budget rows: name, budgeted (editable number input, persists), spent, remaining, horizontal progress bar colored green→amber→red by % used; month navigation; "unbudgeted income" callout; add-category form.
4. **Goals** — savings goals (emergency fund, vacation, new washer…): target, saved, progress ring/bar, contribute button (+$25/$50/$100 quick amounts), add-goal form, estimated completion from average monthly contribution.
5. **Reports** — 6-month income vs spending line/bar chart; category breakdown donut with legend + amounts; average monthly spend; biggest category insight cards; all computed from store data.

## Data (seeded, realistic, US household)
- Categories: Groceries, Rent, Utilities, Transport, Dining Out, Health, Entertainment, Kids, Savings, Other — with monthly budgets summing near income.
- ~120 transactions across the current and previous 5 months (Nov 2026 back to Jun 2026): realistic payees (Trader Joe's, Shell, Comcast, Netflix, CVS, Home Depot, daycare…), amounts, occasional refunds/returns.
- 3 recurring bills with due dates (rent $1,650 on the 1st, Comcast $89 on the 12th, Netflix $15.49 on the 18th).
- 3 goals: Emergency fund (target 9,000, saved 4,320), Maui trip (3,200 / 1,150), New washer (1,400 / 620).
- Monthly income ~4,850 (paychecks on the 1st and 15th).

## Quality bar
- Real figures everywhere, computed from the store — never hardcoded fake numbers in the views.
- Accessible: labels on inputs, `aria-label`s on icon buttons, focus styles, contrast ≥ 4.5:1 for text.
- Responsive at 1280px and at 390px width.
- No `console` errors; verify with `node serve.ts` (serves app/ on :8080) and curl checks.
- Keep total source under ~90 KB.
