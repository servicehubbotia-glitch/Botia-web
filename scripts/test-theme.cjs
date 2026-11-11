// Run with: node scripts/test-theme.cjs (no dependencies).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(base, 'botia/assets/js/theme.js'), 'utf8');
const home = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const bootstrap = home.match(/<script>\s*(\(function \(\) \{[\s\S]*?)<\/script>/)[1];

function environment({ stored = null, dark = false, blocked = false, lang = 'en' } = {}) {
  const events = {};
  const nodes = [];
  let observeLanguage;
  const element = () => ({
    dataset: {}, style: {}, attrs: {}, children: [], classList: { add() {} },
    setAttribute(k, v) { this.attrs[k] = v; },
    append(...items) { this.children.push(...items); },
    addEventListener(k, fn) { this[k] = fn; },
    before() {}
  });
  const root = element(); root.lang = lang;
  const header = element();
  const language = element();
  const select = { closest: () => language };
  const media = { matches: dark, addEventListener: (_, fn) => { events.system = fn; } };
  const document = {
    documentElement: root, readyState: 'complete', body: { prepend() {} },
    createElement: () => { const n = element(); nodes.push(n); return n; },
    getElementById: id => id === 'lang-select' ? select : null,
    querySelector: selector => selector === '.botia-theme-toggle' ? null : header
  };
  const context = vm.createContext({
    document,
    window: { matchMedia: () => media, addEventListener: (k, fn) => { events[k] = fn; } },
    localStorage: {
      getItem: () => { if (blocked) throw Error('Storage blocked'); return stored; },
      setItem: (_, value) => { if (blocked) throw Error('Storage blocked'); stored = value; }
    },
    getComputedStyle: () => ({ position: 'static' }),
    MutationObserver: class { constructor(fn) { observeLanguage = fn; } observe() {} }
  });
  vm.runInContext(bootstrap, context);
  const initial = root.dataset.theme;
  vm.runInContext(source, context);
  const button = nodes.find(n => n.className === 'botia-theme-toggle');
  return { root, button, initial, events, media, stored: () => stored,
    language: value => { root.lang = value; observeLanguage(); } };
}

for (const dark of [false, true]) {
  const e = environment({ dark });
  assert.equal(e.initial, dark ? 'dark' : 'light');
  assert.equal(e.root.dataset.theme, e.initial);
  e.media.matches = !dark; e.events.system();
  assert.equal(e.root.dataset.theme, dark ? 'light' : 'dark');
}
for (const stored of ['dark', 'light']) {
  const e = environment({ stored, dark: stored === 'light' });
  assert.equal(e.initial, stored);
  e.media.matches = !e.media.matches; e.events.system();
  assert.equal(e.root.dataset.theme, stored, 'System must not override a saved choice');
}
assert.equal(environment({ stored: 'corrupt', dark: true }).initial, 'dark');
const blocked = environment({ blocked: true, dark: true });
blocked.button.click();
assert.equal(blocked.root.dataset.theme, 'light');
blocked.events.system();
assert.equal(blocked.root.dataset.theme, 'light', 'Blocked storage must retain the current-session choice');
const chosen = environment();
chosen.button.click();
assert.equal(chosen.stored(), 'dark');
assert.equal(environment({ stored: chosen.stored() }).initial, 'dark', 'Choice survives a new page');
chosen.events.storage({ key: 'botia-theme', newValue: 'light' });
assert.equal(chosen.root.dataset.theme, 'light');
chosen.media.matches = true;
chosen.events.storage({ key: null, newValue: null });
assert.equal(chosen.root.dataset.theme, 'dark', 'Clearing storage resumes system preference');
for (const lang of ['en','es','ar','de','fr','nl','it','pt','pl','ro','ru','tr','zh','id']) {
  const e = environment({ lang });
  const label = e.button.attrs['aria-label'];
  assert.ok(label && (lang === 'en' || label !== 'Switch to dark mode'));
  assert.equal(e.button.type, 'button');
  assert.equal(e.button.children[0].attrs['aria-hidden'], 'true');
  assert.equal(e.button.children[0].textContent, '🌙');
  e.button.click();
  assert.notEqual(e.button.attrs['aria-label'], label);
  assert.equal(e.button.children[0].textContent, '☀️');
  e.language('es');
  assert.equal(e.button.attrs['aria-label'], 'Cambiar a modo claro');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.name === '.git' ? [] :
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
let pages = 0;
for (const file of walk(base).filter(f => f.endsWith('.html') && !/\/(google|naver|yandex_)/.test(f))) {
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(/src="\/botia\/assets\/js\/theme.js"/g) || []).length, 1, file);
  assert.equal((html.match(/href="\/botia\/assets\/theme.css"/g) || []).length, 1, file);
  const boot = html.match(/<script>\s*(\(function \(\) \{[\s\S]*?)<\/script>/);
  assert.equal(boot?.[1], bootstrap, file + ': bootstrap differs');
  assert.ok(boot.index < html.search(/<style|rel="stylesheet"|<body/i), file + ': bootstrap must precede paint');
  pages++;
}

// Test the shared AA text pairings and the stable layer colours, in both themes.
const css = fs.readFileSync(path.join(base, 'botia/assets/theme.css'), 'utf8');
const palette = block => Object.fromEntries([...block.matchAll(/--botia-([\w-]+):\s*(#[\da-f]{6})/g)].map(m => [m[1], m[2]]));
const light = palette(css.match(/:root\s*\{([^}]+)\}/)[1]);
const dark = { ...light, ...palette(css.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/)[1]) };
function luminance(hex) {
  const c = hex.slice(1).match(/../g).map(n => parseInt(n,16)/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function ratio(a,b) { const l = [luminance(a),luminance(b)].sort((x,y)=>y-x); return (l[0]+.05)/(l[1]+.05); }
let min = Infinity;
for (const [name, p] of Object.entries({ light, dark })) {
  for (const text of ['text','text-strong','text-soft','text-muted','text-subtle','accent','error','status-halal','status-haram','status-mashbooh']) {
    for (const bg of ['bg','bg-2','surface','surface-2']) {
      const r = ratio(p[text],p[bg]); min = Math.min(min,r);
      assert.ok(r >= 4.5, `${name} ${text}/${bg}: ${r.toFixed(2)}:1`);
    }
  }
  for (const layer of ['muslim','animal','woman','sugar','sweetener','texture','flavour','enumbers']) {
    assert.ok(ratio(p['on-layer'],p['layer-'+layer]) >= 4.5, layer);
  }
  assert.ok(ratio(p['on-accent'],p.accent) >= 4.5);
}
console.log(`PASS: ${pages} pages; 14 languages; system, saved, blocked and cross-tab preferences; AA palette minimum ${min.toFixed(2)}:1.`);
