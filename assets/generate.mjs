// Theme-agnostic SVG asset generator for the w3spi5 GitHub profile.
// No baked background plates — every asset is transparent so it blends into
// ANY GitHub theme (dark, dark-dimmed, high-contrast). Shapes are defined by
// thin accent borders + soft neon glows. Run:  node assets/generate.mjs
//   (requires: npm i simple-icons)
import * as si from 'simple-icons';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

// ---- design tokens -------------------------------------------------------
const CYAN   = '#00e5ff';
const PURPLE = '#bd00ff';
const TEXT   = '#c9d1d9';
const MUTED  = '#8b98a9';
const BORDER = '#3a4658';     // neutral hairline visible on any dark theme
const FONT   = "'JetBrains Mono','Fira Code','SFMono-Regular',ui-monospace,'Courier New',monospace";
const CHARW  = 0.6;

const acc = (i) => (i % 2 === 0 ? CYAN : PURPLE);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// soft neon glow — colored so it reads on any canvas, no neutral plate needed
function glow(id, color, { op = 0.35, blur = 5, dy = 2 } = {}) {
  return `<filter id="${id}" x="-40%" y="-60%" width="180%" height="220%" color-interpolation-filters="sRGB">
  <feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${op}"/>
</filter>`;
}

// fallback glyph (hexagon target) for brands missing from simple-icons
const FALLBACK = 'M12 1.6l9 5.2v10.4l-9 5.2-9-5.2V6.8zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 2.4a2.1 2.1 0 110 4.2 2.1 2.1 0 010-4.2z';
const iconPath = (slug) => si['si' + slug.charAt(0).toUpperCase() + slug.slice(1)]?.path ?? FALLBACK;
function icon(slug, x, y, size, color) {
  const s = (size / 24).toFixed(4);
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="${iconPath(slug)}" fill="${color}"/></g>`;
}

// ---- pill (outlined chip, transparent interior) ------------------------
const P_H = 42, P_ICON = 18, P_PADL = 16, P_GAP = 10, P_PADR = 18, P_FS = 14.5;
const pillWidth = (l) => Math.round(P_PADL + P_ICON + P_GAP + l.length * P_FS * CHARW + P_PADR);
function pill(x, y, label, slug, color, gid) {
  const w = pillWidth(label);
  const tx = x + P_PADL + P_ICON + P_GAP;
  const tw = Math.round(label.length * P_FS * CHARW);
  return `<rect x="${x}" y="${y}" width="${w}" height="${P_H}" rx="13" fill="none" stroke="${color}" stroke-opacity="0.55" stroke-width="1.2" filter="url(#${gid})"/>
  ${icon(slug, x + P_PADL, y + (P_H - P_ICON) / 2, P_ICON, color)}
  <text x="${tx}" y="${y + P_H / 2}" font-family="${FONT}" font-size="${P_FS}" font-weight="500" fill="${TEXT}" dominant-baseline="central" textLength="${tw}" lengthAdjust="spacingAndGlyphs">${esc(label)}</text>`;
}

// ---- skill section (NO enclosing plate — airy) -------------------------
const W = 860, PAD = 20, INNER = W - PAD * 2, ROW_GAP = 14, PILL_GAP = 12;
function skillCard(name, title, items) {
  const rows = [[]]; let rw = 0;
  for (const it of items) {
    const w = pillWidth(it.label);
    if (rw + w > INNER && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push({ ...it, w });
    rw += w + PILL_GAP;
  }
  const titleH = 30, bodyTop = titleH + 16;
  const H = bodyTop + rows.length * (P_H + ROW_GAP) - ROW_GAP + 12;
  let pills = '', yy = bodyTop, gi = 0;
  for (const row of rows) {
    let xx = PAD;
    for (const it of row) { pills += pill(xx, yy, it.label, it.slug, acc(gi), `g${gi % 2}`); xx += it.w + PILL_GAP; gi++; }
    yy += P_H + ROW_GAP;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
<defs>${glow('g0', CYAN)}${glow('g1', PURPLE)}</defs>
<circle cx="${PAD + 5}" cy="15" r="4.5" fill="${CYAN}"/>
<text x="${PAD + 20}" y="15" font-family="${FONT}" font-size="16" font-weight="700" fill="${TEXT}" dominant-baseline="central"><tspan fill="${MUTED}">// </tspan>${esc(title)}</text>
${pills}
</svg>`;
  writeFileSync(join(OUT, `stack-${name}.svg`), svg);
}

// ---- section header (transparent bar) ----------------------------------
function header(name, command) {
  const H = 54;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(command)}">
