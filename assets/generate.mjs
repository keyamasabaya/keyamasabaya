// Neumorphic SVG asset generator for the w3spi5 GitHub profile.
// Produces fully self-contained SVGs (no external refs) so GitHub renders them
// inside the <img> sandbox. Run:  node assets/generate.mjs
//   (requires: npm i simple-icons)
import * as si from 'simple-icons';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

// ---- design tokens -------------------------------------------------------
const BG      = '#0d1117';   // matches GitHub dark canvas → real neumorphism
const CYAN    = '#00e5ff';
const PURPLE  = '#bd00ff';
const TEXT    = '#c9d1d9';
const MUTED   = '#6e7a8a';
const SH_DARK = '#04060a';   // bottom-right shadow
const SH_LITE = '#171f2b';   // top-left highlight
const FONT    = "'JetBrains Mono','Fira Code','SFMono-Regular',ui-monospace,'Courier New',monospace";
const CHARW   = 0.6;         // monospace advance ratio

const acc = (i) => (i % 2 === 0 ? CYAN : PURPLE);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// dual-shadow "raised" neumorphic filter
function neuFilter(id, blur = 5, off = 4) {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
  <feDropShadow in="SourceGraphic" dx="${off}" dy="${off}" stdDeviation="${blur}" flood-color="${SH_DARK}" flood-opacity="0.95" result="d"/>
  <feDropShadow in="SourceGraphic" dx="-${off}" dy="-${off}" stdDeviation="${blur}" flood-color="${SH_LITE}" flood-opacity="0.9" result="l"/>
  <feMerge><feMergeNode in="d"/><feMergeNode in="l"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;
}

// fallback glyph (hexagon target) for brands missing from simple-icons
const FALLBACK = 'M12 1.6l9 5.2v10.4l-9 5.2-9-5.2V6.8zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 2.4a2.1 2.1 0 110 4.2 2.1 2.1 0 010-4.2z';
function iconPath(slug) {
  const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
  return si[key]?.path ?? FALLBACK;
}
// icon rendered at (x,y), size px, tinted `color`
function icon(slug, x, y, size, color) {
  const s = size / 24;
  return `<g transform="translate(${x},${y}) scale(${s.toFixed(4)})"><path d="${iconPath(slug)}" fill="${color}"/></g>`;
}

// ---- pill --------------------------------------------------------------
const P_H = 44, P_ICON = 19, P_PADL = 17, P_GAP = 11, P_PADR = 19, P_FS = 15;
function pillWidth(label) {
  return Math.round(P_PADL + P_ICON + P_GAP + label.length * P_FS * CHARW + P_PADR);
}
function pill(x, y, label, slug, color) {
  const w = pillWidth(label);
  const tx = x + P_PADL + P_ICON + P_GAP;
  const textW = Math.round(label.length * P_FS * CHARW);
  return `<g filter="url(#neu)">
    <rect x="${x}" y="${y}" width="${w}" height="${P_H}" rx="14" fill="${BG}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${P_H}" rx="14" fill="none" stroke="${color}" stroke-opacity="0.14"/>
  </g>
  ${icon(slug, x + P_PADL, y + (P_H - P_ICON) / 2, P_ICON, color)}
  <text x="${tx}" y="${y + P_H / 2}" font-family="${FONT}" font-size="${P_FS}" font-weight="500" fill="${TEXT}" dominant-baseline="central" textLength="${textW}" lengthAdjust="spacingAndGlyphs">${esc(label)}</text>`;
}

