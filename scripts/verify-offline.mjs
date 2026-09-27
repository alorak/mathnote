import { readdir, readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const required = [
  'index.html',
  'app.js',
  'app.css',
  'manifest.webmanifest',
  'sw.js',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

for (const name of required) {
  await readFile(new URL(name, root));
}

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt']);
const violations = [];
let fontCount = 0;

async function walk(dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) {
      await walk(child);
      continue;
    }

    const ext = extname(entry.name).toLowerCase();
    if (['.woff2', '.woff', '.ttf'].includes(ext)) fontCount++;
    if (!textExtensions.has(ext)) continue;

    const content = await readFile(child, 'utf8');
    const checks = [
      [/(?:src|href)\s*=\s*["']https?:\/\//i, 'remote src/href'],
      [/@import\s+(?:url\()?\s*["']?https?:\/\//i, 'remote CSS import'],
      [/url\(\s*["']?https?:\/\//i, 'remote CSS url'],
      [/\b(?:fetch|importScripts)\s*\(\s*["'`]https?:\/\//i, 'remote runtime request'],
      [/new\s+(?:WebSocket|EventSource)\s*\(\s*["'`]https?:\/\//i, 'remote live connection'],
      [/\bfrom\s*["']https?:\/\//i, 'remote module import']
    ];

    for (const [pattern, label] of checks) {
      if (pattern.test(content)) violations.push(`${entry.name}: ${label}`);
    }
  }
}

await walk(root);

const html = await readFile(new URL('index.html', root), 'utf8');
for (const forbidden of ['cdn.jsdelivr.net', 'esm.sh', 'type="module"', 'type="importmap"']) {
  if (html.includes(forbidden)) violations.push(`index.html: contains ${forbidden}`);
}

if (!html.includes('rel="manifest" href="./manifest.webmanifest"')) {
  violations.push('index.html: manifest link missing or not relative');
}

const app = await readFile(new URL('app.js', root), 'utf8');
if (!app.includes("register('./sw.js'") && !app.includes('register("./sw.js"')) {
  violations.push('app.js: relative service worker registration missing');
}

const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
if (manifest.start_url !== './') violations.push('manifest: start_url must be ./');
if (manifest.scope !== './') violations.push('manifest: scope must be ./');
if (manifest.display !== 'standalone') violations.push('manifest: display must be standalone');

const iconSizes = new Set((manifest.icons || []).map(icon => icon.sizes));
if (!iconSizes.has('192x192')) violations.push('manifest: 192x192 icon missing');
if (!iconSizes.has('512x512')) violations.push('manifest: 512x512 icon missing');

const sw = await readFile(new URL('sw.js', root), 'utf8');
if (sw.includes('__CACHE_NAME__') || sw.includes('__PRECACHE_ASSETS__')) {
  violations.push('sw.js: build placeholders were not replaced');
}
if (!/mathnote-[a-f0-9]{12}/.test(sw)) {
  violations.push('sw.js: content-derived cache version missing');
}
for (const asset of ['./index.html', './app.js', './app.css', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']) {
  if (!sw.includes(asset)) violations.push(`sw.js: precache entry missing for ${asset}`);
}

if (fontCount === 0) {
  violations.push('KaTeX fonts were not emitted into dist/.');
}

if (violations.length) {
  console.error('Offline/PWA verification failed:');
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Offline/PWA verification passed. ${fontCount} local font asset(s), install manifest and versioned service worker verified.`);
