// Dependency-free SVG chart builders. Each function returns an SVG string.

const PALETTE = [
  '#2f5d50', // deep green
  '#c96f4a', // terracotta
  '#3d7a6b', // green light
  '#d98563', // terracotta light
  '#1f4238', // green dark
  '#a65738', // terracotta dark
  '#7fa899', // sage
  '#e0b394', // clay
  '#58857a', // sea green
  '#b5927b'  // tan
];

const TEXT = '#2d2d2d';
const MUTED = '#6b6b6b';
const BORDER = '#e0d8c8';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function svgOpen(width, height, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${esc(label)}" class="chart">
  <title>${esc(label)}</title>`;
}

function niceMax(value) {
  if (value <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const unit = value / pow;
  let step;
  if (unit <= 1) step = 1;
  else if (unit <= 2) step = 2;
  else if (unit <= 2.5) step = 2.5;
  else if (unit <= 5) step = 5;
  else step = 10;
  return step * pow;
}

function fmtShort(n) {
  if (Math.abs(n) >= 1000) {
    const k = n / 1000;
    return (k % 1 === 0 ? k : k.toFixed(1)) + 'k';
  }
  return String(Math.round(n * 10) / 10);
}

/**
 * barChart(series)
 * series: [{ label, value, color? }]
 * Vertical bars with value labels and gridlines.
 */
export function barChart(series, options = {}) {
  const items = (series || []).filter(s => s && s.label != null && isFinite(Number(s.value)));
  const width = options.width || 640;
  const height = options.height || 320;
  const pad = { top: 24, right: 16, bottom: 44, left: 56 };
  const label = options.label || 'Bar chart';

  if (items.length === 0) {
    return svgOpen(width, height, label) + `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${MUTED}" font-size="14">No data</text></svg>`;
  }

  const values = items.map(s => Number(s.value));
  const max = niceMax(Math.max(...values, 0));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slot = innerW / items.length;
  const barW = Math.min(slot * 0.6, 64);

  let out = svgOpen(width, height, label);

  // gridlines + y tick labels
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = (max / ticks) * i;
    const y = pad.top + innerH - (v / max) * innerH;
    out += `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="${BORDER}" stroke-width="1"/>`;
    out += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="${MUTED}" font-size="11">${fmtShort(v)}</text>`;
  }

  items.forEach((s, i) => {
    const v = Number(s.value);
    const h = max > 0 ? (v / max) * innerH : 0;
    const x = pad.left + slot * i + (slot - barW) / 2;
    const y = pad.top + innerH - h;
    const color = s.color || PALETTE[i % PALETTE.length];
    const name = esc(s.label);
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${color}">
      <title>${name}: ${fmtShort(v)}</title>
    </rect>`;
    // x label
    const lx = pad.left + slot * i + slot / 2;
    const shortLabel = String(s.label).length > 10 ? String(s.label).slice(0, 9) + '…' : s.label;
    out += `<text x="${lx.toFixed(1)}" y="${height - pad.bottom + 16}" text-anchor="middle" fill="${TEXT}" font-size="11">${esc(shortLabel)}</text>`;
    // value label
    out += `<text x="${lx.toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" fill="${MUTED}" font-size="10">${fmtShort(v)}</text>`;
  });

  out += `</svg>`;
  return out;
}

/**
 * donutChart(parts)
 * parts: [{ label, value, color? }]
 * Donut with percentage-sliced segments; center shows total.
 */
