import { store } from '../store.js';
import { fmtUSD, fmtDateShort, monthLabel, monthKey, prevMonth, nextMonth, currentMonthKey } from '../format.js';
import { donutChart } from '../charts.js';

let month = currentMonthKey();

function rerender() {
  const view = document.getElementById('view');
  if (!view) return;
  const path = window.location.hash.replace(/^#/, '') || '/';
  if (path !== '/') return;
  view.innerHTML = render(store.getState());
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statCard(label, value, sub) {
  return `<div class="card stat-card">
    <div class="stat-label">${esc(label)}</div>
    <div class="stat-value">${value}</div>
    ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
  </div>`;
}

export function render(state) {
  const summary = store.monthSummary(month);
  const totals = store.categoryTotals(month);
  const bills = store.upcomingBills(month);
  const recent = [...summary.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5);

  const donutParts = Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const donutSvg = donutChart(donutParts, { label: `Spend by category — ${monthLabel(month + '-01')}` });
  const legendMax = Math.max(...donutParts.map(p => p.value), 1);

  const savingsRate = summary.savingsRate;
  const rateText = `${savingsRate >= 0 ? '' : '-'}${Math.abs(savingsRate).toFixed(1)}%`;

  return `<section class="dashboard">
    <div class="dashboard-head">
      <div>
        <h2>${greeting()}, Hearth household</h2>
        <p class="muted">Your home's money, in one warm view — for ${monthLabel(month + '-01')}.</p>
      </div>
      <div class="month-picker">
        <button type="button" class="btn btn-icon" data-action="prev-month" aria-label="Previous month">&larr;</button>
        <span class="month-label" aria-live="polite">${monthLabel(month + '-01')}</span>
        <button type="button" class="btn btn-icon" data-action="next-month" aria-label="Next month">&rarr;</button>
      </div>
    </div>

    <div class="stat-grid">
      ${statCard('Income', fmtUSD(summary.income), 'For this month')}
      ${statCard('Spent', fmtUSD(summary.expenses), 'Expenses this month')}
      ${statCard('Remaining', fmtUSD(summary.net), summary.net >= 0 ? 'Under budget' : 'Over budget')}
      ${statCard('Savings rate', rateText, 'Net ÷ income')}
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <h3>Spend by category</h3>
        ${donutSvg}
        <ul class="donut-legend">
          ${donutParts.map(p => `
            <li>
              <span class="legend-label">${esc(p.label)}</span>
              <span class="legend-bar" aria-hidden="true"><span style="width:${Math.max(4, Math.round((p.value / legendMax) * 100))}%"></span></span>
              <span class="legend-value">${fmtUSD(p.value)}</span>
            </li>`).join('')}
        </ul>
      </div>

      <div class="card">
        <h3>Upcoming bills</h3>
        <ul class="bills-list">
          ${bills.map(b => `
            <li class="bill-row ${b.paid ? 'bill-paid' : ''}">
              <label class="bill-check">
                <input type="checkbox" data-action="toggle-bill" data-id="${esc(b.id)}" ${b.paid ? 'checked' : ''} aria-label="Mark ${esc(b.name)} as paid" />
                <span class="bill-name">${esc(b.name)}</span>
              </label>
              <span class="bill-date">${fmtDateShort(b.dueDate)}</span>
              <span class="bill-amount">${fmtUSD(b.amount)}</span>
            </li>`).join('') || '<li class="muted">No upcoming bills this month.</li>'}
        </ul>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Recent transactions</h3>
        <a class="btn btn-link" href="#/transactions">View all &rarr;</a>
      </div>
      <ul class="recent-list">
        ${recent.map(t => `
          <li class="recent-row">
            <a href="#/transactions" class="recent-link">
              <span class="recent-date">${fmtDateShort(t.date)}</span>
              <span class="recent-payee">${esc(t.payee)}</span>
              <span class="recent-category">${esc(t.category)}</span>
              <span class="recent-amount ${t.type === 'income' ? 'amt-income' : 'amt-expense'}">${t.type === 'income' ? '+' : '&minus;'}${fmtUSD(Math.abs(t.amount))}</span>
            </a>
          </li>`).join('') || '<li class="muted">No transactions this month.</li>'}
      </ul>
    </div>
  </section>`;
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.type === 'checkbox') return;
  const action = el.dataset.action;
  if (action === 'prev-month') {
    month = prevMonth(month);
    rerender();
  } else if (action === 'next-month') {
    month = nextMonth(month);
    rerender();
  } else if (action === 'toggle-bill') {
    store.toggleBillPaid(el.dataset.id);
    rerender();
  }
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-action="toggle-bill"]');
  if (!el) return;
  store.toggleBillPaid(el.dataset.id);
  rerender();
});
