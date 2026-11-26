import { store } from '../store.js';
import { fmtUSD, monthLabel, prevMonth, nextMonth, currentMonthKey } from '../format.js';

let month = currentMonthKey();

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rerender() {
  const view = document.getElementById('view');
  if (!view) return;
  const path = window.location.hash.replace(/^#/, '') || '/';
  if (path !== '/budgets') return;
  view.innerHTML = render(store.getState());
}

function barColor(pct) {
  if (pct <= 75) return '#2f5d50';
  if (pct <= 100) return '#d9a441';
  return '#b4453a';
}

export function render(state) {
  const totals = store.categoryTotals(month);
  const summary = store.monthSummary(month);
  const rows = Object.keys(state.budgets)
    .map(cat => {
      const budgeted = Number(state.budgets[cat]) || 0;
      const spent = Math.round((totals[cat] || 0) * 100) / 100;
      const remaining = budgeted - spent;
      const pct = budgeted > 0 ? (spent / budgeted) * 100 : spent > 0 ? 999 : 0;
      const color = barColor(pct);
      const width = Math.min(100, Math.max(0, pct));
      const idSlug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<tr class="budget-row">
        <th scope="row" class="budget-cat">${esc(cat)}</th>
        <td class="budget-edit">
          <label class="visually-hidden" for="budget-${idSlug}">Budgeted amount for ${esc(cat)}</label>
          <input id="budget-${idSlug}" type="number" min="0" step="1" inputmode="decimal"
            value="${budgeted}" data-action="edit-budget" data-cat="${esc(cat)}"
            aria-label="Budgeted amount for ${esc(cat)}" />
        </td>
        <td class="budget-spent">${fmtUSD(spent)}</td>
        <td class="budget-remaining ${remaining < 0 ? 'over' : ''}">${fmtUSD(remaining)}</td>
        <td class="budget-bar-cell">
          <div class="budget-bar" role="img" aria-label="${esc(cat)}: ${fmtUSD(spent)} of ${fmtUSD(budgeted)} used, ${Math.min(999, Math.round(pct))}% of budget">
            <span class="budget-bar-fill" style="width:${width}%;background:${color}"></span>
          </div>
          <span class="budget-pct">${Math.min(999, Math.round(pct))}%</span>
        </td>
      </tr>`;
    })
    .join('');

  const totalBudgeted = Object.values(state.budgets).reduce((s, v) => s + (Number(v) || 0), 0);
  const unbudgeted = summary.income - totalBudgeted;
  const unbudgetedTone = unbudgeted < 0 ? 'callout-over' : 'callout-ok';

  return `<section class="budgets">
    <div class="dashboard-head">
      <div>
        <h2>Budgets</h2>
        <p class="muted">Plan each category for ${monthLabel(month + '-01')}.</p>
      </div>
      <div class="month-picker">
        <button type="button" class="btn btn-icon" data-action="prev-month" aria-label="Previous month">&larr;</button>
        <span class="month-label" aria-live="polite">${monthLabel(month + '-01')}</span>
        <button type="button" class="btn btn-icon" data-action="next-month" aria-label="Next month">&rarr;</button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="budget-table">
          <caption class="visually-hidden">Monthly budget per category with spending progress</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Budgeted</th>
              <th scope="col">Spent</th>
              <th scope="col">Remaining</th>
              <th scope="col">Progress</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>

    <div class="callout ${unbudgetedTone}" role="status">
      <strong>Unbudgeted income:</strong>
      ${unbudgeted >= 0
        ? `${fmtUSD(unbudgeted)} of this month's income is not assigned to a category yet.`
        : `Budgets exceed this month's income by ${fmtUSD(Math.abs(unbudgeted))}.`}
    </div>

    <div class="card">
      <h3>Add category budget</h3>
      <form data-action="add-budget" class="budget-add-form">
        <div class="field">
          <label for="new-budget-cat">Category name</label>
          <input id="new-budget-cat" name="cat" type="text" required placeholder="e.g. Pets" />
        </div>
        <div class="field">
          <label for="new-budget-amt">Monthly amount</label>
          <input id="new-budget-amt" name="amt" type="number" min="0" step="1" inputmode="decimal" required placeholder="150" />
        </div>
        <button type="submit" class="btn btn-primary">Add budget</button>
      </form>
    </div>
  </section>`;
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'prev-month') {
    month = prevMonth(month);
    rerender();
  } else if (el.dataset.action === 'next-month') {
    month = nextMonth(month);
    rerender();
  }
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-action="edit-budget"]');
  if (!el) return;
  const cat = el.dataset.cat;
  const amt = Number(el.value);
  if (!cat || isNaN(amt) || amt < 0) {
    rerender();
    return;
  }
  store.setBudget(cat, amt);
  rerender();
});

document.addEventListener('submit', e => {
  const el = e.target.closest('[data-action="add-budget"]');
  if (!el) return;
  e.preventDefault();
  const cat = el.querySelector('#new-budget-cat').value.trim();
  const amt = Number(el.querySelector('#new-budget-amt').value);
  if (!cat || isNaN(amt) || amt < 0) return;
  store.setBudget(cat, amt);
  rerender();
});
