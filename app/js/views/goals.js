import { store } from '../store.js';
import { fmtUSD, fmtDate } from '../format.js';

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function avgMonthlySavings() {
  const txns = store.getState().transactions;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const total = txns
    .filter(t => t.category === 'Savings' && new Date(t.date + 'T00:00:00') >= start)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  return total / 6;
}

function estimatedCompletion(goal) {
  const remaining = Math.max(0, goal.target - goal.saved);
  if (remaining <= 0) return 'Goal complete';
  const avg = avgMonthlySavings();
  if (avg <= 0) return 'No recent contributions';
  const months = Math.ceil(remaining / avg);
  const eta = new Date();
  eta.setMonth(eta.getMonth() + months);
  return `~${fmtDate(eta.toISOString().split('T')[0])} (${months} mo at ${fmtUSD(avg)}/mo)`;
}

function progressRing(pct) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, pct) / 100) * c;
  return `<svg class="goal-ring" width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="${pct}% complete">
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="#e8e0d0" stroke-width="9"/>
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="#2f5d50" stroke-width="9"
      stroke-linecap="round" stroke-dasharray="${filled} ${c - filled}" transform="rotate(-90 42 42)"/>
    <text x="42" y="47" text-anchor="middle" font-size="15" font-weight="600" fill="#2f5d50">${pct}%</text>
  </svg>`;
}

function goalCard(goal) {
  const pct = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
  return `<article class="card goal-card">
    <div class="goal-head">
      ${progressRing(pct)}
      <div>
        <h3>${esc(goal.name)}</h3>
        <p><strong>${fmtUSD(goal.saved)}</strong> of ${fmtUSD(goal.target)} saved</p>
        <p class="goal-eta">${estimatedCompletion(goal)}</p>
      </div>
    </div>
    <div class="goal-actions" role="group" aria-label="Contribute to ${esc(goal.name)}">
      <button type="button" data-action="contribute" data-id="${goal.id}" data-amount="25">+$25</button>
      <button type="button" data-action="contribute" data-id="${goal.id}" data-amount="50">+$50</button>
      <button type="button" data-action="contribute" data-id="${goal.id}" data-amount="100">+$100</button>
    </div>
  </article>`;
}

export function render(state) {
  const goalsHtml = state.goals.map(goalCard).join('');
  return `<section aria-labelledby="goals-title">
    <h2 id="goals-title">Savings Goals</h2>
    <div class="goal-grid">${goalsHtml || '<p>No goals yet. Add one below.</p>'}</div>
    <form class="card goal-form" aria-label="Add a savings goal">
      <h3>Add a Goal</h3>
      <div class="form-row">
        <label for="goal-name">Goal name</label>
        <input id="goal-name" name="name" type="text" required placeholder="New washer">
      </div>
      <div class="form-row">
        <label for="goal-target">Target amount ($)</label>
        <input id="goal-target" name="target" type="number" min="1" step="0.01" required placeholder="1400">
      </div>
      <div class="form-row">
        <label for="goal-saved">Starting amount ($)</label>
        <input id="goal-saved" name="saved" type="number" min="0" step="0.01" value="0">
      </div>
      <button type="button" data-action="add-goal">Add Goal</button>
    </form>
  </section>`;
}

function rerender() {
  if (window.location.hash !== '#/goals') return;
  const view = document.getElementById('view');
  if (view) view.innerHTML = render(store.getState());
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'contribute') {
    store.contributeGoal(btn.dataset.id, Number(btn.dataset.amount));
    rerender();
  } else if (btn.dataset.action === 'add-goal') {
    const form = btn.closest('form');
    const name = form.querySelector('#goal-name').value.trim();
    const target = Number(form.querySelector('#goal-target').value);
    const saved = Number(form.querySelector('#goal-saved').value) || 0;
    if (!name || !(target > 0)) return;
    store.addGoal({ name, target, saved });
    rerender();
  }
});