// ---- skill card --------------------------------------------------------
const CARD_W = 860, PAD = 26, INNER = CARD_W - PAD * 2, ROW_GAP = 15, PILL_GAP = 14;
function skillCard(name, title, items) {
  // layout pills into rows
  const rows = [[]]; let rw = 0;
  for (const it of items) {
    const w = pillWidth(it.label);
    if (rw + w > INNER && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push({ ...it, w });
    rw += w + PILL_GAP;
  }
  const titleH = 34;
  const bodyTop = PAD + titleH + 14;
  const cardH = bodyTop + rows.length * (P_H + ROW_GAP) - ROW_GAP + PAD;
  const H = cardH + 16;
  let pills = '', yy = bodyTop;
  let gi = 0;
  for (const row of rows) {
    let xx = PAD;
    for (const it of row) { pills += pill(xx, yy, it.label, it.slug, acc(gi++)); xx += it.w + PILL_GAP; }
    yy += P_H + ROW_GAP;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${H}" viewBox="0 0 ${CARD_W} ${H}" role="img" aria-label="${esc(title)}">
<defs>${neuFilter('neu')}${neuFilter('card', 9, 7)}</defs>
<g filter="url(#card)">
  <rect x="8" y="8" width="${CARD_W - 16}" height="${cardH}" rx="24" fill="${BG}"/>
  <rect x="8" y="8" width="${CARD_W - 16}" height="${cardH}" rx="24" fill="none" stroke="#1b2432" stroke-opacity="0.7"/>
</g>
<circle cx="${PAD + 6}" cy="${PAD + 18}" r="5" fill="${CYAN}"/>
<text x="${PAD + 22}" y="${PAD + 18}" font-family="${FONT}" font-size="17" font-weight="700" fill="${TEXT}" dominant-baseline="central"><tspan fill="${MUTED}">// </tspan>${esc(title)}</text>
${pills}
</svg>`;
  writeFileSync(join(OUT, `stack-${name}.svg`), svg);
}

// ---- section header ----------------------------------------------------
function header(name, command) {
  const W = 860, H = 62;
  const prompt = 'w3spi5@wespify';
  const px = 118;
  const promptW = Math.round(prompt.length * 15 * CHARW);
  const sepX = px + promptW + 6;
  const cmdX = sepX + Math.round(4 * 15 * CHARW); // after ":~$ "
  const cmdW = Math.round(command.length * 15 * CHARW);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(command)}">
<defs>${neuFilter('h', 8, 6)}</defs>
<g filter="url(#h)">
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="16" fill="${BG}"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="16" fill="none" stroke="#1b2432" stroke-opacity="0.8"/>
</g>
<circle cx="34" cy="${H / 2}" r="5.5" fill="${PURPLE}"/>
<circle cx="54" cy="${H / 2}" r="5.5" fill="${CYAN}"/>
<circle cx="74" cy="${H / 2}" r="5.5" fill="#2b3644"/>
<text x="${px}" y="${H / 2}" font-family="${FONT}" font-size="15" font-weight="600" fill="${MUTED}" dominant-baseline="central" textLength="${promptW}" lengthAdjust="spacingAndGlyphs">${prompt}</text>
<text x="${sepX}" y="${H / 2}" font-family="${FONT}" font-size="15" font-weight="700" fill="${CYAN}" dominant-baseline="central">:~$</text>
<text x="${cmdX}" y="${H / 2}" font-family="${FONT}" font-size="15" font-weight="600" fill="${TEXT}" dominant-baseline="central" textLength="${cmdW}" lengthAdjust="spacingAndGlyphs">${esc(command)}</text>
<rect x="${cmdX + cmdW + 14}" y="${H / 2 - 9}" width="10" height="18" rx="2" fill="${CYAN}" opacity="0.85"/>
</svg>`;
  writeFileSync(join(OUT, `header-${name}.svg`), svg);
}

// ---- generic log / note card ------------------------------------------
// lines: [{tag, tagColor, text}]
function logCard(name, lines, { W = 860 } = {}) {
  const lh = 30, top = 26, H = top * 2 + lines.length * lh;
  let body = '';
  lines.forEach((ln, i) => {
    const y = top + i * lh + lh / 2;
    let x = PAD;
    if (ln.tag) {
      const tw = Math.round(ln.tag.length * 14 * CHARW);
      body += `<text x="${x}" y="${y}" font-family="${FONT}" font-size="14" font-weight="700" fill="${ln.tagColor || CYAN}" dominant-baseline="central" textLength="${tw}" lengthAdjust="spacingAndGlyphs">${esc(ln.tag)}</text>`;
      x += tw + 18;
    }
    const txt = ln.text || '';
    body += `<text x="${x}" y="${y}" font-family="${FONT}" font-size="14" fill="${ln.textColor || TEXT}" dominant-baseline="central">${esc(txt)}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)}">
<defs>${neuFilter('c', 9, 7)}</defs>
<g filter="url(#c)">
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="20" fill="${BG}"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="20" fill="none" stroke="#1b2432" stroke-opacity="0.7"/>
</g>
${body}
</svg>`;
  writeFileSync(join(OUT, `${name}.svg`), svg);
}

// ---- pill button (Follow / Sponsor) -----------------------------------
function button(name, label, slug, color) {
  const H = 58, FS = 16;
  const iconSz = 20, padL = 26, gap = 12, padR = 28;
  const textW = Math.round(label.length * FS * CHARW);
  const W = padL + iconSz + gap + textW + padR;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<defs>${neuFilter('b', 6, 5)}</defs>
<g filter="url(#b)">
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="16" fill="${BG}"/>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="16" fill="none" stroke="${color}" stroke-opacity="0.35"/>
</g>
${icon(slug, padL, (H - iconSz) / 2, iconSz, color)}
<text x="${padL + iconSz + gap}" y="${H / 2}" font-family="${FONT}" font-size="${FS}" font-weight="700" fill="${TEXT}" dominant-baseline="central" textLength="${textW}" lengthAdjust="spacingAndGlyphs">${esc(label)}</text>
</svg>`;
  writeFileSync(join(OUT, `btn-${name}.svg`), svg);
}

// ---- tagline strip -----------------------------------------------------
function tagline(name, words) {
  const H = 56, FS = 16, gap = 26;
  let parts = words.map((w, i) => ({ w, c: acc(i) }));
  // measure
  let total = 0;
  const widths = parts.map(p => Math.round(p.w.length * FS * CHARW));
  total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1) + widths.length /*dots space*/ * 22;
  const W = Math.max(560, total + 80);
  let x = (W - (total)) / 2, body = '';
  parts.forEach((p, i) => {
    body += `<text x="${x}" y="${H / 2}" font-family="${FONT}" font-size="${FS}" font-weight="700" fill="${p.c}" dominant-baseline="central" textLength="${widths[i]}" lengthAdjust="spacingAndGlyphs">${esc(p.w)}</text>`;
    x += widths[i];
    if (i < parts.length - 1) { x += gap / 2; body += `<circle cx="${x}" cy="${H / 2}" r="2.6" fill="${MUTED}"/>`; x += gap / 2 + 22; }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(words.join(' '))}">
<defs>${neuFilter('t', 7, 5)}</defs>
<g filter="url(#t)"><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="16" fill="${BG}"/><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="16" fill="none" stroke="#1b2432" stroke-opacity="0.8"/></g>
${body}
</svg>`;
  writeFileSync(join(OUT, `${name}.svg`), svg);
}

// ========================================================================
// content
// ========================================================================
header('whoami',  'whoami --verbose');
header('stack',   'cat stack.conf');
header('projects','ls ~/projects/featured');
header('hacking', 'nmap -sV ./ethical-hacking');
header('focus',   'tail -f focus.log');
header('stats',   'git log --stat --all');
header('gpg',     'gpg --list-keys');

skillCard('languages', 'languages', [
  { label: 'PHP', slug: 'php' }, { label: 'JavaScript', slug: 'javascript' },
  { label: 'Python', slug: 'python' }, { label: 'Solidity', slug: 'solidity' },
  { label: 'Bash', slug: 'gnubash' },
]);
skillCard('frameworks', 'frameworks & runtimes', [
  { label: 'Laravel', slug: 'laravel' }, { label: 'Symfony', slug: 'symfony' },
  { label: 'Node.js', slug: 'nodedotjs' }, { label: 'React', slug: 'react' },
  { label: 'Vue.js', slug: 'vuedotjs' }, { label: 'TensorFlow.js', slug: 'tensorflow' },
]);
skillCard('chain', 'chain · cloud · ops', [
  { label: 'Ethereum', slug: 'ethereum' }, { label: 'BNB Chain', slug: 'binance' },
  { label: 'Web3.js', slug: 'web3dotjs' }, { label: 'Docker', slug: 'docker' },
  { label: 'Linux', slug: 'linux' }, { label: 'Kali', slug: 'kalilinux' },
]);
skillCard('offsec', 'offsec toolkit', [
  { label: 'Burp Suite', slug: 'burpsuite' }, { label: 'Wireshark', slug: 'wireshark' },
  { label: 'Nmap', slug: 'nmap' }, { label: 'Metasploit', slug: 'metasploit' },
  { label: 'Ghidra', slug: 'ghidra' },
]);
skillCard('platforms', 'platforms — challenges & training', [
  { label: 'Hack The Box', slug: 'hackthebox' }, { label: 'TryHackMe', slug: 'tryhackme' },
  { label: 'Root-Me', slug: 'rootme' },
]);
skillCard('bugbounty', 'bug bounty programs', [
  { label: 'HackerOne', slug: 'hackerone' }, { label: 'YesWeHack', slug: 'yeswehack' },
  { label: 'Intigriti', slug: 'intigriti' },
]);

tagline('tagline', ['build', 'break', 'learn', 'share', 'repeat']);

logCard('scope', [
  { tag: '[FOCUS]', tagColor: CYAN,   text: 'web application security · api abuse · smart-contract auditing' },
  { tag: '[SCOPE]', tagColor: PURPLE, text: 'responsible disclosure only — coordinated, scoped, ethical' },
  { tag: '[RULE ]', tagColor: MUTED,  text: 'no scope-creep · no PII exfil · no public PoCs before patch' },
]);

logCard('focuslog', [
  { tag: '[INFO ]', tagColor: CYAN,   text: 'building decentralized applications' },
  { tag: '[INFO ]', tagColor: CYAN,   text: 'designing & integrating APIs' },
  { tag: '[TASK ]', tagColor: PURPLE, text: 'hunting bugs — responsibly' },
  { tag: '[INFO ]', tagColor: CYAN,   text: 'contributing to open source' },
  { tag: '[DEBUG]', tagColor: PURPLE, text: 'exploring AI / ML' },
  { tag: '[INFO ]', tagColor: CYAN,   text: 'crafting high-performance solutions' },
  { tag: '[WARN ]', tagColor: '#d9a441', text: 'coffee level critical... refilling', textColor: MUTED },
]);

// disclosure policy — visible neumorphic card
(function disclosure() {
  const items = [
    'Reports written in English or French, per the program policy.',
    'Encrypted communication available via PGP.',
    'No exploitation beyond the minimum required for proof of concept.',
    'Strict adherence to scope, rules of engagement & disclosure timelines.',
    'No public disclosure until the fix is deployed & coordinated with the vendor.',
  ];
  const W = 860, top = 62, lh = 34, H = top + items.length * lh + 24;
  let body = `<circle cx="${PAD + 6}" cy="34" r="5" fill="${PURPLE}"/>
<text x="${PAD + 22}" y="34" font-family="${FONT}" font-size="17" font-weight="700" fill="${TEXT}" dominant-baseline="central"><tspan fill="${MUTED}">// </tspan>disclosure policy — how I report</text>`;
  items.forEach((t, i) => {
    const y = top + i * lh + lh / 2;
    body += `<g transform="translate(${PAD},${y - 6})"><path d="M2 6l3.4 3.4L11 2" fill="none" stroke="${i % 2 ? PURPLE : CYAN}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    body += `<text x="${PAD + 26}" y="${y}" font-family="${FONT}" font-size="14.5" fill="${TEXT}" dominant-baseline="central">${esc(t)}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="disclosure policy">
<defs>${neuFilter('c', 9, 7)}</defs>
<g filter="url(#c)"><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="22" fill="${BG}"/><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="22" fill="none" stroke="#1b2432" stroke-opacity="0.7"/></g>
${body}
</svg>`;
  writeFileSync(join(OUT, 'disclosure.svg'), svg);
})();

button('follow',  'Follow  @w3spi5', 'github', CYAN);
button('sponsor', 'Say hi',          'githubsponsors', PURPLE);

console.log('generated assets in', OUT);
