import { store } from '../store.js';
import { fmtUSD, monthKey, prevMonth, currentMonthKey, monthLabel } from '../format.js';
import { barChart, donutChart, lineChart } from '../charts.js';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMonths() {
  const months = [];
  let m = currentMonthKey();
  for (let i = 0; i < 6; i++) {
    months.unshift(m);
    m = prevMonth(m);
  }
  return months;
}

function insightCard(title, body) {
  return `<div class="insight-card"><h4>${esc(title)}</h4><p>${body}</p></div>`;
}

export function render(state) {
  const months = buildMonths();
  const summaries = months.map(m => ({ key: m, summary: store.monthSummary(m) }));

  const points = summaries.map(({ key, summary }) => ({
    label: monthLabel(key + '-01'),
    a: summary.income,
    b: summary.expenses
  }));

  const trendSvg = lineChart(points, {
    label: 'Income vs spending — last 6 months',
    labelA: 'Income',
    labelB: 'Spending'
  });

  const current = currentMonthKey();
  const totals = store.categoryTotals(current);
  const parts = Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const donutSvg = donutChart(parts, { label: `Spending by category — ${monthLabel(current + '-01')}` });
  const donutTotal = parts.reduce((s, p) => s + p.value, 0);

  const legend = parts.length
    ? parts.map(p => `
        <li class="legend-item">
          <span class="legend-label">${esc(p.label)}</span>
          <span class="legend-value">${fmtUSD(p.value)}</span>
        </li>`).join('')
    : '<li class="muted">No expenses this month.</li>';

  const totalSpend = summaries.reduce((s, { summary }) => s + summary.expenses, 0);
  const avgSpend = totalSpend / 6;

  const avgRate = summaries.reduce((s, { summary }) => s + summary.savingsRate, 0) / 6;

  const biggest = parts[0];
  const biggestCard = biggest
    ? insightCard('Biggest spending category', `${esc(biggest.label)} — ${fmtUSD(biggest.value)} (${donutTotal > 0 ? ((biggest.value / donutTotal) * 100).toFixed(1) : 0}% of spending)`)
    : insightCard('Biggest spending category', 'No expenses recorded this month.');

  const prevKey = prevMonth(current);
  const prevTotals = store.categoryTotals(prevKey);
  let moM = null;
  parts.forEach(p => {
    const delta = p.value - (prevTotals[p.label] || 0);
    if (!moM || delta > moM.delta) moM = { label: p.label, delta, prev: prevTotals[p.label] || 0 };
  });
  const momCard = moM
    ? insightCard('Biggest month-over-month increase', `${esc(moM.label)} — ${fmtUSD(moM.prev)} &rarr; ${fmtUSD(moM.prev + moM.delta)} (+${fmtUSD(moM.delta)})`)
    : insightCard('Biggest month-over-month increase', 'No expenses recorded.');

  const avgRateCard = insightCard('Average savings rate', `${avgRate >= 0 ? '' : '-'}${Math.abs(avgRate).toFixed(1)}% <span class="muted">over 6 months</span>`);

  return `<section class="reports">
    <h2>Reports</h2>
    <p class="muted">Six months ending ${monthLabel(current + '-01')}.</p>

    <div class="card chart-container">
      <h3 class="chart-title">Income vs spending</h3>
      <div class="chart-wrapper">${trendSvg}</div>
    </div>

    <div class="stat-grid">
      ${insightCard('Average monthly spend (6 mo)', fmtUSD(avgSpend))}
      ${insightCard('Total spend (6 mo)', fmtUSD(totalSpend))}
    </div>

    <div class="card chart-container">
      <h3 class="chart-title">Spending by category — ${monthLabel(current + '-01')}</h3>
      <div class="chart-wrapper">${donutSvg}</div>
      <ul class="donut-legend">${legend}</ul>
    </div>

    <h3>Insights</h3>
    <div class="insight-cards">
      ${biggestCard}
      ${momCard}
      ${avgRateCard}
    </div>
  </section>`;
}
