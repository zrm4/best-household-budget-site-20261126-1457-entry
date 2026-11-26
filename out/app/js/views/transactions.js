import { store } from '../store.js';
import { fmtUSD, fmtDateShort, monthKey } from '../format.js';

const CATEGORIES = [
  'Groceries', 'Rent', 'Utilities', 'Transport', 'Dining Out',
  'Health', 'Entertainment', 'Kids', 'Savings', 'Other'
];

let search = '';
let category = 'all';
let month = 'all';
let sort = 'date-desc';

function rerender() {
  const view = document.getElementById('view');
  if (!view) return;
  const path = window.location.hash.replace(/^#/, '') || '/';
  if (path !== '/transactions') return;
  view.innerHTML = render(store.getState());
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function categoryOptions(selected) {
  return CATEGORIES.map(c =>
    `<option value="${c}" ${c === selected ? 'selected' : ''}>${esc(c)}</option>`
  ).join('');
}

function filteredTxns(state) {
  let txns = state.transactions.slice();
  if (search) {
    const q = search.toLowerCase();
    txns = txns.filter(t => t.payee && t.payee.toLowerCase().includes(q));
  }
  if (category !== 'all') txns = txns.filter(t => t.category === category);
  if (month !== 'all') txns = txns.filter(t => monthKey(t.date) === month);
  switch (sort) {
    case 'date-asc': txns.sort((a, b) => a.date.localeCompare(b.date)); break;
    case 'amount-desc': txns.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)); break;
    case 'amount-asc': txns.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount)); break;
    default: txns.sort((a, b) => b.date.localeCompare(a.date));
  }
  return txns;
}

function monthOptions(state) {
  const keys = [...new Set(state.transactions.map(t => monthKey(t.date)))].sort().reverse();
  return keys.map(k =>
    `<option value="${k}" ${k === month ? 'selected' : ''}>${k}</option>`
  ).join('');
}

export function render(state) {
  const txns = filteredTxns(state);
  const total = txns.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount)), 0);
  const months = monthOptions(state);

  return `
  <section class="view">
    <h2>Transactions</h2>

    <div class="card">
      <div class="card-head">
        <h3>Add transaction</h3>
      </div>
      <form data-action="add-txn" class="txn-add-form">
        <div class="input-row">
          <div class="input-group">
            <label for="txn-date">Date</label>
            <input id="txn-date" name="date" type="date" required value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="input-group">
            <label for="txn-payee">Payee</label>
            <input id="txn-payee" name="payee" type="text" required placeholder="e.g. Trader Joe's" />
          </div>
          <div class="input-group">
            <label for="txn-amount">Amount</label>
            <input id="txn-amount" name="amount" type="number" step="0.01" required placeholder="0.00" inputmode="decimal" />
          </div>
          <div class="input-group">
            <label for="txn-category">Category</label>
            <select id="txn-category" name="category">${categoryOptions('Groceries')}</select>
          </div>
          <div class="input-group">
            <label for="txn-type">Type</label>
            <select id="txn-type" name="type">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div class="input-group">
            <button class="btn btn-primary" type="submit">Add</button>
          </div>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>All transactions</h3>
        <span class="muted">${txns.length} shown &middot; net ${fmtUSD(total)}</span>
      </div>
      <div class="filters">
        <div class="input-group search-box">
          <label for="txn-search">Search payee</label>
          <input id="txn-search" type="search" value="${esc(search)}" data-action="search" placeholder="Search payee&hellip;" />
        </div>
        <div class="input-group">
          <label for="txn-filter-category">Category</label>
          <select id="txn-filter-category" data-action="filter-category">
            <option value="all">All categories</option>
            ${categoryOptions(category)}
          </select>
        </div>
        <div class="input-group">
          <label for="txn-filter-month">Month</label>
          <select id="txn-filter-month" data-action="filter-month">
            <option value="all">All months</option>
            ${months}
          </select>
        </div>
        <div class="input-group">
          <label for="txn-sort">Sort</label>
          <select id="txn-sort" data-action="sort">
            <option value="date-desc" ${sort === 'date-desc' ? 'selected' : ''}>Date, newest first</option>
            <option value="date-asc" ${sort === 'date-asc' ? 'selected' : ''}>Date, oldest first</option>
            <option value="amount-desc" ${sort === 'amount-desc' ? 'selected' : ''}>Amount, high to low</option>
            <option value="amount-asc" ${sort === 'amount-asc' ? 'selected' : ''}>Amount, low to high</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="txn-table">
          <caption class="visually-hidden">All transactions with editable amount and category</caption>
          <thead>
            <tr><th scope="col">Date</th><th scope="col">Payee</th><th scope="col">Category</th><th scope="col">Amount</th><th scope="col">Type</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            ${txns.map(t => `
            <tr>
              <td data-label="Date">${fmtDateShort(t.date)}</td>
              <td data-label="Payee">${esc(t.payee)}</td>
              <td data-label="Category">
                <label class="visually-hidden" for="cat-${t.id}">Category for ${esc(t.payee)}</label>
                <select id="cat-${t.id}" class="table-select" data-action="edit-category" data-id="${t.id}">
                  ${categoryOptions(t.category)}
                </select>
              </td>
              <td data-label="Amount">
                <label class="visually-hidden" for="amt-${t.id}">Amount for ${esc(t.payee)}</label>
                <input id="amt-${t.id}" class="table-input" type="number" step="0.01" inputmode="decimal"
                  value="${Math.abs(t.amount).toFixed(2)}" data-action="edit-amount" data-id="${t.id}" aria-label="Amount for ${esc(t.payee)}" />
              </td>
              <td data-label="Type"><span class="badge badge-${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</span></td>
              <td data-label="Actions">
                <button class="btn btn-icon" data-action="delete-txn" data-id="${t.id}" aria-label="Delete transaction to ${esc(t.payee)}">
                  <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M6 2h4v1h4v1.5H2V3h4V2zM3.5 5.5h9L11.6 14H4.4L3.5 5.5zm2 1.5v5.5h1V7h-1zm2 0v5.5h1V7h-1zm2 0v5.5h1V7h-1z"/></svg>
                </button>
              </td>
            </tr>`).join('') || '<tr><td colspan="6" class="muted">No transactions match the current filters.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </section>`;
}

document.addEventListener('input', e => {
  const el = e.target.closest('[data-action="search"]');
  if (!el) return;
  search = el.value;
  rerender();
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'filter-category') { category = el.value; rerender(); }
  else if (action === 'filter-month') { month = el.value; rerender(); }
  else if (action === 'sort') { sort = el.value; rerender(); }
  else if (action === 'edit-amount') {
    const value = Number(el.value);
    if (isFinite(value) && value > 0) {
      const txn = store.getState().transactions.find(t => t.id === el.dataset.id);
      if (txn) store.updateTransaction(el.dataset.id, { amount: txn.type === 'income' ? value : -value });
    }
  }
  else if (action === 'edit-category') {
    store.updateTransaction(el.dataset.id, { category: el.value });
  }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-action="add-txn"]');
  if (!form) return;
  e.preventDefault();
  const data = new FormData(form);
  const amount = Number(data.get('amount'));
  if (!data.get('payee') || !isFinite(amount) || amount === 0) return;
  store.addTransaction({
    date: data.get('date'),
    payee: String(data.get('payee')).trim(),
    amount: amount,
    category: data.get('category'),
    type: data.get('type')
  });
  form.reset();
  rerender();
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action="delete-txn"]');
  if (!el) return;
  store.deleteTransaction(el.dataset.id);
  rerender();
});