export function donutChart(parts, options = {}) {
  const items = (parts || []).filter(p => p && p.label != null && isFinite(Number(p.value)) && Number(p.value) > 0);
  const size = options.size || 260;
  const label = options.label || 'Donut chart';
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const thickness = size * 0.13;
  const total = items.reduce((sum, p) => sum + Number(p.value), 0);

  if (items.length === 0 || total <= 0) {
    return svgOpen(size, size, label) + `<text x="${cx}" y="${cy}" text-anchor="middle" fill="${MUTED}" font-size="13">No data</text></svg>`;
  }

  let out = svgOpen(size, size, label);
  let angle = -Math.PI / 2; // start at 12 o'clock

  items.forEach((p, i) => {
    const value = Number(p.value);
    const frac = value / total;
    const sweep = frac * Math.PI * 2;
    const endAngle = angle + sweep;
    const r = radius;
    const rInner = radius - thickness;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const x3 = cx + rInner * Math.cos(endAngle);
    const y3 = cy + rInner * Math.sin(endAngle);
    const x4 = cx + rInner * Math.cos(angle);
    const y4 = cy + rInner * Math.sin(angle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const color = p.color || PALETTE[i % PALETTE.length];
    const pct = Math.round(frac * 1000) / 10;

    out += `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)}
      A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}
      L ${x3.toFixed(2)} ${y3.toFixed(2)}
      A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z"
      fill="${color}" stroke="#faf6ef" stroke-width="2">
      <title>${esc(p.label)}: ${pct}%</title>
    </path>`;
    angle = endAngle;
  });

  // center total
  out += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="${TEXT}" font-size="18" font-weight="600">${fmtShort(total)}</text>`;
  out += `<text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="${MUTED}" font-size="11">total</text>`;

  out += `</svg>`;
  return out;
}

/**
 * lineChart(points)
 * points: [{ label, value }] or [{ label, a, b }] for two lines.
 * Draws gridlines, axis labels, and one or two polylines with dots.
 */
export function lineChart(points, options = {}) {
  const items = (points || []).filter(p => p && p.label != null);
  const width = options.width || 640;
  const height = options.height || 320;
  const pad = { top: 24, right: 16, bottom: 44, left: 56 };
  const twoLines = items.length > 0 && items.every(p => p.a != null && p.b != null);
  const label = options.label || 'Line chart';

  if (items.length === 0) {
    return svgOpen(width, height, label) + `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${MUTED}" font-size="14">No data</text></svg>`;
  }

  const values = twoLines
    ? items.flatMap(p => [Number(p.a), Number(p.b)])
    : items.map(p => Number(p.value));
  const max = niceMax(Math.max(...values, 0));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const stepX = items.length > 1 ? innerW / (items.length - 1) : 0;

  const xAt = i => pad.left + stepX * i;
  const yAt = v => pad.top + innerH - (v / max) * innerH;

  let out = svgOpen(width, height, label);

  // gridlines + y tick labels
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = (max / ticks) * i;
    const y = yAt(v);
    out += `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="${BORDER}" stroke-width="1"/>`;
    out += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="${MUTED}" font-size="11">${fmtShort(v)}</text>`;
  }

  // x labels
  items.forEach((p, i) => {
    const shortLabel = String(p.label).length > 10 ? String(p.label).slice(0, 9) + '…' : p.label;
    out += `<text x="${xAt(i).toFixed(1)}" y="${height - pad.bottom + 16}" text-anchor="middle" fill="${TEXT}" font-size="11">${esc(shortLabel)}</text>`;
  });

  const drawSeries = (getKey, color, name) => {
    const pts = items.map((p, i) => `${xAt(i).toFixed(1)},${yAt(Number(getKey(p))).toFixed(1)}`).join(' ');
    out += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    items.forEach((p, i) => {
      const v = Number(getKey(p));
      out += `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(v).toFixed(1)}" r="4" fill="${color}">
        <title>${esc(p.label)} — ${name}: ${fmtShort(v)}</title>
      </circle>`;
    });
  };

  if (twoLines) {
    drawSeries(p => p.a, '#2f5d50', 'Series A');
    drawSeries(p => p.b, '#c96f4a', 'Series B');
    // legend
    out += `<g font-size="11" fill="${TEXT}">
      <rect x="${pad.left}" y="4" width="10" height="10" fill="#2f5d50" rx="2"/>
      <text x="${pad.left + 14}" y="13">${esc(options.labelA || 'Series A')}</text>
      <rect x="${pad.left + 90}" y="4" width="10" height="10" fill="#c96f4a" rx="2"/>
      <text x="${pad.left + 104}" y="13">${esc(options.labelB || 'Series B')}</text>
    </g>`;
  } else {
    drawSeries(p => p.value, '#2f5d50', options.seriesName || 'Value');
  }

  out += `</svg>`;
  return out;
}
