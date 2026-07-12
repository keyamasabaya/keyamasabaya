// Self-hosted stats cards for the w3spi5 profile — no flaky third-party image
// services. When run inside GitHub Actions (GH_TOKEN present) it refreshes
// assets/stats.json from the GitHub API, then renders the SVGs. Locally (no
// token) it just re-renders from the committed stats.json.
//   node assets/stats.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = dirname(fileURLToPath(import.meta.url));
const USER = process.env.STATS_USER || 'w3spi5';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const CYAN = '#00e5ff', PURPLE = '#bd00ff', TEXT = '#c9d1d9', MUTED = '#8b98a9', BORDER = '#3a4658';
const FONT = "'JetBrains Mono','Fira Code','SFMono-Regular',ui-monospace,'Courier New',monospace";
const CHARW = 0.6;
const LANG_COLORS = [CYAN, PURPLE, '#3fb950', '#f0b90b', '#58a6ff', '#ff7b72', '#a371f7', '#ffa657'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const glow = (id, c, op = 0.14, blur = 10) =>
  `<filter id="${id}" x="-40%" y="-60%" width="180%" height="220%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0" stdDeviation="${blur}" flood-color="${c}" flood-opacity="${op}"/></filter>`;

// -------- optional live fetch (GitHub Actions) --------------------------
async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': USER },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}
async function refresh() {
  const user = await gh(`/users/${USER}`);
  let repos = [], page = 1;
  while (true) {
    const batch = await gh(`/users/${USER}/repos?per_page=100&type=owner&page=${page}`);
    repos = repos.concat(batch);
    if (batch.length < 100) break;
    page++;
  }
  const owned = repos.filter((r) => !r.fork);
  const stars = owned.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const bytes = {};
  for (const r of owned) {
    try {
      const langs = await gh(`/repos/${r.full_name}/languages`);
      for (const [k, v] of Object.entries(langs)) bytes[k] = (bytes[k] || 0) + v;
    } catch { /* skip */ }
  }
  const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(bytes)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, v]) => ({ name, pct: Math.round((v * 1000) / total) / 10 }));
  const prs = (await gh(`/search/issues?q=author:${USER}+type:pr&per_page=1`)).total_count;
  const issues = (await gh(`/search/issues?q=author:${USER}+type:issue&per_page=1`)).total_count;
  const data = { repos: user.public_repos, followers: user.followers, stars, prs, issues, langs };
  writeFileSync(join(OUT, 'stats.json'), JSON.stringify(data, null, 2));
  return data;
}

// -------- rendering -----------------------------------------------------
const W = 860;
function overview(d) {
  const H = 150;
  const cells = [
    { n: d.repos, l: 'Repositories' },
    { n: d.stars, l: 'Stars Earned' },
    { n: d.prs, l: 'Pull Requests' },
    { n: d.issues, l: 'Issues Opened' },
  ];
  const cw = (W - 24) / cells.length;
  let body = `<circle cx="25" cy="30" r="4.5" fill="${CYAN}"/><text x="40" y="30" font-family="${FONT}" font-size="16" font-weight="700" fill="${TEXT}" dominant-baseline="central"><tspan fill="${MUTED}">// </tspan>overview</text>`;
  cells.forEach((c, i) => {
    const cx = 12 + cw * i + cw / 2;
    const col = i % 2 === 0 ? CYAN : PURPLE;
    if (i > 0) body += `<line x1="${12 + cw * i}" y1="66" x2="${12 + cw * i}" y2="126" stroke="${BORDER}" stroke-opacity="0.5"/>`;
    body += `<text x="${cx}" y="94" font-family="${FONT}" font-size="34" font-weight="800" fill="${col}" text-anchor="middle" dominant-baseline="central">${c.n}</text>`;
    body += `<text x="${cx}" y="120" font-family="${FONT}" font-size="12.5" fill="${MUTED}" text-anchor="middle" dominant-baseline="central">${esc(c.l)}</text>`;
  });
  writeFileSync(join(OUT, 'stat-overview.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub overview">
<defs>${glow('o', CYAN)}</defs>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="18" fill="none" stroke="${BORDER}" stroke-opacity="0.85" stroke-width="1" filter="url(#o)"/>
${body}</svg>`);
}

function languages(d) {
  const H = 170, barY = 58, barH = 18, barX = 24, barW = W - 48;
  const langs = d.langs.slice(0, 6);
  let x = barX, bar = '', legend = '';
  const perRow = 3, colW = barW / perRow, ly0 = 100, rowH = 30;
  langs.forEach((l, i) => {
    const col = LANG_COLORS[i % LANG_COLORS.length];
    const segW = Math.max(2, (barW * l.pct) / 100);
    bar += `<rect x="${x.toFixed(1)}" y="${barY}" width="${segW.toFixed(1)}" height="${barH}" fill="${col}" ${i === 0 ? 'rx="4"' : ''}/>`;
    x += segW;
    const row = Math.floor(i / perRow), c = i % perRow;
    const lx = barX + colW * c, ly = ly0 + row * rowH;
    legend += `<circle cx="${lx + 6}" cy="${ly}" r="5" fill="${col}"/>`;
    legend += `<text x="${lx + 20}" y="${ly}" font-family="${FONT}" font-size="13.5" fill="${TEXT}" dominant-baseline="central">${esc(l.name)}</text>`;
    legend += `<text x="${lx + colW - 20}" y="${ly}" font-family="${FONT}" font-size="13" font-weight="700" fill="${col}" text-anchor="end" dominant-baseline="central">${l.pct}%</text>`;
  });
  writeFileSync(join(OUT, 'stat-langs.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Most used languages">
<defs>${glow('l', PURPLE)}<clipPath id="bc"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="9"/></clipPath></defs>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="18" fill="none" stroke="${BORDER}" stroke-opacity="0.85" stroke-width="1" filter="url(#l)"/>
<circle cx="25" cy="30" r="4.5" fill="${PURPLE}"/><text x="40" y="30" font-family="${FONT}" font-size="16" font-weight="700" fill="${TEXT}" dominant-baseline="central"><tspan fill="${MUTED}">// </tspan>most used languages</text>
<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="9" fill="${BORDER}" fill-opacity="0.25"/>
<g clip-path="url(#bc)">${bar}</g>
${legend}</svg>`);
}

// -------- main ----------------------------------------------------------
let data;
if (TOKEN) {
  try { data = await refresh(); console.log('stats refreshed from API'); }
  catch (e) { console.error('API refresh failed, using committed stats.json:', e.message); }
}
if (!data) data = JSON.parse(readFileSync(join(OUT, 'stats.json'), 'utf8'));
overview(data);
languages(data);
console.log('rendered stat-overview.svg + stat-langs.svg');