<defs>${glow('h', CYAN, { op: 0.16, blur: 8, dy: 0 })}</defs>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="14" fill="none" stroke="${BORDER}" stroke-opacity="0.9" stroke-width="1" filter="url(#h)"/>
<circle cx="30" cy="${H / 2}" r="5" fill="${PURPLE}"/>
<circle cx="48" cy="${H / 2}" r="5" fill="${CYAN}"/>
<circle cx="66" cy="${H / 2}" r="5" fill="#3a4658"/>
<text x="112" y="${H / 2}" font-family="${FONT}" font-size="14.5" dominant-baseline="central" xml:space="preserve"><tspan fill="${MUTED}" font-weight="600">w3spi5@wespify</tspan><tspan fill="${CYAN}" font-weight="700"> :~$ </tspan><tspan fill="${TEXT}" font-weight="600">${esc(command)}</tspan><tspan fill="${CYAN}" font-weight="700"> ▍</tspan></text>
</svg>`;
  writeFileSync(join(OUT, `header-${name}.svg`), svg);
}

// ---- transparent text panel (scope / focuslog / disclosure / whoami) ---
function panel(name, { title, lines, accent = CYAN, lh = 30, rich = false }) {
  const top = title ? 56 : 26;
  const H = top + lines.length * lh + (title ? 20 : 22);
  let body = '';
  if (title) {
    body += `<circle cx="${PAD + 5}" cy="30" r="4.5" fill="${accent}"/>
