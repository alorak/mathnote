import { readdir, readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const required = [
  'index.html',
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

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
let crcTable = null;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let k = 0; k < 8; k++) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    crcTable[n] = value >>> 0;
  }
  return crcTable;
}

function crc32(buffer) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function verifyPng(path, expectedWidth, expectedHeight) {
  const bytes = await readFile(new URL(path, root));
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('invalid PNG signature');
  }

  let offset = 8;
  let width = null;
  let height = null;
  let sawIend = false;

  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const crcOffset = dataStart + length;
    const nextOffset = crcOffset + 4;
    if (nextOffset > bytes.length) throw new Error('truncated PNG chunk');

    const type = bytes.toString('ascii', typeStart, typeStart + 4);
    const expectedCrc = bytes.readUInt32BE(crcOffset);
    const actualCrc = crc32(bytes.subarray(typeStart, crcOffset));
    if (actualCrc !== expectedCrc) throw new Error(`bad CRC in ${type} chunk`);

    if (type === 'IHDR') {
      width = bytes.readUInt32BE(dataStart);
      height = bytes.readUInt32BE(dataStart + 4);
    } else if (type === 'IEND') {
      sawIend = true;
      break;
    }

    offset = nextOffset;
  }

  if (!sawIend) throw new Error('missing IEND chunk');
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(`unexpected dimensions ${width}x${height}`);
  }
}

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

if (!html.includes('<meta name="mobile-web-app-capable" content="yes">')) {
  violations.push('index.html: mobile-web-app-capable meta tag missing');
}
if (!html.includes('<link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png">')) {
  violations.push('index.html: local PNG favicon missing');
}
if (html.includes('data:image/png;base64')) {
  violations.push('index.html: embedded base64 favicon must not be used');
}
if (!html.includes('id="examples-btn"')) {
  violations.push('index.html: examples button missing');
}

for (const id of [
  'search-btn', 'search-modal', 'notebook-search-input', 'tab-context-menu',
  'undo-toast', 'undo-close-btn', 'examples-modal', 'examples-grid',
  'history-btn', 'history-modal', 'history-list', 'save-status'
]) {
  if (!html.includes(`id="${id}"`)) violations.push(`index.html: ${id} missing`);
}
if (!html.includes("updateViaCache: 'none'")) {
  violations.push('index.html: service worker bootstrap must bypass HTTP cache');
}

const jsMatch = html.match(/<script defer src="(\.\/assets\/app-[A-Z0-9]+\.js)"><\/script>/i);
const cssMatch = html.match(/<link rel="stylesheet" href="(\.\/assets\/app-[A-Z0-9]+\.css)">/i);

if (!jsMatch) violations.push('index.html: hashed app JS reference missing');
if (!cssMatch) violations.push('index.html: hashed app CSS reference missing');

const rootEntries = await readdir(root);
if (rootEntries.includes('app.js') || rootEntries.includes('app.css')) {
  violations.push('dist/: fixed-name app.js/app.css must not be emitted');
}

let app = '';
let appJsPath = '';
let appCssPath = '';

if (jsMatch) {
  appJsPath = jsMatch[1];
  app = await readFile(new URL(appJsPath.slice(2), root), 'utf8');
}
if (cssMatch) {
  appCssPath = cssMatch[1];
  await readFile(new URL(appCssPath.slice(2), root), 'utf8');
}

const sourceApp = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
for (const symbol of [
  'renameNotebook',
  'duplicateNotebook',
  'reorderNotebooks',
  'undoCloseNotebook',
  'openNotebookSearch',
  'renderNotebookSearchResults',
  "event.key.toLowerCase() === 'k'",
  'getExampleTemplates',
  'renderExamplesGallery',
  'recordRevisionSnapshot',
  'scheduleRevisionSnapshot',
  'renderRevisionHistory',
  'restoreRevision',
  "HISTORY_LIMIT_PER_FILE = 20",
  "HISTORY_TOTAL_BYTES = 1_500_000",
  "setSaveState('saving')",
  "setSaveState('saved')"
]) {
  if (!sourceApp.includes(symbol)) violations.push(`src/app.js: notebook management/search symbol missing: ${symbol}`);
}

if (sourceApp.includes("serviceWorker.register") || sourceApp.includes(".register('./sw.js'")) {
  violations.push('src/app.js: service worker registration must stay independent from app boot');
}
if (!app.includes('examples-btn') || !app.includes('getDefaultContent')) {
  violations.push('app bundle: examples loader wiring missing');
}

for (const id of ['examples-btn', 'backup-btn', 'backup-close', 'backup-modal', 'backup-export-btn', 'backup-import-btn', 'backup-file-input']) {
  const unsafe = `getElementById('${id}').addEventListener`;
  if (sourceApp.includes(unsafe)) {
    violations.push(`src/app.js: optional UI binding for ${id} is not null-safe`);
  }
}

const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
if (manifest.start_url !== './') violations.push('manifest: start_url must be ./');
if (manifest.scope !== './') violations.push('manifest: scope must be ./');
if (manifest.display !== 'standalone') violations.push('manifest: display must be standalone');

const iconSizes = new Set((manifest.icons || []).map(icon => icon.sizes));
if (!iconSizes.has('192x192')) violations.push('manifest: 192x192 icon missing');
if (!iconSizes.has('512x512')) violations.push('manifest: 512x512 icon missing');

for (const [path, width, height] of [
  ['icons/icon-192.png', 192, 192],
  ['icons/icon-512.png', 512, 512]
]) {
  try {
    await verifyPng(path, width, height);
  } catch (error) {
    violations.push(`${path}: ${error.message}`);
  }
}

const sw = await readFile(new URL('sw.js', root), 'utf8');
if (sw.includes('__CACHE_NAME__') || sw.includes('__PRECACHE_ASSETS__')) {
  violations.push('sw.js: build placeholders were not replaced');
}
if (!/mathnote-[a-f0-9]{12}/.test(sw)) {
  violations.push('sw.js: content-derived cache version missing');
}
if (!sw.includes('NETWORK_FIRST_PATHS') || !sw.includes('networkFirst(request')) {
  violations.push('sw.js: navigation/manifest network-first strategy missing');
}
if (sw.includes('skipWaiting()') || sw.includes('clients.claim()')) {
  violations.push('sw.js: eager service-worker takeover can mix HTML and JS versions');
}
if (!sw.includes("cache: 'no-store'")) {
  violations.push('sw.js: network-first fetches should bypass the HTTP cache');
}
if (sw.includes('caches.match(')) {
  violations.push('sw.js: cross-cache lookup can serve stale assets');
}

for (const asset of ['./index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', appJsPath, appCssPath]) {
  if (asset && !sw.includes(asset)) violations.push(`sw.js: precache entry missing for ${asset}`);
}

if (sw.includes("'./app.js'") || sw.includes("'./app.css'")) {
  violations.push('sw.js: fixed-name application assets must not be referenced');
}

if (fontCount === 0) {
  violations.push('KaTeX fonts were not emitted into dist/.');
}

if (violations.length) {
  console.error('Offline/PWA verification failed:');
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log(
  `Offline/PWA verification passed. Hashed bundles ${appJsPath} / ${appCssPath}, ${fontCount} local font asset(s), install manifest and versioned service worker verified.`
);