<text x="${PAD + 20}" y="30" font-family="${FONT}" font-size="16" font-weight="700" fill="${TEXT}" dominant-baseline="central"><tspan fill="${MUTED}">// </tspan>${esc(title)}</text>`;
  }
  lines.forEach((ln, i) => {
    const y = top + i * lh + lh / 2;
    let x = PAD;
    if (ln.check !== undefined) {
      body += `<g transform="translate(${PAD},${y - 7})"><path d="M2 7l3.6 3.6L12 2" fill="none" stroke="${ln.check}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      x += 26;
    } else if (ln.tag) {
      const tw = Math.round(ln.tag.length * 13.5 * CHARW);
      body += `<text x="${x}" y="${y}" font-family="${FONT}" font-size="13.5" font-weight="700" fill="${ln.tagColor || CYAN}" dominant-baseline="central" textLength="${tw}" lengthAdjust="spacingAndGlyphs">${esc(ln.tag)}</text>`;
      x += tw + 18;
    }
    if (rich && Array.isArray(ln.text)) {
      // ln.text = array of {t, c?, b?} — flow as tspans so spacing never drifts
      const spans = ln.text.map((seg) => `<tspan fill="${seg.c || TEXT}" font-weight="${seg.b ? 700 : 400}">${esc(seg.t)}</tspan>`).join('');
      body += `<text x="${x}" y="${y}" font-family="${FONT}" font-size="14.5" dominant-baseline="central" xml:space="preserve">${spans}</text>`;
    } else {
      body += `<text x="${x}" y="${y}" font-family="${FONT}" font-size="14" fill="${ln.textColor || TEXT}" dominant-baseline="central">${esc(ln.text)}</text>`;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)}">
<defs>${glow('p', accent, { op: 0.12, blur: 10, dy: 0 })}</defs>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="18" fill="none" stroke="${BORDER}" stroke-opacity="0.85" stroke-width="1" filter="url(#p)"/>
${body}
</svg>`;
  writeFileSync(join(OUT, `${name}.svg`), svg);
}

// ---- pill button -------------------------------------------------------
function button(name, label, slug, color) {
  const H = 52, FS = 15, iconSz = 19, padL = 22, gap = 11, padR = 24;
  const tw = Math.round(label.length * FS * CHARW);
  const w = padL + iconSz + gap + tw + padR;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" role="img" aria-label="${esc(label)}">
<defs>${glow('b', color, { op: 0.4, blur: 6, dy: 2 })}</defs>
<rect x="5" y="5" width="${w - 10}" height="${H - 10}" rx="14" fill="none" stroke="${color}" stroke-opacity="0.6" stroke-width="1.3" filter="url(#b)"/>
${icon(slug, padL, (H - iconSz) / 2, iconSz, color)}
<text x="${padL + iconSz + gap}" y="${H / 2}" font-family="${FONT}" font-size="${FS}" font-weight="700" fill="${TEXT}" dominant-baseline="central" textLength="${tw}" lengthAdjust="spacingAndGlyphs">${esc(label)}</text>
</svg>`;
  writeFileSync(join(OUT, `btn-${name}.svg`), svg);
}

// ---- tagline -----------------------------------------------------------
function tagline(name, words) {
  const H = 50, FS = 15, gap = 30;
  const widths = words.map((w) => Math.round(w.length * FS * CHARW));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  const Wt = Math.max(520, total + 80);
  let x = (Wt - total) / 2, body = '';
  words.forEach((w, i) => {
    body += `<text x="${x}" y="${H / 2}" font-family="${FONT}" font-size="${FS}" font-weight="700" fill="${acc(i)}" dominant-baseline="central" textLength="${widths[i]}" lengthAdjust="spacingAndGlyphs">${esc(w)}</text>`;
    x += widths[i];
    if (i < words.length - 1) { body += `<circle cx="${x + gap / 2}" cy="${H / 2}" r="2.4" fill="${MUTED}"/>`; x += gap; }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wt}" height="${H}" viewBox="0 0 ${Wt} ${H}" role="img" aria-label="${esc(words.join(' '))}">
<defs>${glow('t', CYAN, { op: 0.14, blur: 9, dy: 0 })}</defs>
<rect x="5" y="5" width="${Wt - 10}" height="${H - 10}" rx="14" fill="none" stroke="${BORDER}" stroke-opacity="0.8" stroke-width="1" filter="url(#t)"/>
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

// whoami — the intro prose, now in the same design language
panel('whoami', {
  accent: CYAN, lh: 30,
  rich: true,
  lines: [
    { text: [ { t: 'Full-stack developer', c: CYAN, b: true }, { t: ' based in ' }, { t: 'France', c: PURPLE, b: true }, { t: ' — building robust apps at the' } ] },
    { text: [ { t: 'intersection of ' }, { t: 'Web', c: CYAN, b: true }, { t: ', ' }, { t: 'Blockchain', c: PURPLE, b: true }, { t: ' and ' }, { t: 'AI', c: CYAN, b: true }, { t: '.' } ] },
    { text: [ { t: 'Flip side of the stack: ' }, { t: 'ethical hacker', c: PURPLE, b: true }, { t: ' on challenge platforms' } ] },
    { text: [ { t: 'and ' }, { t: 'bug bounty', c: CYAN, b: true }, { t: ' programs. Break cleanly to build stronger.' } ] },
  ],
});

panel('scope', {
  accent: PURPLE, lh: 30,
  lines: [
    { tag: '[FOCUS]', tagColor: CYAN,   text: 'web app security · api abuse · smart-contract auditing' },
    { tag: '[SCOPE]', tagColor: PURPLE, text: 'responsible disclosure only — coordinated, scoped, ethical' },
    { tag: '[RULE ]', tagColor: MUTED,  text: 'no scope-creep · no PII exfil · no public PoCs before patch' },
  ],
});

panel('focuslog', {
  accent: CYAN, lh: 30,
  lines: [
    { tag: '[INFO ]', tagColor: CYAN,   text: 'building decentralized applications' },
    { tag: '[INFO ]', tagColor: CYAN,   text: 'designing & integrating APIs' },
    { tag: '[TASK ]', tagColor: PURPLE, text: 'hunting bugs — responsibly' },
    { tag: '[INFO ]', tagColor: CYAN,   text: 'contributing to open source' },
    { tag: '[DEBUG]', tagColor: PURPLE, text: 'exploring AI / ML' },
    { tag: '[INFO ]', tagColor: CYAN,   text: 'crafting high-performance solutions' },
    { tag: '[WARN ]', tagColor: '#d9a441', text: 'coffee level critical... refilling', textColor: MUTED },
  ],
});

panel('disclosure', {
  title: 'disclosure policy — how I report', accent: PURPLE, lh: 33,
  lines: [
    { check: CYAN,   text: 'Reports written in English or French, per the program policy.' },
    { check: PURPLE, text: 'Encrypted communication available via PGP.' },
    { check: CYAN,   text: 'No exploitation beyond the minimum required for proof of concept.' },
    { check: PURPLE, text: 'Strict adherence to scope, rules of engagement & disclosure timelines.' },
    { check: CYAN,   text: 'No public disclosure until the fix is deployed & coordinated.' },
  ],
});

button('follow',  'Follow  @w3spi5', 'github', CYAN);
button('sponsor', 'Say hi',          'githubsponsors', PURPLE);

// PGP toggle — clean pill used as the <details> summary
(function pgpToggle() {
  const H = 46, FS = 14.5, label = 'Public PGP key', padL = 44, tw = Math.round(label.length * FS * CHARW);
  const w = padL + tw + 150;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" role="img" aria-label="Public PGP key">
<defs>${glow('k', PURPLE, { op: 0.32, blur: 6, dy: 2 })}</defs>
<rect x="5" y="5" width="${w - 10}" height="${H - 10}" rx="13" fill="none" stroke="${PURPLE}" stroke-opacity="0.5" stroke-width="1.2" filter="url(#k)"/>
${icon('gnuprivacyguard', 16, (H - 18) / 2, 18, PURPLE)}
<text x="${padL}" y="${H / 2}" font-family="${FONT}" font-size="${FS}" font-weight="700" fill="${TEXT}" dominant-baseline="central" textLength="${tw}" lengthAdjust="spacingAndGlyphs">${label}</text>
<text x="${padL + tw + 16}" y="${H / 2}" font-family="${FONT}" font-size="12.5" fill="${MUTED}" dominant-baseline="central">— click to expand</text>
</svg>`;
  writeFileSync(join(OUT, 'pgp-toggle.svg'), svg);
})();

console.log('generated design assets in', OUT);
